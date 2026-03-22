"""
Stripe credit/debit payment stub.

Activates when ENABLE_PAYMENTS=true and STRIPE_SECRET_KEY is set.
Workflow: create PaymentIntent → confirm → return client_secret to frontend.
"""
from __future__ import annotations

from app.core.config import settings


def create_payment_intent(amount_cents: int, currency: str = "usd", description: str = "") -> dict:
    if not settings.ENABLE_PAYMENTS:
        return {
            "status": "stub",
            "message": "Payments disabled — set ENABLE_PAYMENTS=true to activate.",
            "amount_cents": amount_cents,
            "currency": currency,
            "client_secret": None,
        }
    stripe_key = getattr(settings, "STRIPE_SECRET_KEY", None)
    if not stripe_key:
        return {
            "status": "stub",
            "message": "STRIPE_SECRET_KEY not set.",
            "amount_cents": amount_cents,
            "currency": currency,
            "client_secret": None,
        }
    try:
        import stripe  # pip install stripe
        stripe.api_key = stripe_key
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency,
            description=description,
        )
        return {
            "status": "ok",
            "payment_intent_id": intent["id"],
            "client_secret": intent["client_secret"],
            "amount_cents": amount_cents,
            "currency": currency,
        }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
