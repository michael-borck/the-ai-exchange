"""Password reset service for secure password recovery."""

import random
from datetime import UTC, datetime, timedelta

from sqlmodel import Session, select

from app.models import PasswordReset, User
from app.services.email_service import send_password_reset_email


def generate_reset_code() -> str:
    """Generate a random 6-digit reset code.

    Returns:
        A 6-digit reset code as a string
    """
    return "".join(str(random.randint(0, 9)) for _ in range(6))


def create_and_send_password_reset(
    session: Session,
    user: User,
    expires_minutes: int = 30,
) -> tuple[bool, str]:
    """Create a password reset code and send it via email.

    Args:
        session: Database session
        user: User requesting password reset
        expires_minutes: Code expiration time in minutes (default 30)

    Returns:
        Tuple of (success: bool, reset_code: str)
    """
    try:
        # Generate unique 6-digit code
        reset_code = generate_reset_code()

        # Create password reset record
        expires_at = datetime.now(UTC) + timedelta(minutes=expires_minutes)
        password_reset = PasswordReset(
            user_id=user.id,
            token=reset_code,
            expires_at=expires_at,
        )

        session.add(password_reset)
        session.commit()

        # Send email with reset code
        success = send_password_reset_email(user, reset_code)

        if not success:
            # Clean up if email failed
            session.delete(password_reset)
            session.commit()
            return False, ""

        return True, reset_code

    except Exception:
        session.rollback()
        return False, ""


def verify_reset_code(
    session: Session,
    email: str,
    code: str,
) -> tuple[bool, User | None, str]:
    """Verify a password reset code.

    Args:
        session: Database session
        email: User's email
        code: Reset code to verify

    Returns:
        Tuple of (is_valid: bool, user: User | None, error_message: str)
    """
    try:
        # Find user
        user = session.exec(
            select(User).where(User.email == email.lower())
        ).first()

        if not user:
            return False, None, "User not found"

        # Find matching reset code
        reset_record = session.exec(
            select(PasswordReset).where(
                (PasswordReset.user_id == user.id)
                & (PasswordReset.token == code)
            )
        ).first()

        if not reset_record:
            return False, None, "Invalid reset code"

        # Check validity
        if not reset_record.is_valid:
            if reset_record.is_expired:
                return False, None, "Reset code has expired"
            else:
                return False, None, "Reset code has already been used"

        return True, user, ""

    except Exception as e:
        return False, None, f"Error verifying reset code: {str(e)}"


def mark_reset_code_used(
    session: Session,
    email: str,
    code: str,
) -> bool:
    """Mark a reset code as used.

    Args:
        session: Database session
        email: User's email
        code: Reset code to mark as used

    Returns:
        True if successful
    """
    try:
        user = session.exec(
            select(User).where(User.email == email.lower())
        ).first()

        if not user:
            return False

        reset_record = session.exec(
            select(PasswordReset).where(
                (PasswordReset.user_id == user.id)
                & (PasswordReset.token == code)
            )
        ).first()

        if reset_record:
            reset_record.used = True
            session.add(reset_record)
            session.commit()
            return True

        return False

    except Exception:
        session.rollback()
        return False
