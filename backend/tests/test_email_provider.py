"""Tests for the email provider factory and the Resend provider."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.email_provider import (
    DevEmailProvider,
    ResendEmailProvider,
    get_email_provider,
)


def test_factory_returns_resend_provider() -> None:
    """EMAIL_PROVIDER=resend resolves to ResendEmailProvider."""
    with patch("app.services.email_provider.settings") as mock_settings:
        mock_settings.email_provider = "resend"
        assert isinstance(get_email_provider(), ResendEmailProvider)


def test_factory_returns_dev_provider() -> None:
    """EMAIL_PROVIDER=dev resolves to DevEmailProvider."""
    with patch("app.services.email_provider.settings") as mock_settings:
        mock_settings.email_provider = "dev"
        assert isinstance(get_email_provider(), DevEmailProvider)


def test_factory_rejects_unknown_provider() -> None:
    """Unknown provider names raise a ValueError listing valid options."""
    with patch("app.services.email_provider.settings") as mock_settings:
        mock_settings.email_provider = "pigeon"
        with pytest.raises(ValueError, match="resend"):
            get_email_provider()


def test_resend_sends_expected_payload() -> None:
    """Resend provider posts the right JSON and returns True on 200."""
    with (
        patch("app.services.email_provider.settings") as mock_settings,
        patch("app.services.email_provider.requests") as mock_requests,
    ):
        mock_settings.resend_api_key = "re_test_key"
        mock_settings.mail_from = "noreply@curtin.edu.au"
        mock_settings.mail_from_name = "The AI Exchange"
        mock_requests.post.return_value = MagicMock(status_code=200)

        ok = ResendEmailProvider().send_email(
            to_email="staff@curtin.edu.au",
            subject="Verify your email",
            html_body="<b>123456</b>",
            text_body="123456",
        )

        assert ok is True
        _, kwargs = mock_requests.post.call_args
        assert mock_requests.post.call_args[0][0] == "https://api.resend.com/emails"
        assert kwargs["headers"]["Authorization"] == "Bearer re_test_key"
        assert kwargs["json"] == {
            "from": "The AI Exchange <noreply@curtin.edu.au>",
            "to": ["staff@curtin.edu.au"],
            "subject": "Verify your email",
            "html": "<b>123456</b>",
            "text": "123456",
        }


def test_resend_returns_false_on_api_error() -> None:
    """Non-200 responses are reported as failure, not raised."""
    with (
        patch("app.services.email_provider.settings") as mock_settings,
        patch("app.services.email_provider.requests") as mock_requests,
    ):
        mock_settings.resend_api_key = "re_test_key"
        mock_settings.mail_from = "noreply@curtin.edu.au"
        mock_settings.mail_from_name = "The AI Exchange"
        mock_requests.post.return_value = MagicMock(status_code=422, text="invalid from")

        ok = ResendEmailProvider().send_email(
            to_email="staff@curtin.edu.au",
            subject="Verify your email",
            html_body="<b>123456</b>",
            text_body="123456",
        )
        assert ok is False


def test_resend_returns_false_without_api_key() -> None:
    """Missing RESEND_API_KEY fails gracefully instead of raising."""
    with patch("app.services.email_provider.settings") as mock_settings:
        mock_settings.resend_api_key = None

        ok = ResendEmailProvider().send_email(
            to_email="staff@curtin.edu.au",
            subject="Verify your email",
            html_body="<b>123456</b>",
            text_body="123456",
        )
        assert ok is False
