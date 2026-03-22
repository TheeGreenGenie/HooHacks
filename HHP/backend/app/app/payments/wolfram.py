"""
Wolfram Alpha payment/calculation stub.

Uses Wolfram Short Answers API for financial calculations:
currency conversion, net worth estimation, compound interest, etc.

Set WOLFRAM_APP_ID in .env to activate.
"""
from __future__ import annotations

from app.core.config import settings


def query(question: str) -> dict:
    """Ask Wolfram Alpha a financial question and get a plain-text answer."""
    app_id = getattr(settings, "WOLFRAM_APP_ID", None)
    if not app_id:
        return {
            "status": "stub",
            "question": question,
            "answer": "Wolfram Alpha not configured — set WOLFRAM_APP_ID in .env.",
        }
    try:
        import httpx
        url = "https://api.wolframalpha.com/v1/result"
        resp = httpx.get(url, params={"appid": app_id, "i": question}, timeout=10)
        resp.raise_for_status()
        return {"status": "ok", "question": question, "answer": resp.text}
    except Exception as exc:
        return {"status": "error", "question": question, "answer": str(exc)}


def convert_currency(amount: float, from_currency: str, to_currency: str) -> dict:
    return query(f"Convert {amount} {from_currency} to {to_currency}")
