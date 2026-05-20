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


def run_pending_migrations(engine: Engine) -> None:
    """Apply all pending schema migrations.

    Called once from the FastAPI lifespan after SQLModel.metadata.create_all.
    Add new entries below as the schema evolves.
    """
    # Branch 2: real token revocation after password reset / security event
    add_column_if_missing(engine, "user", "tokens_revoked_at", "DATETIME")
