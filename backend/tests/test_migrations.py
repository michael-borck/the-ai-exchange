"""Tests for the lightweight schema migrations in app.services.migrations."""

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlmodel import create_engine

from app.services.migrations import migrate_configvalue_composite_unique

# Mirrors the legacy schema: `key` UNIQUE on its own (pre composite constraint).
_OLD_SCHEMA = """
CREATE TABLE configurablevalue (
    id CHAR(32) NOT NULL PRIMARY KEY,
    type VARCHAR NOT NULL,
    key VARCHAR NOT NULL UNIQUE,
    label VARCHAR NOT NULL,
    description VARCHAR,
    category VARCHAR,
    is_active BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
)
"""

_ROW = (
    "INSERT INTO configurablevalue VALUES "
    "('a1','SPECIALTY','other','Other','desc','General',1,'2026-01-01','2026-01-01')"
)


@pytest.fixture
def old_schema_engine(tmp_path):
    """A SQLite DB built with the legacy single-column UNIQUE on key."""
    engine = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with engine.connect() as conn:
        conn.execute(text(_OLD_SCHEMA))
        conn.execute(text("CREATE INDEX ix_configurablevalue_type ON configurablevalue (type)"))
        conn.execute(text(_ROW))
        conn.commit()
    return engine


def _insert(conn, id_, type_, key):
    conn.execute(
        text(
            f"INSERT INTO configurablevalue VALUES "
            f"('{id_}','{type_}','{key}','L','d',NULL,1,'2026-01-01','2026-01-01')"
        )
    )
    conn.commit()


def test_old_schema_rejects_cross_type_duplicate_key(old_schema_engine):
    """Sanity check: the legacy schema is the bug we're fixing."""
    with old_schema_engine.connect() as conn, pytest.raises(IntegrityError):
        _insert(conn, "b1", "RESOURCE_TYPE", "other")


def test_migration_rebuilds_with_composite_unique(old_schema_engine):
    rebuilt = migrate_configvalue_composite_unique(old_schema_engine)
    assert rebuilt is True

    with old_schema_engine.connect() as conn:
        # Data preserved
        rows = conn.execute(
            text("SELECT type, key FROM configurablevalue")
        ).fetchall()
        assert rows == [("SPECIALTY", "other")]

        # Same key under a different type is now allowed
        _insert(conn, "b1", "RESOURCE_TYPE", "other")

        # Same (type, key) is still rejected
        with pytest.raises(IntegrityError):
            _insert(conn, "c1", "SPECIALTY", "other")


def test_migration_is_idempotent(old_schema_engine):
    assert migrate_configvalue_composite_unique(old_schema_engine) is True
    # Second run detects the composite constraint and does nothing
    assert migrate_configvalue_composite_unique(old_schema_engine) is False


def test_migration_noop_when_table_absent(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'empty.db'}")
    assert migrate_configvalue_composite_unique(engine) is False
