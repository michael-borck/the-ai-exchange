"""Auto-tagging service using YAKE and optional LLM."""

import logging
from typing import Optional

import yake

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize YAKE keyword extractor
kw_extractor = yake.KeywordExtractor(
    lan="en",
    n=3,  # n-grams up to 3 words
    top=5,  # Return top 5 keywords
    features=None,
)


def extract_keywords_yake(text: str) -> list[str]:
    """Extract keywords from text using YAKE.

    Args:
        text: Text to extract keywords from

    Returns:
        List of keywords
    """
    try:
        keywords = kw_extractor.extract_keywords(text)
        # YAKE returns list of (keyword, score) tuples
        return [kw for kw, _ in keywords]
    except Exception as e:
        logger.warning(f"YAKE extraction failed: {e}")
        return []


def extract_keywords_llm(text: str) -> list[str]:
    """Extract keywords using configured LLM.

    Args:
        text: Text to extract keywords from

    Returns:
        List of keywords from LLM

    Note:
        Currently a placeholder. Real LLM integration would require
        API calls to OpenAI, Claude, Gemini, etc.
    """
    if not settings.llm_provider or not settings.llm_api_key:
        return []

    try:
        # TODO: Implement actual LLM integration
        # This would call OpenAI, Claude, Gemini, OpenRouter, or Ollama
        # based on settings.llm_provider
        logger.debug(f"LLM provider configured: {settings.llm_provider}")
        return []
    except Exception as e:
        logger.warning(f"LLM extraction failed: {e}")
        return []


def extract_keywords(text: str) -> list[str]:
    """Extract keywords using YAKE and optionally LLM.

    Strategy:
    1. Always run YAKE for base keywords
    2. If LLM configured, run LLM for additional insights
    3. Deduplicate and combine results

    Args:
        text: Text to extract keywords from

    Returns:
        List of unique keywords (YAKE + optional LLM)
    """
    # Always use YAKE
    yake_keywords = extract_keywords_yake(text)

    # Optionally enhance with LLM
    llm_keywords = extract_keywords_llm(text)

    # Combine and deduplicate (preserving order)
    seen = set()
    combined = []
    for kw in yake_keywords + llm_keywords:
        kw_lower = kw.lower()
        if kw_lower not in seen:
            seen.add(kw_lower)
            combined.append(kw)

    return combined[:5]  # Return max 5 keywords
