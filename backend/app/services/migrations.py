"""Lightweight idempotent schema migrations.

Stop-gap until Alembic. Each helper is safe to call on every startup; it
queries the current schema and only applies its change when needed.

Adding a new column:
    add_column_if_missing(engine, "user", "tokens_revoked_at", "DATETIME")

When you outgrow this (renames, drops, data backfills, multi-DB targets),
adopt Alembic and delete this module.
"""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


def add_column_if_missing(
    engine: Engine,
    table: str,
    column: str,
    ddl: str,
) -> bool:
    """Add a column to an existing SQLite table if it doesn't already exist.

    `ddl` is the type and any constraints, e.g. "DATETIME" or "VARCHAR(64) NOT NULL DEFAULT ''".
    SQLite cannot add NOT NULL columns without a default — provide one if needed.

    Returns True if the column was added, False if it was already present.
    Raises if the dialect isn't SQLite or the ALTER fails for any other reason.
    """
    if engine.dialect.name != "sqlite":
        raise RuntimeError(
            f"add_column_if_missing only supports SQLite; got {engine.dialect.name}. "
            "Use Alembic for Postgres/MySQL."
        )

    with engine.connect() as conn:
        existing = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
        if any(row[1] == column for row in existing):  # row[1] is the column name
            return False

        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
        conn.commit()
        logger.info("migrations: added %s.%s (%s)", table, column, ddl)
        return True


def migrate_configvalue_composite_unique(engine: Engine) -> bool:
    """Rebuild `configurablevalue` with a composite (type, key) UNIQUE constraint.

    Older databases were created when the model declared `key` UNIQUE on its
    own. defaults.yaml now ships the same key under two types (e.g. "other" is
    both a specialty and a resource_type), which the single-column constraint
    rejects — crashing seed_database. SQLite can't drop a column-level UNIQUE
    in place, so we rename the old table, recreate from the current model
    definition (which carries the composite constraint), copy rows, and drop
    the old table.

    Idempotent: no-op once `uq_configvalue_type_key` exists, or if the table
    doesn't exist yet (create_all builds it correctly for fresh DBs).

    Returns True if a rebuild happened, False otherwise.
    """
    if engine.dialect.name != "sqlite":
        raise RuntimeError(
            f"migrate_configvalue_composite_unique only supports SQLite; got "
            f"{engine.dialect.name}. Use Alembic for Postgres/MySQL."
        )

    # Local import avoids a module-level cycle (migrations is imported early).
    from app.models import ConfigurableValue

    with engine.connect() as conn:
        table_exists = conn.execute(
            text(
                "SELECT 1 FROM sqlite_master "
                "WHERE type='table' AND name='configurablevalue'"
            )
        ).first()
        if not table_exists:
            return False  # fresh DB — create_all already made it correctly

        # SQLite implements a UniqueConstraint as an unnamed sqlite_autoindex,
        # so we detect the composite constraint by its COLUMNS, not its name.
        # If any unique index already covers exactly (type, key), we're migrated.
        indexes = conn.execute(text("PRAGMA index_list(configurablevalue)")).fetchall()
        for row in indexes:
            idx_name, is_unique = row[1], row[2]
            if not is_unique:
                continue
            cols = {
                info[2]
                for info in conn.execute(
                    text(f"PRAGMA index_info({idx_name})")
                ).fetchall()
            }
            if cols == {"type", "key"}:
                return False  # composite constraint present — already migrated

        conn.execute(
            text("ALTER TABLE configurablevalue RENAME TO _configurablevalue_old")
        )
        # Renaming keeps the old table's explicitly-named indexes (ix_*) with
        # their original names; they'd collide when we recreate the table. Drop
        # them now. (sqlite_autoindex_* entries belong to the old UNIQUE
        # constraint and disappear when the old table is dropped.)
        old_indexes = conn.execute(
            text("PRAGMA index_list(_configurablevalue_old)")
        ).fetchall()
        for row in old_indexes:
            name = row[1]
            if not name.startswith("sqlite_autoindex"):
                conn.execute(text(f"DROP INDEX {name}"))
        conn.commit()

    # Recreate from the current model (composite UNIQUE + indexes included).
    # __table__ is added by the SQLModel metaclass; not visible to mypy.
    ConfigurableValue.__table__.create(engine)  # type: ignore[attr-defined]

    with engine.connect() as conn:
        conn.execute(
            text(
                "INSERT INTO configurablevalue "
                "(id, type, key, label, description, category, is_active, "
                "created_at, updated_at) "
                "SELECT id, type, key, label, description, category, is_active, "
                "created_at, updated_at FROM _configurablevalue_old"
            )
        )
        conn.execute(text("DROP TABLE _configurablevalue_old"))
        conn.commit()
        logger.info(
            "migrations: rebuilt configurablevalue with composite (type,key) unique"
        )
    return True


def run_pending_migrations(engine: Engine) -> None:
    """Apply all pending schema migrations.

    Called once from the FastAPI lifespan after SQLModel.metadata.create_all.
    Add new entries below as the schema evolves.
    """
    # Branch 2: real token revocation after password reset / security event
    add_column_if_missing(engine, "user", "tokens_revoked_at", "DATETIME")

    # Branch QA: backfill JSON columns added after initial schema. SQLite stores
    # JSON as TEXT; defaults match the SQLModel field defaults so existing rows
    # stay valid. Devs with pre-existing local DBs hit
    # `OperationalError: no such column: user.professional_roles` without this.
    add_column_if_missing(
        engine, "user", "professional_roles", "TEXT DEFAULT '[\"Educator\"]'"
    )
    add_column_if_missing(engine, "user", "specialties", "TEXT DEFAULT '[]'")
    add_column_if_missing(
        engine,
        "user",
        "notification_prefs",
        "TEXT DEFAULT '{\"notify_requests\":true,\"notify_solutions\":false}'",
    )

    # Branch QA: drop the legacy single-column UNIQUE on configurablevalue.key
    # in favour of a composite (type, key) constraint so the same key can recur
    # across types (e.g. "other"). Fixes seed crashes on older databases.
    migrate_configvalue_composite_unique(engine)
