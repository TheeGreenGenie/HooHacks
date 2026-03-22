from __future__ import annotations
from odmantic import AIOEngine
from app.models.finance import FinancialDocumentModel, ParsedTransactionModel
from app.schemas.finance import FinancialDocument, ParsedTransaction


async def create_document(engine: AIOEngine, user_id: str, doc: FinancialDocument) -> FinancialDocumentModel:
    obj = FinancialDocumentModel(
        user_id=user_id,
        filename=doc.filename,
        content_type=doc.content_type,
        raw_ocr_text=doc.raw_ocr_text,
    )
    await engine.save(obj)
    return obj


async def create_transactions(
    engine: AIOEngine,
    user_id: str,
    document_id: str,
    transactions: list[ParsedTransaction],
) -> list[ParsedTransactionModel]:
    objs = [
        ParsedTransactionModel(
            document_id=document_id,
            user_id=user_id,
            date=t.date,
            description=t.description,
            amount=t.amount,
            category=t.category,
        )
        for t in transactions
    ]
    await engine.save_all(objs)
    return objs


async def get_transactions_for_user(engine: AIOEngine, user_id: str) -> list[ParsedTransactionModel]:
    return await engine.find(ParsedTransactionModel, ParsedTransactionModel.user_id == user_id)
