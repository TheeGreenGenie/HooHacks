"""
Finance endpoints.

POST /finances/scan     — upload scannable document, run OCR + parse
GET  /finances/summary  — income/spending totals for current user
GET  /finances/savings  — AI-driven savings suggestions
GET  /finances/stores   — merchant inventory stub
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from odmantic import AIOEngine

log = logging.getLogger(__name__)

from app.ai import router as ai_router
from app.core.deps import UserContext, get_user_ctx, get_required_user_ctx
from app.crud import crud_finance
from app.db.session import get_engine
from app.schemas.finance import FinancialDocument, FinancialSummary, SavingsSuggestion, StoreLookup
from app.services import document_parser, ocr_client
from app.crud import crud_profile

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}


@router.post("/scan", response_model=FinancialDocument)
async def scan_document(
    file: UploadFile = File(...),
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Use PDF, JPEG, or PNG.",
        )

    file_bytes = await file.read()
    try:
        raw_text = await ocr_client.extract_text_async(file_bytes, file.content_type)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OCR failed: {exc}") from exc
    transactions = document_parser.parse_ocr_text(raw_text)

    doc = FinancialDocument(
        filename=file.filename or "upload",
        content_type=file.content_type,
        transactions=transactions,
        raw_ocr_text=raw_text,
    )

    user_id = ctx.sub

    db_doc = await crud_finance.create_document(engine, user_id, doc)
    await crud_finance.create_transactions(engine, user_id, str(db_doc.id), transactions)

    # Bust per-user finance caches so next request reflects new data
    from app.cache import finance_cache
    for freq in ("monthly", "weekly", "auto"):
        finance_cache.delete(f"savings:{user_id}:{freq}")

    return doc


@router.get("/summary", response_model=FinancialSummary)
async def finance_summary(
    manual_income: float | None = Query(None, description="User-entered monthly income in dollars"),
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    user_id = ctx.sub

    # Load saved manual_income from profile (never auto-save — client must PATCH /me/profile)
    try:
        profile = await crud_profile.get_or_create_profile(engine, user_id)
        if manual_income is None and profile.manual_income is not None:
            manual_income = profile.manual_income
    except Exception as e:
        log.error("finance_summary: profile load failed for %s: %s", user_id, e)

    try:
        transactions_db = await crud_finance.get_transactions_for_user(engine, user_id)
    except Exception as e:
        log.error("finance_summary: transaction query failed for %s: %s", user_id, e)
        transactions_db = []

    if not transactions_db:
        return FinancialSummary(
            total_income=manual_income or 0,
            total_expenses=0,
            net=manual_income or 0,
            by_category={},
            manual_income=manual_income,
            disposable_income=manual_income or 0,
        )

    from app.schemas.finance import ParsedTransaction
    transactions = [
        ParsedTransaction(
            date=t.date,
            description=t.description,
            amount=t.amount,
            category=t.category,
        )
        for t in transactions_db
    ]
    return document_parser.compute_summary(transactions, manual_income=manual_income)


@router.get("/savings", response_model=list[SavingsSuggestion])
async def finance_savings(
    frequency: str = Query("monthly", description="Shopping frequency: weekly, monthly, or auto"),
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    from app.cache import finance_cache
    user_id = ctx.sub
    cache_key = f"savings:{user_id}:{frequency}"
    cached = finance_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        transactions_db = await crud_finance.get_transactions_for_user(engine, user_id)
    except Exception as e:
        log.error("finance_savings: transaction query failed for %s: %s", user_id, e)
        transactions_db = []

    from app.schemas.finance import ParsedTransaction
    transactions = [
        ParsedTransaction(
            date=t.date,
            description=t.description,
            amount=t.amount,
            category=t.category,
        )
        for t in transactions_db
    ]
    result = ai_router.get_all_suggestions(transactions, frequency=frequency)
    finance_cache.set(cache_key, result, ttl=600)  # 10 minutes
    return result


@router.get("/frequent-items", response_model=list[str])
async def frequent_items(
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    """Return top 8 most frequently appearing transaction descriptions for this user."""
    user_id = ctx.sub
    try:
        transactions_db = await crud_finance.get_transactions_for_user(engine, user_id)
    except Exception:
        transactions_db = []
    counts: dict[str, int] = {}
    for t in transactions_db:
        key = t.description.strip().title()
        counts[key] = counts.get(key, 0) + 1
    sorted_items = sorted(counts, key=lambda k: counts[k], reverse=True)
    return sorted_items[:8]


@router.get("/stores", response_model=list[StoreLookup])
async def finance_stores(
    category: str = Query("groceries"),
    search: str | None = Query(None, description="Free-text item search, e.g. 'whole milk'"),
    lat: float | None = Query(None, description="User latitude for nearby-store filtering"),
    lon: float | None = Query(None, description="User longitude for nearby-store filtering"),
    radius: float = Query(10.0, description="Search radius in miles (max 50)"),
    _ctx: UserContext = Depends(get_user_ctx),
):
    import asyncio
    from functools import partial
    from app.cache import finance_cache
    from app.services.merchant_service import lookup_stores

    # Fast in-memory cache key (covers geo + search for deduplication)
    geo_str    = f"{lat:.4f},{lon:.4f}" if (lat is not None and lon is not None) else "nogeo"
    search_str = (search or "").strip().lower()
    mem_key    = f"stores:{category}:{geo_str}:{search_str}"

    cached = finance_cache.get(mem_key)
    if cached is not None:
        return cached

    loop   = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        partial(lookup_stores, category, lat=lat, lon=lon, radius_miles=radius, search=search),
    )
    finance_cache.set(mem_key, result, ttl=1800)  # 30 min in-memory
    return result
