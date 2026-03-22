from __future__ import annotations
from typing import Optional
from datetime import datetime
from odmantic import Field
from app.db.base_class import Base


class FinancialDocumentModel(Base):
    model_config = {"collection": "financial_documents"}

    user_id: str                         # Auth0 sub or internal user id
    filename: str
    content_type: str
    raw_ocr_text: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class ParsedTransactionModel(Base):
    model_config = {"collection": "parsed_transactions"}

    document_id: str                     # ref to FinancialDocumentModel id
    user_id: str
    date: Optional[str] = None
    description: str
    amount: float
    category: Optional[str] = None
