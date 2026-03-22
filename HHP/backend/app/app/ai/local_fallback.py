"""
Local fallback — deterministic rule-based suggestions when all AI APIs are quota-exhausted.
"""
from __future__ import annotations

from app.schemas.finance import ParsedTransaction, SavingsSuggestion


def get_suggestions(transactions: list[ParsedTransaction]) -> list[SavingsSuggestion]:
    return [
        SavingsSuggestion(category="budgeting", suggestion="Track every expense for one month to find hidden spending leaks.", source="fallback"),
        SavingsSuggestion(category="savings", suggestion="Build a 3-month emergency fund before making new investments.", source="fallback"),
        SavingsSuggestion(category="debt", suggestion="Pay minimums on all debts, then throw extra cash at the highest-rate one first.", source="fallback"),
        SavingsSuggestion(category="groceries", suggestion="Buy store-brand staples — quality is usually identical at 20–40% lower cost.", source="fallback"),
        SavingsSuggestion(category="subscriptions", suggestion="Cancel subscriptions you haven't used in the last 30 days.", source="fallback"),
        SavingsSuggestion(category="dining", suggestion="Cooking at home just 3 more nights per week can save $100–$200/month.", source="fallback"),
    ]
