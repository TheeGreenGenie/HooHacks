from __future__ import annotations
from typing import Optional
from datetime import date
from pydantic import BaseModel


class ParsedTransaction(BaseModel):
    date: Optional[str] = None       # ISO date string
    description: str
    amount: float                    # positive = income, negative = expense
    category: Optional[str] = None


class FinancialDocument(BaseModel):
    filename: str
    content_type: str                # "application/pdf" | "image/jpeg" | "image/png"
    transactions: list[ParsedTransaction] = []
    raw_ocr_text: Optional[str] = None


class FinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    net: float
    by_category: dict[str, float]    # category -> total
    yearly_total_income: Optional[float] = None
    yearly_total_expenses: Optional[float] = None
    bills_total: float = 0.0         # utilities + subscriptions
    disposable_income: float = 0.0   # net - bills_total
    manual_income: Optional[float] = None  # user-entered monthly income


class SavingsSuggestion(BaseModel):
    category: str
    suggestion: str
    estimated_savings: Optional[float] = None
    source: str = "static"           # "static" | "gemini" | "snowflake" | "fallback"


class StoreLookup(BaseModel):
    store_name: str
    category: str
    estimated_price: Optional[float] = None
    location: Optional[str] = None
    inventory_note: Optional[str] = None
