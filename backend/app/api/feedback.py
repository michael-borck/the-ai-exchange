"""Feedback endpoint for sending user feedback via email."""

import logging

from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel
from sqlmodel import Session

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.api.auth import get_current_user
from app.models import User
from app.services.database import get_session
from app.services.email_service import EmailNotification, send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix=f"{settings.api_v1_str}/feedback", tags=["feedback"])

FEEDBACK_RECIPIENT = "michael.borck@curtin.edu.au"


class FeedbackRequest(BaseModel):
    """Feedback submission request."""

    feedback_type: str
    subject: str
    message: str


class FeedbackResponse(BaseModel):
    """Feedback submission response."""

    message: str


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def submit_feedback(
    request: Request,  # noqa: ARG001 - required by slowapi for rate limiting
    feedback: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),  # noqa: ARG001
) -> FeedbackResponse:
    """Submit user feedback via email.

    Args:
        feedback: Feedback data (type, subject, message)
        current_user: Authenticated user submitting feedback
        session: Database session

    Returns:
        Success message
    """
    subject = f"[AI Exchange Feedback] [{feedback.feedback_type}] {feedback.subject}"

    text_body = (
        f"Feedback from: {current_user.full_name} ({current_user.email})\n"
        f"Type: {feedback.feedback_type}\n"
        f"Subject: {feedback.subject}\n\n"
        f"{feedback.message}"
    )

    html_body = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Feedback</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
      <h2 style="margin: 0;">New Feedback Received</h2>
    </div>
    <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
      <p><strong>From:</strong> {current_user.full_name} ({current_user.email})</p>
      <p><strong>Type:</strong> {feedback.feedback_type}</p>
      <p><strong>Subject:</strong> {feedback.subject}</p>
      <hr style="border: 1px solid #ddd;">
      <p>{feedback.message.replace(chr(10), '<br>')}</p>
    </div>
  </div>
</body>
</html>"""

    notification = EmailNotification(
        recipient_email=FEEDBACK_RECIPIENT,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        notification_type="feedback",
    )

    try:
        success = send_email(notification)
        if success:
            return FeedbackResponse(message="Feedback sent successfully. Thank you!")
        else:
            logger.error(f"Failed to send feedback email from {current_user.email}")
            return FeedbackResponse(message="Feedback received, but email delivery failed. We'll follow up.")
    except Exception as e:
        logger.error(f"Error sending feedback email: {e}")
        return FeedbackResponse(message="Feedback received, but email delivery failed. We'll follow up.")
