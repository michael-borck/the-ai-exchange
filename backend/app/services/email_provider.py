"""Email provider factory and implementations for flexible email delivery."""

import logging
import smtplib
from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


class EmailProvider(ABC):
    """Abstract base class for email providers."""

    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> bool:
        """Send an email with both HTML and plain text bodies.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: Email body as HTML
            text_body: Email body as plain text (fallback)
            from_email: Sender email address
            from_name: Sender name

        Returns:
            True if successful, False otherwise
        """
        pass


class DevEmailProvider(EmailProvider):
    """Development email provider - logs to console (no actual sending)."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> bool:
        """Log email to console for development."""
        from_email = from_email or settings.mail_from
        from_name = from_name or settings.mail_from_name

        print(
            f"\n{'='*70}\n"
            f"[DEV EMAIL]\n"
            f"{'='*70}\n"
            f"From: {formataddr((from_name, from_email))}\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"{'='*70}\n"
            f"[PLAIN TEXT]\n{text_body}\n"
            f"{'='*70}\n"
            f"[HTML]\n{html_body}\n"
            f"{'='*70}\n"
        )
        return True


class SMTPEmailProvider(EmailProvider):
    """Generic SMTP email provider for custom mail servers."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> bool:
        """Send email via SMTP server."""
        try:
            from_email = from_email or settings.mail_from
            from_name = from_name or settings.mail_from_name

            logger.info(f"SMTP: Sending '{subject}' to {to_email} via {settings.smtp_server}:{settings.smtp_port}")

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = formataddr((from_name, from_email))
            msg["To"] = to_email

            # Order matters: plain text first, HTML last (preferred by clients)
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Connect and send
            if settings.use_ssl:
                smtp = smtplib.SMTP_SSL(settings.smtp_server, settings.smtp_port)
            else:
                smtp = smtplib.SMTP(settings.smtp_server, settings.smtp_port)

            if settings.use_tls:
                smtp.starttls()

            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)

            smtp.send_message(msg)
            smtp.quit()

            logger.info(f"SMTP: Successfully sent '{subject}' to {to_email}")
            return True
        except Exception as e:
            logger.error(f"SMTP: Failed to send '{subject}' to {to_email}: {e}")
            return False


class GmailEmailProvider(EmailProvider):
    """Gmail email provider using app-specific password."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> bool:
        """Send email via Gmail SMTP."""
        try:
            if not settings.gmail_app_password:
                print("Error: GMAIL_APP_PASSWORD not configured")
                return False

            from_email = from_email or settings.mail_from
            from_name = from_name or settings.mail_from_name

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = formataddr((from_name, from_email))
            msg["To"] = to_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Connect to Gmail SMTP
            smtp = smtplib.SMTP_SSL("smtp.gmail.com", 465)
            smtp.login(from_email, settings.gmail_app_password)
            smtp.send_message(msg)
            smtp.quit()

            return True
        except Exception as e:
            print(f"Error sending email via Gmail: {e}")
            return False


class SendGridEmailProvider(EmailProvider):
    """SendGrid email provider using API key."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> bool:
        """Send email via SendGrid API."""
        try:
            if not HAS_REQUESTS:
                print("Error: requests module not installed (required for SendGrid)")
                return False

            if not settings.sendgrid_api_key:
                print("Error: SENDGRID_API_KEY not configured")
                return False

            from_email = from_email or settings.mail_from
            from_name = from_name or settings.mail_from_name

            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {settings.sendgrid_api_key}",
                "Content-Type": "application/json",
            }

            data = {
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": from_email, "name": from_name},
                "subject": subject,
                "content": [
                    {"type": "text/plain", "value": text_body},
                    {"type": "text/html", "value": html_body},
                ],
            }

            response = requests.post(url, json=data, headers=headers, timeout=10)

            return response.status_code in [200, 202]
        except Exception as e:
            print(f"Error sending email via SendGrid: {e}")
            return False


class CurtinEmailProvider(EmailProvider):
    """Curtin University email provider (SMTP wrapper)."""

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        from_email: str | None = None,
        from_name: str | None = None,
    ) -> bool:
        """Send email via Curtin SMTP server."""
        try:
            from_email = from_email or settings.mail_from
            from_name = from_name or settings.mail_from_name

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = formataddr((from_name, from_email))
            msg["To"] = to_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Curtin uses TLS on port 587
            smtp = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
            smtp.starttls()

            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)

            smtp.send_message(msg)
            smtp.quit()

            return True
        except Exception as e:
            print(f"Error sending email via Curtin: {e}")
            return False


def get_email_provider() -> EmailProvider:
    """Factory function to get the appropriate email provider.

    Returns:
        EmailProvider instance based on configured EMAIL_PROVIDER

    Raises:
        ValueError: If EMAIL_PROVIDER is not supported
    """
    provider = settings.email_provider.lower()

    providers = {
        "dev": DevEmailProvider,
        "gmail": GmailEmailProvider,
        "sendgrid": SendGridEmailProvider,
        "custom": SMTPEmailProvider,
        "curtin": CurtinEmailProvider,
    }

    if provider not in providers:
        raise ValueError(
            f"Unsupported email provider: {provider}. "
            f"Supported: {', '.join(providers.keys())}"
        )

    return providers[provider]()
