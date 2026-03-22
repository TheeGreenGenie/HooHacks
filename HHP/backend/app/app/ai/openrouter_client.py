"""
OpenRouter client — alternative AI provider for savings suggestions.

Insert in fallback chain between Snowflake and local rules.
Set OPENROUTER_API_KEY in .env to activate.
"""
from __future__ import annotations

from app.core.config import settings
from app.schemas.finance import ParsedTransaction, SavingsSuggestion


class QuotaExceeded(Exception):
    """Raised when an AI provider returns a rate-limit / quota error."""


def get_suggestions(transactions: list[ParsedTransaction]) -> list[SavingsSuggestion]:
    if not getattr(settings, "OPENROUTER_API_KEY", None):
        return []

    try:
        import httpx  # type: ignore

        tx_lines = "\n".join(
            f"{t.date or 'unknown'} | {t.description} | ${t.amount:.2f} | {t.category or 'other'}"
            for t in transactions[:30]
        )
        prompt = (
            "You are a personal finance advisor. Given these spending transactions:\n\n"
            f"{tx_lines}\n\n"
            "Give 3 concise, actionable savings suggestions as a JSON array: "
            '[{"category": "...", "suggestion": "...", "estimated_savings": <number or null>}]. '
            "Respond with valid JSON only."
        )

        resp = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mistralai/mistral-7b-instruct",
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=20,
        )

        if resp.status_code == 429:
            raise QuotaExceeded("OpenRouter quota exceeded")
        resp.raise_for_status()

        import json
        content = resp.json()["choices"][0]["message"]["content"]
        items = json.loads(content)
        return [
            SavingsSuggestion(
                category=item.get("category", "general"),
                suggestion=item.get("suggestion", ""),
                estimated_savings=item.get("estimated_savings"),
                source="openrouter",
            )
            for item in items
        ]
    except QuotaExceeded:
        raise
    except Exception:
        return []
