"""
Static financial agent — rule-based savings suggestions.

Runs first in the AI routing chain (no API keys required).
"""
from __future__ import annotations

from app.schemas.finance import ParsedTransaction, SavingsSuggestion


def generate_suggestions(transactions: list[ParsedTransaction]) -> list[SavingsSuggestion]:
    suggestions: list[SavingsSuggestion] = []
    by_category: dict[str, list[ParsedTransaction]] = {}

    for t in transactions:
        cat = t.category or "other"
        by_category.setdefault(cat, []).append(t)

    # --- Bulk buying logic ---
    for cat in ["groceries", "shopping"]:
        txns = by_category.get(cat, [])
        if len(txns) >= 4:
            avg = abs(sum(t.amount for t in txns) / len(txns))
            suggestions.append(
                SavingsSuggestion(
                    category=cat,
                    suggestion=f"You have {len(txns)} {cat} transactions averaging ${avg:.2f}. "
                               f"Buying in bulk could reduce per-unit costs by 10–20%.",
                    estimated_savings=round(avg * len(txns) * 0.15, 2),
                    source="static",
                )
            )

    # --- Perishables / spoilage rules ---
    grocery_txns = by_category.get("groceries", [])
    if len(grocery_txns) >= 6:
        suggestions.append(
            SavingsSuggestion(
                category="groceries",
                suggestion="Frequent grocery trips may indicate perishable waste. "
                           "Meal-planning for 1–2 week cycles can cut spoilage by ~30%.",
                source="static",
            )
        )

    # --- Subscription review ---
    sub_txns = by_category.get("subscriptions", [])
    if sub_txns:
        total_subs = abs(sum(t.amount for t in sub_txns))
        suggestions.append(
            SavingsSuggestion(
                category="subscriptions",
                suggestion=f"You're spending ${total_subs:.2f} on subscriptions. "
                           f"Review and cancel unused ones — weekly vs monthly billing can also save 10–15%.",
                estimated_savings=round(total_subs * 0.20, 2),
                source="static",
            )
        )

    # --- Dining / consumption rate ---
    dining_txns = by_category.get("dining", [])
    if dining_txns:
        dining_total = abs(sum(t.amount for t in dining_txns))
        rate_per_week = dining_total / 4  # rough 4-week estimate
        suggestions.append(
            SavingsSuggestion(
                category="dining",
                suggestion=f"You spend ~${rate_per_week:.2f}/week dining out. "
                           f"Cooking 2 extra meals per week could save ${rate_per_week * 0.4:.2f}/week.",
                estimated_savings=round(dining_total * 0.40, 2),
                source="static",
            )
        )

    return suggestions
