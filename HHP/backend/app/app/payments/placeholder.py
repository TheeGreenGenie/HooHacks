"""
Payments placeholder module.

All payment logic is gated behind the ENABLE_PAYMENTS environment flag.
When False (default), every call returns a stub response so the rest of
the app never breaks due to missing payment credentials.
"""
from __future__ import annotations

from app.core.config import settings


def is_enabled() -> bool:
    return settings.ENABLE_PAYMENTS


def process_payment(amount: float, currency: str = "USD", description: str = "") -> dict:
    if not is_enabled():
        return {
            "status": "stub",
            "message": "Payments disabled — set ENABLE_PAYMENTS=true to activate.",
            "amount": amount,
            "currency": currency,
        }
    # Real payment provider integration goes here (Stripe, etc.)
    raise NotImplementedError("Payment provider not yet integrated")
