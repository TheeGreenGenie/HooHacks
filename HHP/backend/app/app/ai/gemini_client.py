"""
Gemini client — AI savings suggestions and user profile from financial data.
Stubbed when GEMINI_API_KEY is not set.
"""
from __future__ import annotations

import json
from app.core.config import settings
from app.schemas.finance import ParsedTransaction, SavingsSuggestion


def get_suggestions(transactions: list[ParsedTransaction]) -> list[SavingsSuggestion]:
    """Call Gemini to generate savings suggestions. Returns [] when key missing or on error."""
    if not settings.GEMINI_API_KEY:
        return []
    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")

        tx_lines = "\n".join(
            f"{t.date or 'unknown'} | {t.description} | ${t.amount:.2f} | {t.category or 'other'}"
            for t in transactions[:40]
        ) or "No transaction history yet."

        prompt = (
            "You are a personal finance advisor. Based on these spending transactions:\n\n"
            f"{tx_lines}\n\n"
            "Give 4 concise, actionable savings suggestions as a JSON array:\n"
            '[{"category": "...", "suggestion": "...", "estimated_savings": <number or null>}]\n'
            "Respond with valid JSON only — no markdown, no explanation."
        )

        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        items = json.loads(raw.strip())
        return [
            SavingsSuggestion(
                category=item.get("category", "general"),
                suggestion=item.get("suggestion", ""),
                estimated_savings=item.get("estimated_savings"),
                source="gemini",
            )
            for item in items
            if item.get("suggestion")
        ]
    except Exception:
        return []


def generate_user_profile(transactions: list[ParsedTransaction]) -> dict:
    """
    Call Gemini to build a structured user profile JSON from transaction data.
    Returns stub data when GEMINI_API_KEY is missing.
    """
    if not settings.GEMINI_API_KEY:
        return _stub_profile(transactions)

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")

        tx_summary = "\n".join(
            f"{t.date or 'unknown'} | {t.description} | ${t.amount:.2f} | {t.category}"
            for t in transactions[:50]  # limit context
        )

        prompt = (
            "You are a financial analyst. Based on the following transactions, "
            "generate a JSON user profile with fields: "
            "income_bracket, spending_habits (list), savings_potential, risk_profile, top_categories.\n\n"
            f"Transactions:\n{tx_summary}\n\n"
            "Respond ONLY with valid JSON."
        )

        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception:
        return _stub_profile(transactions)


def _stub_profile(transactions: list[ParsedTransaction]) -> dict:
    total_income = sum(t.amount for t in transactions if t.amount > 0)
    total_expenses = abs(sum(t.amount for t in transactions if t.amount < 0))
    return {
        "source": "stub",
        "income_bracket": "unknown",
        "spending_habits": list({t.category for t in transactions if t.category}),
        "savings_potential": round(max(0.0, total_income - total_expenses), 2),
        "risk_profile": "medium",
        "top_categories": [],
    }
