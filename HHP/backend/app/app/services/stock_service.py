"""
Stock data service.

Uses yfinance for all OHLCV history (reliable, actively maintained).
Symbol lookup uses Alpha Vantage when a key is set, otherwise the
local database with yfinance validation as final fallback.
"""
from __future__ import annotations

import requests
import pandas as pd
from datetime import datetime
from dateutil.relativedelta import relativedelta


def lookup_symbol(query: str) -> list[dict] | None:
    """
    Search for ticker symbols matching a query string.
    Uses Alpha Vantage SYMBOL_SEARCH when ALPHAVANTAGE_API_KEY is set,
    otherwise falls back to local database + yahooquery direct lookup.
    Returns a list of {"display": str, "symbol": str} dicts.
    """
    q = query.strip()
    if not q:
        return []

    from app.core.config import settings
    if settings.ALPHAVANTAGE_API_KEY:
        results = _search_alphavantage(q, settings.ALPHAVANTAGE_API_KEY)
        if results is not None:
            return results

    # Fallback: local database + direct ticker validation
    local = _search_local(q)
    if local:
        return local
    return _validate_ticker(q)


def _search_alphavantage(query: str, api_key: str) -> list[dict] | None:
    """Alpha Vantage SYMBOL_SEARCH — returns same {display, symbol} format."""
    try:
        resp = requests.get(
            "https://www.alphavantage.co/query",
            params={
                "function": "SYMBOL_SEARCH",
                "keywords": query,
                "apikey": api_key,
            },
            timeout=10,
        )
        if resp.status_code != 200:
            return None
        matches = resp.json().get("bestMatches", [])
        return [
            {
                "display": f"{m['1. symbol']} — {m['2. name']}",
                "symbol": m["1. symbol"],
            }
            for m in matches
            if m.get("1. symbol")
        ]
    except Exception:
        return None


# ── Local stock database ─────────────────────────────────────────────────────
_STOCKS: list[tuple[str, str]] = [
    # Mega-cap / S&P 500 majors
    ("AAPL", "Apple Inc"), ("MSFT", "Microsoft Corporation"), ("NVDA", "NVIDIA Corporation"),
    ("GOOGL", "Alphabet Inc Class A"), ("GOOG", "Alphabet Inc Class C"), ("AMZN", "Amazon.com Inc"),
    ("META", "Meta Platforms Inc"), ("TSLA", "Tesla Inc"), ("BRK-B", "Berkshire Hathaway B"),
    ("UNH", "UnitedHealth Group"), ("LLY", "Eli Lilly and Company"), ("JPM", "JPMorgan Chase"),
    ("V", "Visa Inc"), ("XOM", "Exxon Mobil"), ("MA", "Mastercard Inc"),
    ("AVGO", "Broadcom Inc"), ("PG", "Procter & Gamble"), ("JNJ", "Johnson & Johnson"),
    ("HD", "Home Depot"), ("MRK", "Merck & Co"), ("COST", "Costco Wholesale"),
    ("ABBV", "AbbVie Inc"), ("CVX", "Chevron Corporation"), ("CRM", "Salesforce Inc"),
    ("BAC", "Bank of America"), ("NFLX", "Netflix Inc"), ("AMD", "Advanced Micro Devices"),
    ("ORCL", "Oracle Corporation"), ("PEP", "PepsiCo Inc"), ("KO", "Coca-Cola Company"),
    ("ADBE", "Adobe Inc"), ("WMT", "Walmart Inc"), ("MCD", "McDonald's Corporation"),
    ("TMO", "Thermo Fisher Scientific"), ("CSCO", "Cisco Systems"), ("IBM", "IBM Corporation"),
    ("ACN", "Accenture"), ("QCOM", "Qualcomm Inc"), ("TXN", "Texas Instruments"),
    ("INTC", "Intel Corporation"), ("INTU", "Intuit Inc"), ("AMAT", "Applied Materials"),
    ("AMGN", "Amgen Inc"), ("GE", "GE Aerospace"), ("CAT", "Caterpillar Inc"),
    ("BA", "Boeing Company"), ("HON", "Honeywell International"), ("SBUX", "Starbucks"),
    ("GS", "Goldman Sachs"), ("MS", "Morgan Stanley"), ("WFC", "Wells Fargo"),
    ("C", "Citigroup Inc"), ("AXP", "American Express"), ("BLK", "BlackRock Inc"),
    ("SPGI", "S&P Global Inc"), ("CME", "CME Group"), ("USB", "U.S. Bancorp"),
    ("RTX", "RTX Corporation"), ("LMT", "Lockheed Martin"), ("NOC", "Northrop Grumman"),
    ("DE", "Deere & Company"), ("MMM", "3M Company"), ("UPS", "United Parcel Service"),
    ("FDX", "FedEx Corporation"), ("F", "Ford Motor Company"), ("GM", "General Motors"),
    ("UBER", "Uber Technologies"), ("LYFT", "Lyft Inc"), ("ABNB", "Airbnb Inc"),
    ("DASH", "DoorDash Inc"), ("SNAP", "Snap Inc"), ("PINS", "Pinterest Inc"),
    ("TWTR", "Twitter / X Corp"), ("SPOT", "Spotify Technology"), ("RBLX", "Roblox Corporation"),
    ("COIN", "Coinbase Global"), ("SQ", "Block Inc"), ("PYPL", "PayPal Holdings"),
    ("SHOP", "Shopify Inc"), ("SE", "Sea Limited"), ("MELI", "MercadoLibre"),
    ("BABA", "Alibaba Group"), ("JD", "JD.com"), ("PDD", "PDD Holdings"),
    ("NIO", "NIO Inc"), ("XPEV", "XPeng Inc"), ("LI", "Li Auto Inc"),
    ("TSM", "Taiwan Semiconductor"), ("ASML", "ASML Holding"), ("LRCX", "Lam Research"),
    ("KLAC", "KLA Corporation"), ("MRVL", "Marvell Technology"), ("MU", "Micron Technology"),
    ("WDC", "Western Digital"), ("STX", "Seagate Technology"), ("HPQ", "HP Inc"),
    ("DELL", "Dell Technologies"), ("HPE", "Hewlett Packard Enterprise"),
    ("NET", "Cloudflare Inc"), ("ZS", "Zscaler Inc"), ("CRWD", "CrowdStrike Holdings"),
    ("PANW", "Palo Alto Networks"), ("FTNT", "Fortinet Inc"), ("S", "SentinelOne"),
    ("SNOW", "Snowflake Inc"), ("DDOG", "Datadog Inc"), ("MDB", "MongoDB Inc"),
    ("PLTR", "Palantir Technologies"), ("AI", "C3.ai Inc"), ("PATH", "UiPath Inc"),
    ("NOW", "ServiceNow Inc"), ("WDAY", "Workday Inc"), ("ZM", "Zoom Video"),
    ("DOCU", "DocuSign Inc"), ("BOX", "Box Inc"), ("OKTA", "Okta Inc"),
    ("TWLO", "Twilio Inc"), ("U", "Unity Software"), ("RGEN", "Repligen Corp"),
    ("ISRG", "Intuitive Surgical"), ("SYK", "Stryker Corporation"), ("MDT", "Medtronic"),
    ("ABT", "Abbott Laboratories"), ("BMY", "Bristol-Myers Squibb"), ("PFE", "Pfizer Inc"),
    ("MRNA", "Moderna Inc"), ("BNTX", "BioNTech SE"), ("GILD", "Gilead Sciences"),
    ("REGN", "Regeneron Pharmaceuticals"), ("VRTX", "Vertex Pharmaceuticals"),
    ("DIS", "Walt Disney Company"), ("CMCSA", "Comcast Corporation"), ("T", "AT&T Inc"),
    ("VZ", "Verizon Communications"), ("TMUS", "T-Mobile US"),
    ("AMT", "American Tower"), ("PLD", "Prologis Inc"), ("EQIX", "Equinix Inc"),
    ("NEE", "NextEra Energy"), ("DUK", "Duke Energy"), ("SO", "Southern Company"),
    ("SPY", "SPDR S&P 500 ETF"), ("QQQ", "Invesco QQQ Trust"), ("IWM", "iShares Russell 2000"),
    ("DIA", "SPDR Dow Jones ETF"), ("VOO", "Vanguard S&P 500 ETF"), ("VTI", "Vanguard Total Market"),
    ("GLD", "SPDR Gold Shares"), ("SLV", "iShares Silver Trust"), ("BTC-USD", "Bitcoin USD"),
    ("ETH-USD", "Ethereum USD"), ("SOL-USD", "Solana USD"),
]

def _search_local(query: str) -> list[dict]:
    """Case-insensitive substring match against the local stock database."""
    q_up = query.upper()
    q_lo = query.lower()
    results = []
    # Exact ticker match first
    for sym, name in _STOCKS:
        if sym.upper() == q_up:
            results.append({"display": f"{sym} — {name}", "symbol": sym})
    # Ticker starts-with
    for sym, name in _STOCKS:
        if sym.upper().startswith(q_up) and {"symbol": sym} not in [{"symbol": r["symbol"]} for r in results]:
            results.append({"display": f"{sym} — {name}", "symbol": sym})
    # Name contains
    for sym, name in _STOCKS:
        if q_lo in name.lower() and {"symbol": sym} not in [{"symbol": r["symbol"]} for r in results]:
            results.append({"display": f"{sym} — {name}", "symbol": sym})
    return results[:10]


def _validate_ticker(query: str) -> list[dict]:
    """Validate an unknown ticker symbol via yfinance price lookup."""
    try:
        import yfinance as yf
        sym = query.upper().strip()
        info = yf.Ticker(sym).fast_info
        price = getattr(info, "last_price", None)
        if price:
            name = getattr(info, "name", sym) or sym
            return [{"display": f"{sym} — {name}", "symbol": sym}]
    except Exception:
        pass
    return []


def fetch_history(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch daily OHLCV + adjclose + dividends + splits + RSI/MACD/Bollinger Bands via yfinance.
    Results are cached server-wide for 15 minutes (shared across all users).
    """
    from app.cache import stock_cache
    cache_key = f"history:{symbol}:{start_date}:{end_date}"
    cached = stock_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        import yfinance as yf
        data = yf.Ticker(symbol).history(
            start=start_date, end=end_date, interval="1d", auto_adjust=False
        )
        if isinstance(data, pd.DataFrame) and not data.empty:
            data.columns = [c.lower().replace(" ", "_") for c in data.columns]
            data.index.name = "date"
            data = data.rename(columns={"adj_close": "adjclose", "stock_splits": "splits"})
            keep = [c for c in ["open", "high", "low", "close", "adjclose", "volume", "dividends", "splits"] if c in data.columns]
            data = data[keep]
            data = _add_technical_indicators(data)
            stock_cache.set(cache_key, data, ttl=900)  # 15 minutes
            return data
    except Exception:
        pass
    return pd.DataFrame()


def _add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    # RSI
    delta = df["close"].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df["RSI"] = 100 - (100 / (1 + rs))

    # MACD
    ema_12 = df["close"].ewm(span=12).mean()
    ema_26 = df["close"].ewm(span=26).mean()
    df["MACD"] = ema_12 - ema_26
    df["MACD_Signal"] = df["MACD"].ewm(span=9).mean()
    df["MACD_Diff"] = df["MACD"] - df["MACD_Signal"]

    # Bollinger Bands
    df["BB_Middle"] = df["close"].rolling(window=20).mean()
    bb_std = df["close"].rolling(window=20).std()
    df["BB_High"] = df["BB_Middle"] + (bb_std * 2)
    df["BB_Low"] = df["BB_Middle"] - (bb_std * 2)

    return df


def date_n_months_ago(from_date: str, months: int = 15) -> str:
    """Return a date string N months before from_date."""
    dt = datetime.fromisoformat(from_date)
    earlier = dt - relativedelta(months=months)
    return earlier.strftime("%Y-%m-%d")


def build_analysis(df: pd.DataFrame, symbol: str) -> dict:
    """
    Compute boom score, comparison chart traces, and best indicator charts
    for the given stock DataFrame.
    """
    import math

    def _safe(v):
        """Convert NaN/inf to None for JSON serialisation."""
        if v is None:
            return None
        if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
            return None
        return v

    def _col_safe(series):
        return [_safe(v) for v in series.tolist()]

    # ── Normalise df index ───────────────────────────────────────────────────
    if isinstance(df.index, pd.MultiIndex):
        df = df.reset_index(level=0, drop=True)
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()

    # ── Latest indicator values ───────────────────────────────────────────────
    last = df.iloc[-1]

    # ── RSI score (25 pts) ────────────────────────────────────────────────────
    rsi_val = _safe(last.get("RSI")) if hasattr(last, "get") else _safe(last["RSI"] if "RSI" in df.columns else None)
    try:
        rsi_val = float(df["RSI"].dropna().iloc[-1]) if "RSI" in df.columns else None
    except Exception:
        rsi_val = None

    if rsi_val is None:
        rsi_score = 0
    elif 55 <= rsi_val <= 68:
        rsi_score = 25
    elif 50 <= rsi_val < 55:
        rsi_score = 20
    elif 68 < rsi_val <= 75:
        rsi_score = 18
    elif 45 <= rsi_val < 50:
        rsi_score = 12
    elif rsi_val > 75:
        rsi_score = 10
    else:
        # scale from 0–10 based on distance from 0–45 range
        rsi_score = max(0, int((rsi_val / 45) * 10))

    # ── MACD score (25 pts) ───────────────────────────────────────────────────
    try:
        macd_val = float(df["MACD"].dropna().iloc[-1]) if "MACD" in df.columns else None
        sig_val = float(df["MACD_Signal"].dropna().iloc[-1]) if "MACD_Signal" in df.columns else None
        diff_series = df["MACD_Diff"].dropna() if "MACD_Diff" in df.columns else None
        hist_trending_up = (
            len(diff_series) >= 3
            and diff_series.iloc[-1] > diff_series.iloc[-2] > diff_series.iloc[-3]
        ) if diff_series is not None and len(diff_series) >= 3 else False
    except Exception:
        macd_val, sig_val, hist_trending_up = None, None, False

    if macd_val is not None and sig_val is not None:
        if macd_val > sig_val and macd_val > 0 and hist_trending_up:
            macd_score = 25
        elif macd_val > sig_val and macd_val > 0:
            macd_score = 20
        elif macd_val > sig_val:
            macd_score = 14
        else:
            macd_score = 5
    else:
        macd_score = 5

    # ── Bollinger Band position score (25 pts) ────────────────────────────────
    try:
        bb_high = float(df["BB_High"].dropna().iloc[-1]) if "BB_High" in df.columns else None
        bb_low = float(df["BB_Low"].dropna().iloc[-1]) if "BB_Low" in df.columns else None
        close_val = float(df["close"].dropna().iloc[-1]) if "close" in df.columns else None
        if bb_high is not None and bb_low is not None and close_val is not None and (bb_high - bb_low) > 0:
            bb_pos = (close_val - bb_low) / (bb_high - bb_low)
        else:
            bb_pos = None
    except Exception:
        bb_pos = None

    if bb_pos is None:
        bb_score = 0
    elif bb_pos > 0.65:
        bb_score = 25
    elif bb_pos > 0.5:
        bb_score = 18
    elif bb_pos > 0.35:
        bb_score = 10
    else:
        bb_score = 4

    # ── Market outperformance score (25 pts) ──────────────────────────────────
    start = str(df.index[0].date())
    end = str(df.index[-1].date())
    market_score = 0
    stock_return = 0.0
    spy_return = 0.0
    market_outperformance = 0.0
    spy_df = pd.DataFrame()

    try:
        if symbol.upper() != "SPY":
            spy_df = fetch_history("SPY", start, end)

        close_series = df["close"].dropna()
        if len(close_series) >= 2:
            stock_return = float((close_series.iloc[-1] - close_series.iloc[0]) / close_series.iloc[0] * 100)
        else:
            stock_return = 0.0

        if not spy_df.empty:
            if isinstance(spy_df.index, pd.MultiIndex):
                spy_df = spy_df.reset_index(level=0, drop=True)
            spy_df.index = pd.to_datetime(spy_df.index)
            spy_close = spy_df["close"].dropna()
            if len(spy_close) >= 2:
                spy_return = float((spy_close.iloc[-1] - spy_close.iloc[0]) / spy_close.iloc[0] * 100)
            else:
                spy_return = 0.0
        else:
            spy_return = 0.0

        market_outperformance = stock_return - spy_return

        if market_outperformance > 10:
            market_score = 25
        elif market_outperformance > 5:
            market_score = 20
        elif market_outperformance > 0:
            market_score = 14
        elif market_outperformance > -5:
            market_score = 8
        else:
            market_score = 3
    except Exception:
        market_score = 0

    # ── Total boom score ──────────────────────────────────────────────────────
    boom_score = rsi_score + macd_score + bb_score + market_score

    if boom_score >= 80:
        boom_label = "Boom 🚀"
    elif boom_score >= 62:
        boom_label = "Do Well 📈"
    elif boom_score >= 45:
        boom_label = "Do OK 📊"
    else:
        boom_label = "Do Poorly 📉"

    # ── Comparison chart (last 60 days + 30-day projection) ───────────────────
    hist_df = df.tail(60).copy()
    hist_close = hist_df["close"].ffill().bfill()
    hist_dates = [str(d.date()) for d in hist_df.index]

    def _normalize(series):
        arr = series.values.tolist()
        base = arr[0] if arr[0] and arr[0] != 0 else 1
        return [_safe((v - base) / base * 100) for v in arr]

    stock_hist_pct = _normalize(hist_close)

    # SPY historical normalised
    spy_hist_pct = []
    spy_avg_daily = 0.0
    if not spy_df.empty:
        try:
            spy_hist_aligned = spy_df["close"].reindex(hist_df.index, method="nearest").ffill().bfill()
            spy_hist_pct = _normalize(spy_hist_aligned)
            spy_close_tail = spy_df["close"].dropna().tail(20)
            if len(spy_close_tail) >= 2:
                spy_daily_rets = spy_close_tail.pct_change().dropna()
                spy_avg_daily = float(spy_daily_rets.mean()) * 100
        except Exception:
            spy_hist_pct = []

    # Stock avg daily return (last 20 days)
    stock_close_tail = hist_close.tail(20)
    if len(stock_close_tail) >= 2:
        stock_daily_rets = stock_close_tail.pct_change().dropna()
        stock_avg_daily = float(stock_daily_rets.mean()) * 100
    else:
        stock_avg_daily = 0.0

    # Projection x-axis labels: t+1 … t+22
    proj_x = [f"t+{i}" for i in range(1, 23)]
    last_stock_pct = stock_hist_pct[-1] if stock_hist_pct and stock_hist_pct[-1] is not None else 0.0
    last_spy_pct = spy_hist_pct[-1] if spy_hist_pct and spy_hist_pct[-1] is not None else 0.0

    stock_proj = [_safe(last_stock_pct + stock_avg_daily * i) for i in range(1, 23)]
    spy_proj = [_safe(last_spy_pct + spy_avg_daily * i) for i in range(1, 23)]
    flat_proj = [0.0] * 22

    # Build traces — historical on hist_dates, projected on proj_x
    comparison_traces = [
        {
            "name": "This Stock (Historical)", "type": "scatter", "mode": "lines",
            "x": hist_dates, "y": stock_hist_pct,
            "line": {"color": "#F59E0B", "width": 2},
        },
        {
            "name": "S&P 500 (Historical)", "type": "scatter", "mode": "lines",
            "x": hist_dates, "y": spy_hist_pct if spy_hist_pct else [None] * len(hist_dates),
            "line": {"color": "#94A3B8", "width": 2},
        },
        {
            "name": "This Stock (Projected)", "type": "scatter", "mode": "lines",
            "x": proj_x, "y": stock_proj,
            "line": {"color": "#F59E0B", "width": 2, "dash": "dash"},
        },
        {
            "name": "S&P 500 (Projected)", "type": "scatter", "mode": "lines",
            "x": proj_x, "y": spy_proj,
            "line": {"color": "#94A3B8", "width": 2, "dash": "dash"},
        },
        {
            "name": "No Investment", "type": "scatter", "mode": "lines",
            "x": hist_dates + proj_x,
            "y": [0.0] * len(hist_dates) + flat_proj,
            "line": {"color": "#6B7280", "width": 1.5, "dash": "dash"},
        },
    ]

    comparison_layout = {
        "paper_bgcolor": "#1C1007",
        "plot_bgcolor": "#1C1007",
        "font": {"color": "#F5DEB3", "family": "Georgia, serif"},
        "margin": {"t": 40, "b": 60, "l": 60, "r": 20},
        "yaxis": {
            "title": "% Return from Day 0",
            "showgrid": True,
            "gridcolor": "#3D2B1A",
            "ticksuffix": "%",
        },
        "xaxis": {
            "showgrid": True,
            "gridcolor": "#3D2B1A",
            "tickangle": -45,
        },
        "legend": {
            "bgcolor": "rgba(0,0,0,0)",
            "font": {"size": 10},
            "orientation": "h",
            "y": -0.25,
        },
        "height": 160,
        "showlegend": True,
    }

    # ── Best 3 indicator charts ───────────────────────────────────────────────
    indicator_scores: dict[str, float] = {}

    # Score RSI
    if "RSI" in df.columns:
        rsi_series = df["RSI"].dropna()
        if len(rsi_series) > 0:
            latest_rsi = float(rsi_series.iloc[-1])
            # Closer to 55–65 sweet spot → higher score
            dist = abs(latest_rsi - 60)
            indicator_scores["rsi"] = max(0.0, 1.0 - dist / 40.0)

    # Score MACD
    if "MACD" in df.columns and "MACD_Signal" in df.columns:
        try:
            m = float(df["MACD"].dropna().iloc[-1])
            s = float(df["MACD_Signal"].dropna().iloc[-1])
            # Bullish crossover + positive momentum
            cross_score = 1.0 if (m > s and m > 0) else (0.5 if m > s else 0.1)
            indicator_scores["macd"] = cross_score
        except Exception:
            pass

    # Score Volume
    if "volume" in df.columns:
        try:
            vol = df["volume"].dropna()
            recent_avg = float(vol.tail(10).mean())
            overall_avg = float(vol.mean())
            if overall_avg > 0:
                ratio = recent_avg / overall_avg
                indicator_scores["volume"] = min(1.0, ratio / 2.0)
        except Exception:
            pass

    # Score BB
    if "BB_High" in df.columns and "BB_Low" in df.columns and "close" in df.columns:
        try:
            bh = float(df["BB_High"].dropna().iloc[-1])
            bl = float(df["BB_Low"].dropna().iloc[-1])
            cl = float(df["close"].dropna().iloc[-1])
            if bh - bl > 0:
                indicator_scores["bb"] = max(0.0, min(1.0, (cl - bl) / (bh - bl)))
        except Exception:
            pass

    # Score AdjClose (20-day return)
    if "adjclose" in df.columns:
        try:
            adj = df["adjclose"].dropna()
            if len(adj) >= 20:
                ret_20 = float((adj.iloc[-1] - adj.iloc[-20]) / adj.iloc[-20])
                indicator_scores["adjclose"] = max(0.0, min(1.0, (ret_20 + 0.2) / 0.4))
        except Exception:
            pass

    # Pick top 4 (3 for legacy best_charts, 4 for new indicator_charts)
    top4 = sorted(indicator_scores.items(), key=lambda x: x[1], reverse=True)[:4]
    top4_names = [k for k, _ in top4]
    top3_names = top4_names[:3]

    # Domains for 3 sub-panels
    domains = [[0.68, 1.0], [0.34, 0.64], [0.0, 0.30]]
    best_charts_traces = []
    best_charts_layout: dict = {
        "paper_bgcolor": "#1C1007",
        "plot_bgcolor": "#1C1007",
        "font": {"color": "#F5DEB3", "family": "Georgia, serif"},
        "margin": {"t": 30, "b": 40, "l": 60, "r": 20},
        "legend": {"bgcolor": "rgba(0,0,0,0)", "font": {"size": 9}, "orientation": "h", "y": -0.1},
        "height": 600,
    }

    yaxis_keys = ["yaxis", "yaxis2", "yaxis3"]
    yref_keys = ["y", "y2", "y3"]

    chart_dates = [str(d.date()) for d in df.index]

    for idx, chart_type in enumerate(top3_names):
        yref = yref_keys[idx]
        yaxis_key = yaxis_keys[idx]

        best_charts_layout[yaxis_key] = {
            "domain": domains[idx],
            "showgrid": True,
            "gridcolor": "#3D2B1A",
            "title": chart_type.upper(),
        }
        if idx == 0:
            best_charts_layout["xaxis"] = {
                "showgrid": True,
                "gridcolor": "#3D2B1A",
                "anchor": yref,
            }

        if chart_type == "rsi":
            best_charts_traces.append({
                "name": "RSI", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["RSI"]) if "RSI" in df.columns else [],
                "line": {"color": "#F59E0B", "width": 1.5},
                "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "OB (70)", "type": "scatter", "mode": "lines",
                "x": [chart_dates[0], chart_dates[-1]], "y": [70, 70],
                "line": {"color": "#EF4444", "width": 1, "dash": "dot"},
                "showlegend": False, "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "OS (30)", "type": "scatter", "mode": "lines",
                "x": [chart_dates[0], chart_dates[-1]], "y": [30, 30],
                "line": {"color": "#22C55E", "width": 1, "dash": "dot"},
                "showlegend": False, "yaxis": yref,
            })

        elif chart_type == "macd":
            macd_diff_colors = [
                "#D97706" if (v is not None and v >= 0) else "#7F1D1D"
                for v in (_col_safe(df["MACD_Diff"]) if "MACD_Diff" in df.columns else [])
            ]
            best_charts_traces.append({
                "name": "MACD", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["MACD"]) if "MACD" in df.columns else [],
                "line": {"color": "#F59E0B", "width": 1.5},
                "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "Signal", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["MACD_Signal"]) if "MACD_Signal" in df.columns else [],
                "line": {"color": "#FCD34D", "width": 1, "dash": "dash"},
                "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "Histogram", "type": "bar",
                "x": chart_dates, "y": _col_safe(df["MACD_Diff"]) if "MACD_Diff" in df.columns else [],
                "marker": {"color": macd_diff_colors},
                "yaxis": yref,
            })

        elif chart_type == "volume":
            best_charts_traces.append({
                "name": "Volume", "type": "bar",
                "x": chart_dates, "y": _col_safe(df["volume"]) if "volume" in df.columns else [],
                "marker": {"color": "#B45309", "opacity": 0.7},
                "yaxis": yref,
            })

        elif chart_type == "bb":
            best_charts_traces.append({
                "name": "Price", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["close"]) if "close" in df.columns else [],
                "line": {"color": "#F59E0B", "width": 1.5},
                "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "BB Upper", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["BB_High"]) if "BB_High" in df.columns else [],
                "line": {"color": "#92400E", "width": 1, "dash": "dot"},
                "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "BB Middle", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["BB_Middle"]) if "BB_Middle" in df.columns else [],
                "line": {"color": "#B45309", "width": 1, "dash": "dash"},
                "yaxis": yref,
            })
            best_charts_traces.append({
                "name": "BB Lower", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["BB_Low"]) if "BB_Low" in df.columns else [],
                "line": {"color": "#92400E", "width": 1, "dash": "dot"},
                "yaxis": yref,
            })

        elif chart_type == "adjclose":
            best_charts_traces.append({
                "name": "Adj Close", "type": "scatter", "mode": "lines",
                "x": chart_dates, "y": _col_safe(df["adjclose"]) if "adjclose" in df.columns else [],
                "line": {"color": "#F59E0B", "width": 1.5},
                "yaxis": yref,
            })

    # ── Individual indicator charts for 2x2 grid ─────────────────────────
    _chart_labels = {"rsi": "RSI", "macd": "MACD", "volume": "Volume", "bb": "Bollinger Bands", "adjclose": "Adj Close"}
    _base_layout = {
        "paper_bgcolor": "#1C1007",
        "plot_bgcolor": "#1C1007",
        "font": {"color": "#F5DEB3", "family": "Georgia, serif", "size": 9},
        "margin": {"t": 8, "b": 28, "l": 40, "r": 6},
        "height": 165,
        "showlegend": False,
        "xaxis": {"showgrid": True, "gridcolor": "#3D2B1A", "nticks": 5},
        "yaxis": {"showgrid": True, "gridcolor": "#3D2B1A"},
    }
    indicator_charts = []
    for ct in top4_names:
        ind_traces: list = []
        if ct == "rsi" and "RSI" in df.columns:
            ind_traces += [
                {"name": "RSI", "type": "scatter", "mode": "lines", "x": chart_dates,
                 "y": _col_safe(df["RSI"]), "line": {"color": "#F59E0B", "width": 1.5}},
                {"name": "OB", "type": "scatter", "mode": "lines",
                 "x": [chart_dates[0], chart_dates[-1]], "y": [70, 70],
                 "line": {"color": "#EF4444", "width": 1, "dash": "dot"}, "showlegend": False},
                {"name": "OS", "type": "scatter", "mode": "lines",
                 "x": [chart_dates[0], chart_dates[-1]], "y": [30, 30],
                 "line": {"color": "#22C55E", "width": 1, "dash": "dot"}, "showlegend": False},
            ]
        elif ct == "macd" and "MACD" in df.columns:
            _diff2 = _col_safe(df["MACD_Diff"]) if "MACD_Diff" in df.columns else []
            _diff_colors2 = ["#D97706" if (v is not None and v >= 0) else "#7F1D1D" for v in _diff2]
            ind_traces += [
                {"name": "MACD", "type": "scatter", "mode": "lines", "x": chart_dates,
                 "y": _col_safe(df["MACD"]), "line": {"color": "#F59E0B", "width": 1.5}},
                {"name": "Signal", "type": "scatter", "mode": "lines", "x": chart_dates,
                 "y": _col_safe(df["MACD_Signal"]) if "MACD_Signal" in df.columns else [],
                 "line": {"color": "#FCD34D", "width": 1, "dash": "dash"}},
                {"name": "Hist", "type": "bar", "x": chart_dates, "y": _diff2,
                 "marker": {"color": _diff_colors2}},
            ]
        elif ct == "volume" and "volume" in df.columns:
            ind_traces.append({
                "name": "Volume", "type": "bar", "x": chart_dates,
                "y": _col_safe(df["volume"]), "marker": {"color": "#B45309", "opacity": 0.7},
            })
        elif ct == "bb" and "BB_High" in df.columns:
            ind_traces += [
                {"name": "Price", "type": "scatter", "mode": "lines", "x": chart_dates,
                 "y": _col_safe(df["close"]) if "close" in df.columns else [],
                 "line": {"color": "#F59E0B", "width": 1.5}},
                {"name": "BB Hi", "type": "scatter", "mode": "lines", "x": chart_dates,
                 "y": _col_safe(df["BB_High"]), "line": {"color": "#92400E", "width": 1, "dash": "dot"}},
                {"name": "BB Lo", "type": "scatter", "mode": "lines", "x": chart_dates,
                 "y": _col_safe(df["BB_Low"]) if "BB_Low" in df.columns else [],
                 "line": {"color": "#92400E", "width": 1, "dash": "dot"}},
            ]
        elif ct == "adjclose" and "adjclose" in df.columns:
            ind_traces.append({
                "name": "Adj Close", "type": "scatter", "mode": "lines", "x": chart_dates,
                "y": _col_safe(df["adjclose"]), "line": {"color": "#F59E0B", "width": 1.5},
            })
        if ind_traces:
            indicator_charts.append({
                "id": ct,
                "title": _chart_labels.get(ct, ct.upper()),
                "traces": ind_traces,
                "layout": dict(_base_layout),
            })

    # ── Investor profile (rule-based) ────────────────────────────────────
    if boom_score >= 70:
        _signal = "bullish"
        _suitable = "Growth & Aggressive Investors"
        if market_outperformance is not None and market_outperformance >= 5:
            _text = (f"Strong momentum — outperforming S&P 500 by {market_outperformance:.1f}%. "
                     "Suited for risk-tolerant investors chasing above-market returns. "
                     "Momentum indicators confirm upward pressure; watch for reversal before adding size.")
        else:
            _text = ("Solid fundamentals and favorable indicators make this a good candidate for "
                     "growth-oriented portfolios. Confirm entry with volume before committing fully.")
    elif boom_score >= 45:
        _signal = "neutral"
        _suitable = "Balanced & Income Investors"
        _text = ("Mixed signals across indicators. This stock may deliver steady market-rate returns. "
                 "Suited for balanced portfolios — consider dollar-cost averaging rather than a lump-sum entry.")
    else:
        _signal = "bearish"
        _suitable = "Cautious · Wait-and-See"
        _text = ("Indicators suggest near-term headwinds. Conservative investors should wait for a clearer "
                 "bullish confirmation. Consider watching from the sidelines or trimming existing exposure.")

    investor_profile = {"signal": _signal, "suitable_for": _suitable, "text": _text}

    return {
        "boom_score": boom_score,
        "boom_label": boom_label,
        "market_outperformance": _safe(market_outperformance),
        "stock_return": _safe(stock_return),
        "spy_return": _safe(spy_return),
        "comparison_traces": comparison_traces,
        "comparison_layout": comparison_layout,
        "best_charts_traces": best_charts_traces,
        "best_charts_layout": best_charts_layout,
        "indicator_charts": indicator_charts,
        "investor_profile": investor_profile,
    }


def df_to_plotly_traces(df: pd.DataFrame, symbol: str) -> dict:
    """
    Convert a history DataFrame into a Plotly figure dict (traces + layout)
    with 4 professional sub-panels:
      1. Candlestick + Bollinger Bands + Adj Close  (tallest)
      2. Volume
      3. RSI  (with 30/70 reference bands)
      4. MACD + Signal + Histogram
    """
    if df.empty:
        return {"traces": [], "layout": {}}

    if isinstance(df.index, pd.MultiIndex):
        df = df.reset_index(level=0, drop=True)
    df.index = pd.to_datetime(df.index)
    dates = [str(d.date()) for d in df.index]

    def col(name):
        if name not in df.columns:
            return []
        import math
        return [None if (v is None or (isinstance(v, float) and math.isnan(v))) else v
                for v in df[name].tolist()]

    # ── Candlestick colours: gold up, dark-red down ───────────────────────────
    traces = [
        # Panel 1 — price
        {
            "name": symbol,
            "type": "candlestick",
            "x": dates,
            "open": col("open"), "high": col("high"),
            "low": col("low"),   "close": col("close"),
            "increasing": {"line": {"color": "#D97706"}, "fillcolor": "#D97706"},
            "decreasing": {"line": {"color": "#7F1D1D"}, "fillcolor": "#7F1D1D"},
            "yaxis": "y",
        },
        {
            "name": "BB Upper", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("BB_High"),
            "line": {"color": "#92400E", "width": 1, "dash": "dot"},
            "yaxis": "y",
        },
        {
            "name": "BB Middle", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("BB_Middle"),
            "line": {"color": "#B45309", "width": 1, "dash": "dash"},
            "yaxis": "y",
        },
        {
            "name": "BB Lower", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("BB_Low"),
            "line": {"color": "#92400E", "width": 1, "dash": "dot"},
            "fill": "tonexty", "fillcolor": "rgba(180,83,9,0.06)",
            "yaxis": "y",
        },
        {
            "name": "Adj Close", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("adjclose"),
            "line": {"color": "#F59E0B", "width": 1.5},
            "yaxis": "y",
        },
        # Panel 2 — volume
        {
            "name": "Volume", "type": "bar",
            "x": dates, "y": col("volume"),
            "marker": {"color": "#B45309", "opacity": 0.6},
            "yaxis": "y2",
        },
        # Panel 3 — RSI
        {
            "name": "RSI", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("RSI"),
            "line": {"color": "#F59E0B", "width": 1.5},
            "yaxis": "y3",
        },
        # overbought / oversold bands
        {
            "name": "OB (70)", "type": "scatter", "mode": "lines",
            "x": [dates[0], dates[-1]], "y": [70, 70],
            "line": {"color": "#EF4444", "width": 1, "dash": "dot"},
            "showlegend": False, "yaxis": "y3",
        },
        {
            "name": "OS (30)", "type": "scatter", "mode": "lines",
            "x": [dates[0], dates[-1]], "y": [30, 30],
            "line": {"color": "#22C55E", "width": 1, "dash": "dot"},
            "showlegend": False, "yaxis": "y3",
        },
        # Panel 4 — MACD
        {
            "name": "MACD", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("MACD"),
            "line": {"color": "#F59E0B", "width": 1.5},
            "yaxis": "y4",
        },
        {
            "name": "Signal", "type": "scatter", "mode": "lines",
            "x": dates, "y": col("MACD_Signal"),
            "line": {"color": "#FCD34D", "width": 1, "dash": "dash"},
            "yaxis": "y4",
        },
        {
            "name": "Histogram", "type": "bar",
            "x": dates, "y": col("MACD_Diff"),
            "marker": {
                "color": [
                    "#D97706" if (v or 0) >= 0 else "#7F1D1D"
                    for v in col("MACD_Diff")
                ]
            },
            "yaxis": "y4",
        },
    ]

    layout = {
        "paper_bgcolor": "#1C1007",
        "plot_bgcolor":  "#1C1007",
        "font": {"color": "#F5DEB3", "family": "Georgia, serif"},
        "margin": {"t": 40, "b": 20, "l": 60, "r": 20},
        "xaxis": {
            "rangeslider": {"visible": False},
            "showgrid": True, "gridcolor": "#3D2B1A",
            "tickfont": {"size": 10},
            "anchor": "y4",
        },
        "yaxis":  {
            "title": "Price (USD)", "domain": [0.44, 1.0],
            "showgrid": True, "gridcolor": "#3D2B1A",
            "tickformat": "$.2f",
        },
        "yaxis2": {
            "title": "Volume", "domain": [0.30, 0.42],
            "showgrid": True, "gridcolor": "#3D2B1A",
            "tickformat": ".2s",
        },
        "yaxis3": {
            "title": "RSI", "domain": [0.16, 0.28],
            "showgrid": True, "gridcolor": "#3D2B1A",
            "range": [0, 100],
        },
        "yaxis4": {
            "title": "MACD", "domain": [0.0, 0.14],
            "showgrid": True, "gridcolor": "#3D2B1A",
        },
        "legend": {
            "bgcolor": "rgba(0,0,0,0)", "font": {"size": 10},
            "orientation": "h", "y": 1.02,
        },
        "height": 700,
    }

    return {"traces": traces, "layout": layout}
