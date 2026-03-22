from __future__ import annotations
from typing import Optional
from odmantic import Field
from app.db.base_class import Base


class UserProfileModel(Base):
    model_config = {"collection": "user_profiles"}

    auth0_sub: str = Field(index=True)
    full_name: Optional[str] = None
    age: Optional[int] = None
    phone_number: Optional[str] = None
    display_name: Optional[str] = None
    income_bracket: Optional[str] = None
    spending_habits: list[str] = Field(default_factory=list)
    savings_goal: Optional[float] = None
    risk_tolerance: Optional[str] = None
    gemini_profile: Optional[dict] = None
    manual_income: Optional[float] = None  # user-entered monthly income, persisted
