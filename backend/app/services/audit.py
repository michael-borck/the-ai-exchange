"""Audit log helper for security-relevant events.

Used by auth flows (login, registration, password reset) and admin actions
(role changes, deletions, config writes, secret updates). Commits the audit
row independently of the caller's transaction so successful audit records
survive a later rollback.
"""

from uuid import UUID

from sqlmodel import Session

from app.models import AuditLog


def audit_log(
    session: Session,
    action: str,
    user_id: UUID | None = None,
    detail: str | None = None,
    ip_address: str | None = None,
) -> None:
    """Write an audit log entry."""
    entry = AuditLog(
        user_id=user_id, action=action, detail=detail, ip_address=ip_address
    )
    session.add(entry)
    session.commit()
