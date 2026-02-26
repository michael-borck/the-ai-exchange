"""Email notification service with flexible provider support."""

import logging
from datetime import datetime
from typing import Any

from jinja2 import Template

from app.core.config import settings
from app.models import Resource, User
from app.services.email_provider import get_email_provider

logger = logging.getLogger(__name__)

# In-memory store for mocked emails (for testing)
_email_log: list[dict[str, Any]] = []


# ---------------------------------------------------------------------------
# HTML email templates (Jinja2)
# ---------------------------------------------------------------------------

VERIFICATION_EMAIL_HTML = Template("""\
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to {{ app_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{ app_name }}!</h1>
            <p>Please verify your email address</p>
        </div>
        <div class="content">
            <p>Hello {{ user_name }},</p>
            <p>Thank you for registering with {{ app_name }}. To complete your registration and activate your account, please use the verification code below:</p>

            <div class="code-box">
                <div class="code">{{ verification_code }}</div>
            </div>

            <p><strong>Important:</strong> This code will expire in {{ expiry_minutes }} minutes for security reasons.</p>

            <p>If you didn't create an account with us, please ignore this email.</p>

            <p>Welcome aboard!<br>
            The {{ app_name }} Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
""")

PASSWORD_RESET_EMAIL_HTML = Template("""\
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Password Reset - {{ app_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: #fff; border: 2px dashed #f5576c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
            <p>{{ app_name }}</p>
        </div>
        <div class="content">
            <p>Hello {{ user_name }},</p>
            <p>We received a request to reset the password for your {{ app_name }} account ({{ user_email }}).</p>

            <div class="code-box">
                <div class="code">{{ reset_code }}</div>
            </div>

            <div class="warning">
                <strong>Security Notice:</strong> This reset code will expire in {{ expiry_minutes }} minutes. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>

            <p>For security reasons, please:</p>
            <ul>
                <li>Do not share this code with anyone</li>
                <li>Use this code only on the {{ app_name }} website</li>
                <li>Contact support if you suspect unauthorized access</li>
            </ul>

            <p>Best regards,<br>
            The {{ app_name }} Security Team</p>
        </div>
        <div class="footer">
            <p>This is an automated security message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
""")

NEW_REQUEST_EMAIL_HTML = Template("""\
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New AI Request - {{ app_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-box { background: #fff; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .tag { display: inline-block; background: #e8f4fd; color: #4facfe; padding: 4px 10px; border-radius: 12px; font-size: 13px; margin: 2px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New AI Request</h1>
            <p>A new request matches your interests</p>
        </div>
        <div class="content">
            <p>Hello {{ user_name }},</p>
            <p>A new request has been posted on {{ app_name }} that matches your subscribed tags:</p>

            <div class="detail-box">
                <h3 style="margin-top: 0;">{{ resource_title }}</h3>
                <p><strong>Tags:</strong> {% for tag in tags %}<span class="tag">{{ tag }}</span> {% endfor %}</p>
                <p><strong>Posted by:</strong> {{ posted_by }}</p>
            </div>

            <p>Visit {{ app_name }} to view the request and submit your solution.</p>

            <p>Best regards,<br>
            The {{ app_name }} Team</p>
        </div>
        <div class="footer">
            <p>You're receiving this because you're subscribed to tags related to this request.<br>
            Adjust your notification preferences in your account settings.</p>
        </div>
    </div>
</body>
</html>
""")

NEW_SOLUTION_EMAIL_HTML = Template("""\
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Solution - {{ app_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-box { background: #fff; border: 1px solid #e0e0e0; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Solution!</h1>
            <p>Someone responded to your request</p>
        </div>
        <div class="content">
            <p>Hello {{ user_name }},</p>
            <p>Great news! Someone has posted a solution to your request on {{ app_name }}.</p>

            <div class="detail-box">
                <h3 style="margin-top: 0;">{{ solution_title }}</h3>
                <p><strong>Posted by:</strong> {{ posted_by }}</p>
            </div>

            <p>Visit {{ app_name }} to view the solution and other responses.</p>

            <p>Best regards,<br>
            The {{ app_name }} Team</p>
        </div>
        <div class="footer">
            <p>You're receiving this because you posted a request on {{ app_name }}.<br>
            Adjust your notification preferences in your account settings.</p>
        </div>
    </div>
</body>
</html>
""")


# ---------------------------------------------------------------------------
# Email notification data structure
# ---------------------------------------------------------------------------

class EmailNotification:
    """Email notification data structure."""

    def __init__(
        self,
        recipient_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        notification_type: str,
    ):
        """Initialize email notification.

        Args:
            recipient_email: Recipient email address
            subject: Email subject
            html_body: Email body as HTML
            text_body: Email body as plain text (fallback)
            notification_type: Type of notification (new_request, new_solution, etc)
        """
        self.recipient_email = recipient_email
        self.subject = subject
        self.html_body = html_body
        self.text_body = text_body
        self.notification_type = notification_type
        self.timestamp = datetime.now()


def send_email(notification: EmailNotification) -> bool:
    """Send email notification using configured provider.

    Args:
        notification: Email notification to send

    Returns:
        True if successful, False otherwise
    """
    try:
        # Get the configured email provider
        provider = get_email_provider()

        # Send via provider
        success = provider.send_email(
            to_email=notification.recipient_email,
            subject=notification.subject,
            html_body=notification.html_body,
            text_body=notification.text_body,
            from_email=settings.mail_from,
            from_name=settings.mail_from_name,
        )

        if success:
            # Store in memory log for testing
            _email_log.append(
                {
                    "to": notification.recipient_email,
                    "subject": notification.subject,
                    "html_body": notification.html_body,
                    "text_body": notification.text_body,
                    "type": notification.notification_type,
                    "timestamp": notification.timestamp,
                }
            )

            logger.info(
                f"Email sent ({settings.email_provider}): "
                f"{notification.notification_type} to {notification.recipient_email}"
            )
        else:
            logger.error(
                f"Failed to send email via {settings.email_provider}: "
                f"{notification.notification_type} to {notification.recipient_email}"
            )

        return success
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False


def notify_new_request(
    resource: Resource,
    subscribers: list[User],
) -> int:
    """Notify subscribers when a new request is posted.

    Args:
        resource: The new request resource
        subscribers: List of users subscribed to matching tags

    Returns:
        Number of emails sent
    """
    if not subscribers:
        return 0

    app_name = "The AI Exchange"
    emails_sent = 0
    tags = resource.system_tags[:3] if resource.system_tags else ["General"]
    tags_str = ", ".join(tags)
    posted_by = "Anonymous" if resource.is_anonymous else "Faculty Member"

    for subscriber in subscribers:
        # Skip if subscriber has disabled request notifications
        if not subscriber.notification_prefs.get("notify_requests", True):
            continue

        subject = f"New AI Request: {resource.title}"

        html_body = NEW_REQUEST_EMAIL_HTML.render(
            app_name=app_name,
            user_name=subscriber.full_name,
            resource_title=resource.title,
            tags=tags,
            posted_by=posted_by,
        )

        text_body = (
            f"Hi {subscriber.full_name},\n\n"
            f"A new request has been posted on {app_name} that matches your interests:\n\n"
            f"Title: {resource.title}\n"
            f"Tags: {tags_str}\n"
            f"Posted by: {posted_by}\n\n"
            f"Visit {app_name} to view the request and submit your solution.\n\n"
            f"You're receiving this because you're subscribed to tags related to this request.\n"
            f"You can adjust your notification preferences in your account settings.\n\n"
            f"Best regards,\n"
            f"The {app_name} Team"
        )

        notification = EmailNotification(
            recipient_email=subscriber.email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            notification_type="new_request",
        )

        if send_email(notification):
            emails_sent += 1

    return emails_sent


def notify_new_solution(
    solution: Resource,
    requester: User,
) -> bool:
    """Notify requester when a solution is posted to their request.

    Args:
        solution: The new solution resource
        requester: The user who posted the original request

    Returns:
        True if email sent successfully
    """
    # Skip if requester has disabled solution notifications
    if not requester.notification_prefs.get("notify_solutions", True):
        return False

    app_name = "The AI Exchange"
    posted_by = "Anonymous" if solution.is_anonymous else "Faculty Member"

    subject = f"New Solution to Your Request: {solution.title}"

    html_body = NEW_SOLUTION_EMAIL_HTML.render(
        app_name=app_name,
        user_name=requester.full_name,
        solution_title=solution.title,
        posted_by=posted_by,
    )

    text_body = (
        f"Hi {requester.full_name},\n\n"
        f"Someone has posted a solution to your request!\n\n"
        f"Solution: {solution.title}\n"
        f"Posted by: {posted_by}\n\n"
        f"Visit {app_name} to view the solution and other responses.\n\n"
        f"You're receiving this because you posted a request on {app_name}.\n"
        f"You can adjust your notification preferences in your account settings.\n\n"
        f"Best regards,\n"
        f"The {app_name} Team"
    )

    notification = EmailNotification(
        recipient_email=requester.email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        notification_type="new_solution",
    )

    return send_email(notification)


def get_email_log() -> list[dict[str, Any]]:
    """Get log of all mocked emails sent (for testing).

    Returns:
        List of email records
    """
    return _email_log


def clear_email_log() -> None:
    """Clear email log (for testing).

    Used to reset state between tests.
    """
    global _email_log
    _email_log = []


def send_verification_email(user: User, verification_code: str) -> bool:
    """Send email verification code to user.

    Args:
        user: User who registered
        verification_code: 6-digit verification code

    Returns:
        True if email sent successfully
    """
    app_name = "The AI Exchange"

    subject = "Verify Your Email - The AI Exchange"

    html_body = VERIFICATION_EMAIL_HTML.render(
        app_name=app_name,
        user_name=user.full_name,
        verification_code=verification_code,
        expiry_minutes=60,
    )

    text_body = (
        f"Hi {user.full_name},\n\n"
        f"Welcome to {app_name}! Please verify your email address "
        f"to complete your registration.\n\n"
        f"Your verification code is: {verification_code}\n\n"
        f"This code will expire in 60 minutes.\n\n"
        f"Enter this code on the verification page to activate your account.\n\n"
        f"If you did not create this account, please ignore this email.\n\n"
        f"Do not share this code with anyone.\n\n"
        f"Best regards,\n"
        f"The {app_name} Team"
    )

    notification = EmailNotification(
        recipient_email=user.email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        notification_type="email_verification",
    )

    return send_email(notification)


def send_password_reset_email(user: User, reset_code: str) -> bool:
    """Send password reset code to user via email.

    Args:
        user: User requesting password reset
        reset_code: 6-digit reset code

    Returns:
        True if email sent successfully
    """
    app_name = "The AI Exchange"

    subject = "Password Reset Code for The AI Exchange"

    html_body = PASSWORD_RESET_EMAIL_HTML.render(
        app_name=app_name,
        user_name=user.full_name,
        user_email=user.email,
        reset_code=reset_code,
        expiry_minutes=30,
    )

    text_body = (
        f"Hi {user.full_name},\n\n"
        f"You requested a password reset for your {app_name} account.\n\n"
        f"Your password reset code is: {reset_code}\n\n"
        f"This code will expire in 30 minutes.\n\n"
        f"If you did not request a password reset, please ignore this email "
        f"and your password will remain unchanged.\n\n"
        f"Do not share this code with anyone. The {app_name} team will "
        f"never ask you for your reset code.\n\n"
        f"Best regards,\n"
        f"The {app_name} Team"
    )

    notification = EmailNotification(
        recipient_email=user.email,
        subject=subject,
        html_body=html_body,
        text_body=text_body,
        notification_type="password_reset",
    )

    return send_email(notification)
