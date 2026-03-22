from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class UserProfile(BaseModel):
    auth0_sub: Optional[str] = None      # Auth0 subject identifier
    full_name: Optional[str] = None      # "Jane Smith"
    age: Optional[int] = None            # e.g. 28
    phone_number: Optional[str] = None   # e.g. "+1 555-867-5309"
    display_name: Optional[str] = None
    income_bracket: Optional[str] = None # e.g. "30k-50k"
    spending_habits: list[str] = []      # e.g. ["dining", "subscriptions"]
    savings_goal: Optional[float] = None
    risk_tolerance: Optional[str] = None # "low" | "medium" | "high"
    gemini_profile: Optional[dict] = None
    manual_income: Optional[float] = None
