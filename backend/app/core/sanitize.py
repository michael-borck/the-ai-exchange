"""Input sanitization utilities to prevent XSS."""

import bleach


def sanitize_html(text: str) -> str:
    """Strip all HTML tags from user input.

    All user-submitted text content is stored as plain text.
    This prevents stored XSS even if the frontend renders unsafely.
    """
    return bleach.clean(text, tags=[], attributes={}, strip=True)
