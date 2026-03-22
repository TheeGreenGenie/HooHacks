from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class StockQuery(BaseModel):
    symbol: str
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None    # YYYY-MM-DD


class OHLCVPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    adjclose: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    bb_high: Optional[float] = None
    bb_low: Optional[float] = None
    bb_middle: Optional[float] = None


class PredictionResult(BaseModel):
    symbol: str
    lower_bound: float
    upper_bound: float
    expected_value: float
    confidence: float
    # Plotly-compatible series for the frontend chart
    dates: list[str]
    close_prices: list[float]


class StockSearchResult(BaseModel):
    display: str   # e.g. "1. AAPL - Apple Inc."
    symbol: str


class PlotlyTrace(BaseModel):
    """Single Plotly trace dict — pass directly to Plotly.js on the frontend."""
    name: str
    x: list[str]
    y: list[float]
    type: str = "scatter"
    mode: str = "lines"


class PurchaseRequest(BaseModel):
    symbol: str
    shares: float
    payment_method: str  # "simulation" | "stripe" | "solana"


class PortfolioImportItem(BaseModel):
    symbol: str
    shares: float
    avg_cost: float
    payment_method: str = "manual"


class PortfolioImportRequest(BaseModel):
    positions: list[PortfolioImportItem]


class PortfolioPosition(BaseModel):
    symbol: str
    shares: float
    avg_cost: float
    payment_method: str
    purchased_at: str
    current_price: Optional[float] = None
    current_value: Optional[float] = None
    pnl: Optional[float] = None          # unrealised profit/loss in USD
    pnl_pct: Optional[float] = None      # as a percentage


class PurchaseResult(BaseModel):
    status: str
    symbol: str
    shares: float
    price_per_share: float
    total_usd: float
    payment_method: str
    payment_detail: dict
    wolfram_sol: Optional[str] = None    # SOL equivalent string from Wolfram
