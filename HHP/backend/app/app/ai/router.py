"""
AI routing: static first → Snowflake second → OpenRouter third → local fallback (quota errors only).
"""
from __future__ import annotations

from app.schemas.finance import ParsedTransaction, SavingsSuggestion
from app.services import financial_agent
from app.ai import gemini_client, snowflake_client, local_fallback, openrouter_client
from app.ai.openrouter_client import QuotaExceeded

_STATIC_PADDING: list[SavingsSuggestion] = [
    SavingsSuggestion(category="budgeting", suggestion="Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.", source="fallback"),
    SavingsSuggestion(category="savings", suggestion="Automate a fixed transfer to savings on payday so you pay yourself first.", source="fallback"),
    SavingsSuggestion(category="debt", suggestion="Pay off the highest-interest debt first (avalanche method) to minimise total interest paid.", source="fallback"),
    SavingsSuggestion(category="groceries", suggestion="Plan meals for the week before shopping to avoid impulse buys and food waste.", source="fallback"),
    SavingsSuggestion(category="subscriptions", suggestion="Audit your subscriptions every 3 months and cancel anything unused.", source="fallback"),
    SavingsSuggestion(category="utilities", suggestion="Reducing your thermostat by 1°F can cut heating costs by ~3% per month.", source="fallback"),
    SavingsSuggestion(category="shopping", suggestion="Wait 48 hours before making any non-essential purchase over $50.", source="fallback"),
    SavingsSuggestion(category="dining", suggestion="Packing lunch 3 days a week instead of eating out can save $150–$200/month.", source="fallback"),
]

_FREQUENCY_TIPS: dict[str, SavingsSuggestion] = {
    "weekly": SavingsSuggestion(
        category="shopping",
        suggestion="Weekly shoppers: buy perishables fresh but stock non-perishables in bulk to cut per-unit costs.",
        source="fallback",
    ),
    "monthly": SavingsSuggestion(
        category="shopping",
        suggestion="Monthly shoppers: keep a running list throughout the month to consolidate trips and reduce impulse spending.",
        source="fallback",
    ),
    "auto": SavingsSuggestion(
        category="shopping",
        suggestion="Auto-delivery (Amazon Subscribe & Save, Instacart) can save 5–15% on recurring items — review quantities quarterly.",
        source="fallback",
    ),
}


def get_all_suggestions(
    transactions: list[ParsedTransaction],
    frequency: str = "monthly",
) -> list[SavingsSuggestion]:
    suggestions: list[SavingsSuggestion] = []
    quota_hit = False

    # 1. Static rule-based agent (always runs — instant, no API)
    suggestions.extend(financial_agent.generate_suggestions(transactions))

    # 2. Gemini (primary AI — key is configured)
    try:
        suggestions.extend(gemini_client.get_suggestions(transactions))
    except Exception:
        pass

    # 3. Snowflake Cortex (if credentials set)
    try:
        suggestions.extend(snowflake_client.get_suggestions(transactions))
    except QuotaExceeded:
        quota_hit = True
    except Exception:
        pass

    # 4. OpenRouter (fallback if no AI suggestions generated yet)
    has_ai = any(s.source in ("gemini", "snowflake", "openrouter") for s in suggestions)
    if quota_hit or not has_ai:
        try:
            suggestions.extend(openrouter_client.get_suggestions(transactions))
        except QuotaExceeded:
            quota_hit = True
        except Exception:
            pass

    # 5. Local fallback — only when quota exhausted and nothing else worked
    if quota_hit and not suggestions:
        suggestions.extend(local_fallback.get_suggestions(transactions))

    # 6. Add frequency-specific tip
    if frequency in _FREQUENCY_TIPS:
        suggestions.append(_FREQUENCY_TIPS[frequency])

    # 7. Pad to minimum 6 suggestions with static advice
    needed = max(0, 6 - len(suggestions))
    for tip in _STATIC_PADDING[:needed]:
        suggestions.append(tip)

    return suggestions


def get_user_profile(transactions: list[ParsedTransaction]) -> dict:
    """Run Gemini profile generation with local fallback."""
    return gemini_client.generate_user_profile(transactions)
