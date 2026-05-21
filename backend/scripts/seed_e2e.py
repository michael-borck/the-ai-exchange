"""Seed a test database for Playwright e2e runs.

Creates the schema, runs migrations, seeds configurable values, and inserts a
verified admin plus a verified regular user. Idempotent: safe to re-run.

Usage:
    DATABASE_URL=sqlite:///./e2e_test.db python scripts/seed_e2e.py
"""

import sys
from pathlib import Path

# Allow running as `python scripts/seed_e2e.py` from the backend dir.
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, SQLModel, select  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.models import User, UserRole  # noqa: E402
from app.services.config import ConfigService  # noqa: E402
from app.services.database import engine  # noqa: E402
from app.services.migrations import run_pending_migrations  # noqa: E402

ADMIN_EMAIL = "e2e-admin@curtin.edu.au"
USER_EMAIL = "e2e-user@curtin.edu.au"
PASSWORD = "E2ePass123!"


def _ensure_user(session: Session, email: str, full_name: str, role: UserRole) -> None:
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        return
    session.add(
        User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(PASSWORD),
            role=role,
            is_active=True,
            is_verified=True,
            is_approved=True,
        )
    )
    session.commit()


def main() -> None:
    SQLModel.metadata.create_all(engine)
    run_pending_migrations(engine)
    with Session(engine) as session:
        ConfigService.seed_database(session)
        _ensure_user(session, ADMIN_EMAIL, "E2E Admin", UserRole.ADMIN)
        _ensure_user(session, USER_EMAIL, "E2E User", UserRole.STAFF)
    print(f"Seeded e2e DB: admin={ADMIN_EMAIL}, user={USER_EMAIL}")


if __name__ == "__main__":
    main()
