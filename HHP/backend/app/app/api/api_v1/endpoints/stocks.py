"""
Stock endpoints.

GET  /stocks/search   — symbol lookup
GET  /stocks/history  — OHLCV + indicators
POST /stocks/predict  — Transformer model inference
GET  /stocks/graphs   — Plotly-formatted traces
"""
from __future__ import annotations

import asyncio
from datetime import date
from functools import partial
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from odmantic import AIOEngine

from app.core.auth0 import get_auth0_sub
from app.core.deps import UserContext, get_required_user_ctx
from app.crud import crud_stocks
from app.db.session import get_engine
from app.schemas.stocks import PredictionResult, StockSearchResult, PlotlyTrace, PurchaseRequest, PurchaseResult, PortfolioPosition, PortfolioImportRequest
from app.services import stock_service

router = APIRouter()


# Top 5 tickers used as fallback when Screener fails
_POPULAR = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"]

@router.get("/profile")
async def stock_profile(
    symbol: str = Query(..., description="Ticker symbol, e.g. AAPL"),
    _sub: str = Depends(get_auth0_sub),
):
    """Return company narrative: description, sector, market cap, P/E, 52-wk range."""
    from app.cache import stock_cache
    cache_key = f"profile:{symbol}"
    cached = stock_cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        import yfinance as yf
        t = yf.Ticker(symbol)
        info = t.info
        result = {
            "symbol": symbol,
            "name": info.get("longName") or info.get("shortName", symbol),
            "sector": info.get("sector", "—"),
            "industry": info.get("industry", "—"),
            "description": info.get("longBusinessSummary", "No description available."),
            "website": info.get("website"),
            "employees": info.get("fullTimeEmployees"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "week_52_high": info.get("fiftyTwoWeekHigh"),
            "week_52_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
        }
        stock_cache.set(cache_key, result, ttl=3600)  # 60 minutes
        return result
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Profile lookup failed: {exc}")


@router.get("/trending", response_model=list[StockSearchResult])
async def trending_stocks(_sub: str = Depends(get_auth0_sub)):
    """Return top 5 most-active stocks for the day."""
    from app.cache import stock_cache
    cached = stock_cache.get("trending")
    if cached is not None:
        return cached
    try:
        import yfinance as yf
        quotes = yf.screen("most_actives", size=5).get("quotes", [])
        if quotes:
            result = [
                StockSearchResult(
                    display=f"{q.get('symbol')} - {q.get('shortName', q.get('symbol', ''))}",
                    symbol=q.get("symbol", ""),
                )
                for q in quotes[:5]
                if q.get("symbol")
            ]
            stock_cache.set("trending", result, ttl=300)  # 5 minutes
            return result
    except Exception:
        pass
    return [StockSearchResult(display=sym, symbol=sym) for sym in _POPULAR]


@router.get("/search", response_model=list[StockSearchResult])
async def search_stocks(
    q: str = Query(..., description="Company name or partial ticker"),
    _sub: str = Depends(get_auth0_sub),
):
    from app.cache import stock_cache
    cache_key = f"search:{q.strip().lower()}"
    cached = stock_cache.get(cache_key)
    if cached is not None:
        return cached
    results = stock_service.lookup_symbol(q)
    if results is None:
        raise HTTPException(status_code=503, detail="Symbol lookup failed — Yahoo Finance unavailable")
    out = [StockSearchResult(display=r["display"], symbol=r["symbol"]) for r in results]
    stock_cache.set(cache_key, out, ttl=600)  # 10 minutes
    return out


@router.get("/history")
async def stock_history(
    symbol: str = Query(..., description="Ticker symbol, e.g. AAPL"),
    start: Optional[str] = Query(None, description="YYYY-MM-DD start date"),
    end: Optional[str] = Query(None, description="YYYY-MM-DD end date (defaults to today)"),
    months: int = Query(15, description="Months of history when start is omitted"),
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    end_date = end or str(date.today())
    start_date = start or stock_service.date_n_months_ago(end_date, months)

    try:
        await crud_stocks.log_query(engine, ctx.sub, symbol, start_date, end_date)
    except Exception:
        pass  # DB unavailable — non-fatal

    # TODO-S5: check 24-hour disk cache before hitting Yahoo Finance
    from app.cache import stock_cache, stock_disk_cache
    disk_key    = f"history:{symbol}:{start_date}:{end_date}"
    cached_disk = stock_disk_cache.get(disk_key)
    if cached_disk is not None:
        return cached_disk

    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(
        None, partial(stock_service.fetch_history, symbol, start_date, end_date)
    )
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

    # Reset multi-index so we can serialise as records
    if hasattr(df.index, "levels"):
        df = df.reset_index(level=0, drop=True)

    records = df.reset_index().rename(columns={"index": "date"})
    records["date"] = records["date"].astype(str)
    result = records.where(records.notna(), None).to_dict(orient="records")

    # Persist to disk for 24 h so restarts don't hammer Yahoo Finance
    stock_disk_cache.set(disk_key, result, ttl=24 * 3600)
    return result


@router.post("/predict", response_model=PredictionResult)
async def predict_stock(
    symbol: str = Query(...),
    months: int = Query(15),
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    from app.cache import stock_cache
    end_date = str(date.today())
    start_date = stock_service.date_n_months_ago(end_date, months)

    # Cache predictions for 30 minutes — model inference is expensive
    pred_cache_key = f"predict:{symbol}:{end_date}"
    cached_pred = stock_cache.get(pred_cache_key)
    if cached_pred is not None:
        return cached_pred

    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(
        None, partial(stock_service.fetch_history, symbol, start_date, end_date)
    )
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

    try:
        from app.ml import stock_predictor
        pred = await loop.run_in_executor(None, partial(stock_predictor.predict, df))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    import pandas as pd
    df_plot = df.reset_index(level=0, drop=True) if hasattr(df.index, "levels") else df.copy()
    df_plot.index = pd.to_datetime(df_plot.index)
    dates = [str(d.date()) for d in df_plot.index]
    closes = df_plot["close"].tolist()

    result = PredictionResult(
        symbol=symbol,
        lower_bound=pred["lower_bound"],
        upper_bound=pred["upper_bound"],
        expected_value=pred["expected_value"],
        confidence=pred["confidence"],
        dates=dates,
        close_prices=closes,
    )
    stock_cache.set(pred_cache_key, result, ttl=1800)  # 30 minutes
    try:
        await crud_stocks.save_prediction(engine, ctx.sub, result)
    except Exception:
        pass  # DB unavailable — non-fatal
    return result


@router.get("/platform-wallet")
async def platform_wallet(_sub: str = Depends(get_auth0_sub)):
    """Return the platform's Solana wallet address and current balance."""
    from app.payments.solana import get_platform_address, get_balance
    address = get_platform_address()
    balance = get_balance(address)
    return {"address": address, "balance_sol": balance.get("balance_sol", 0)}


@router.post("/purchase", response_model=PurchaseResult)
async def purchase_stock(
    body: PurchaseRequest,
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    """Simulate (or process) a stock purchase and record the position in MongoDB."""
    symbol = body.symbol.upper()

    # Get current price
    try:
        import yfinance as yf
        price = yf.Ticker(symbol).fast_info.last_price
        if not price or price <= 0:
            raise ValueError("No price data")
    except Exception:
        raise HTTPException(status_code=503, detail=f"Could not fetch current price for {symbol}")

    total_usd = round(price * body.shares, 2)

    # Wolfram Alpha: get SOL equivalent of the USD cost
    wolfram_sol: str | None = None
    try:
        from app.payments.wolfram import convert_currency
        result = convert_currency(total_usd, "USD", "SOL")
        if result.get("status") in ("ok", "stub"):
            wolfram_sol = result.get("answer")
    except Exception:
        pass

    # Process payment
    from app.payments import solana, stripe_payment
    if body.payment_method == "stripe":
        payment_detail = stripe_payment.create_payment_intent(
            amount_cents=int(total_usd * 100),
            currency="usd",
            description=f"Buy {body.shares} shares of {symbol}",
        )
    elif body.payment_method == "solana":
        # Parse SOL amount from Wolfram result if available
        sol_amount = 0.0
        if wolfram_sol:
            import re
            m = re.search(r"[\d.]+", wolfram_sol)
            if m:
                try:
                    sol_amount = float(m.group())
                except ValueError:
                    pass
        platform_addr = solana.get_platform_address()
        payment_detail = {
            "status": "awaiting_payment",
            "platform_wallet": platform_addr,
            "amount_sol": sol_amount,
            "message": f"Send {sol_amount:.6f} SOL to {platform_addr} to complete your purchase.",
            "explorer": f"https://explorer.solana.com/address/{platform_addr}",
        }
    else:
        # Simulation — no real payment
        payment_detail = {
            "status": "simulation",
            "message": f"Simulated purchase of {body.shares} shares of {symbol} at ${price:.2f}/share.",
        }

    # Record in MongoDB
    await crud_stocks.save_position(engine, ctx.sub, symbol, body.shares, price, body.payment_method)

    return PurchaseResult(
        status="ok",
        symbol=symbol,
        shares=body.shares,
        price_per_share=price,
        total_usd=total_usd,
        payment_method=body.payment_method,
        payment_detail=payment_detail,
        wolfram_sol=wolfram_sol,
    )


@router.get("/portfolio", response_model=list[PortfolioPosition])
async def get_portfolio(
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    """Return all portfolio positions for the authenticated user, enriched with current prices."""
    user_id = ctx.sub
    positions = await crud_stocks.get_positions_for_user(engine, user_id)
    if not positions:
        return []

    # Batch-fetch current prices
    symbols = list({p.symbol for p in positions})
    prices: dict[str, float] = {}
    try:
        import yfinance as yf
        tickers = yf.Tickers(" ".join(symbols))
        for sym in symbols:
            try:
                prices[sym] = tickers.tickers[sym].fast_info.last_price or 0.0
            except Exception:
                pass
    except Exception:
        pass

    result = []
    for pos in positions:
        cp = prices.get(pos.symbol)
        current_value = round(cp * pos.shares, 2) if cp else None
        cost_basis = round(pos.avg_cost * pos.shares, 2)
        pnl = round(current_value - cost_basis, 2) if current_value is not None else None
        pnl_pct = round((pnl / cost_basis) * 100, 2) if (pnl is not None and cost_basis > 0) else None
        result.append(PortfolioPosition(
            symbol=pos.symbol,
            shares=pos.shares,
            avg_cost=round(pos.avg_cost, 4),
            payment_method=pos.payment_method,
            purchased_at=pos.purchased_at.strftime("%Y-%m-%d"),
            current_price=round(cp, 4) if cp else None,
            current_value=current_value,
            pnl=pnl,
            pnl_pct=pnl_pct,
        ))
    return result


@router.delete("/portfolio/{symbol}", response_model=dict)
async def sell_position(
    symbol: str,
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    """Remove (sell) a position from the portfolio."""
    user_id = ctx.sub
    deleted = await crud_stocks.delete_position(engine, user_id, symbol.upper())
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No position found for {symbol}")
    return {"status": "ok", "symbol": symbol.upper()}


@router.post("/portfolio/import", response_model=dict)
async def import_positions(
    body: PortfolioImportRequest,
    ctx: UserContext = Depends(get_required_user_ctx),
    engine: AIOEngine = Depends(get_engine),
):
    """Bulk-import portfolio positions (manual entry, no payment required).
    Each item is upserted — existing positions are averaged in."""
    user_id = ctx.sub
    saved = 0
    for item in body.positions:
        await crud_stocks.save_position(
            engine,
            user_id,
            item.symbol.upper(),
            item.shares,
            item.avg_cost,
            item.payment_method,
        )
        saved += 1
    return {"status": "ok", "imported": saved}


@router.get("/graphs")
async def stock_graphs(
    symbol: str = Query(...),
    months: int = Query(15),
    _sub: str = Depends(get_auth0_sub),
):
    from app.cache import stock_cache
    end_date = str(date.today())
    start_date = stock_service.date_n_months_ago(end_date, months)

    graphs_cache_key = f"graphs:{symbol}:{end_date}"
    cached = stock_cache.get(graphs_cache_key)
    if cached is not None:
        return cached

    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(
        None, partial(stock_service.fetch_history, symbol, start_date, end_date)
    )
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

    figure = stock_service.df_to_plotly_traces(df, symbol)
    analysis = await loop.run_in_executor(
        None, partial(stock_service.build_analysis, df, symbol)
    )
    result = {"symbol": symbol, "traces": figure["traces"], "layout": figure["layout"], **analysis}
    stock_cache.set(graphs_cache_key, result, ttl=900)  # 15 minutes
    return result
