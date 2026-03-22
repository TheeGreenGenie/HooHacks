"""
document_parser.py — Normalize raw OCR text into ParsedTransaction objects.

Uses regex heuristics to find lines that look like financial transactions.
Computes income/spending summaries and yearly totals.
"""
from __future__ import annotations

import re
from app.schemas.finance import ParsedTransaction, FinancialSummary

# Match lines like: "2026-01-15  Coffee Shop  -12.50"
# or "Jan 15 2026  SALARY  +2500.00"
_TRANSACTION_RE = re.compile(
    r"(?P<date>\d{4}-\d{2}-\d{2}|[A-Za-z]{3}\s+\d{1,2}\s+\d{4})"
    r"\s+"
    r"(?P<desc>[A-Za-z0-9 &',\-\.\(\)\/]+?)"
    r"\s+"
    r"(?P<amount>[+-]?\$?[\d,]+(?:\.\d{2})?)",
    re.IGNORECASE,
)

# Simple keyword-based categorizer
_CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "dining": ["coffee", "restaurant", "cafe", "food", "doordash", "grubhub", "uber eats"],
    "groceries": ["grocery", "supermarket", "whole foods", "trader joe", "safeway", "kroger"],
    "income": ["salary", "deposit", "payroll", "direct dep", "wage", "income"],
    "subscriptions": ["netflix", "spotify", "hulu", "amazon prime", "subscription"],
    "transport": ["uber", "lyft", "gas", "fuel", "parking", "transit", "metro"],
    "utilities": ["electric", "water", "internet", "phone", "bill"],
    "shopping": ["amazon", "walmart", "target", "ebay", "shop"],
}


def _categorize(description: str) -> str:
    lower = description.lower()
    for category, keywords in _CATEGORY_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return category
    return "other"


def _parse_amount(raw: str) -> float:
    cleaned = raw.replace("$", "").replace(",", "")
    return float(cleaned)


def parse_ocr_text(text: str) -> list[ParsedTransaction]:
    """Extract transactions from raw OCR text."""
    transactions: list[ParsedTransaction] = []
    for line in text.splitlines():
        m = _TRANSACTION_RE.search(line)
        if m:
            amount = _parse_amount(m.group("amount"))
            desc = m.group("desc").strip()
            transactions.append(
                ParsedTransaction(
                    date=m.group("date"),
                    description=desc,
                    amount=amount,
                    category=_categorize(desc),
                )
            )
    return transactions


_BILL_CATEGORIES = {"utilities", "subscriptions"}


def compute_summary(
    transactions: list[ParsedTransaction],
    manual_income: float | None = None,
) -> FinancialSummary:
    """Compute income/spending totals, bills, and disposable income."""
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = sum(t.amount for t in transactions if t.amount < 0)

    by_category: dict[str, float] = {}
    for t in transactions:
        cat = t.category or "other"
        by_category[cat] = by_category.get(cat, 0.0) + t.amount

    # Bills = utilities + subscriptions (recurring fixed costs)
    bills_total = abs(sum(v for k, v in by_category.items() if k in _BILL_CATEGORIES))

    # Use manual income if provided and higher than detected income
    effective_income = max(total_income, manual_income or 0)
    net = round(effective_income + total_expenses, 2)
    disposable = round(net - bills_total, 2)

    yearly_income = effective_income * 12
    yearly_expenses = total_expenses * 12

    return FinancialSummary(
        total_income=round(effective_income, 2),
        total_expenses=round(total_expenses, 2),
        net=net,
        by_category={k: round(v, 2) for k, v in by_category.items()},
        yearly_total_income=round(yearly_income, 2),
        yearly_total_expenses=round(yearly_expenses, 2),
        bills_total=round(bills_total, 2),
        disposable_income=disposable,
        manual_income=manual_income,
    )
