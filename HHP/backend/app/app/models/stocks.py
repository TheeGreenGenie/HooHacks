from __future__ import annotations
from typing import Optional
from datetime import datetime
from odmantic import Field
from app.db.base_class import Base


class StockQueryModel(Base):
    model_config = {"collection": "stock_queries"}

    user_id: str
    symbol: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    queried_at: datetime = Field(default_factory=datetime.utcnow)


class PredictionResultModel(Base):
    model_config = {"collection": "prediction_results"}

    user_id: str
    symbol: str
    lower_bound: float
    upper_bound: float
    expected_value: float
    confidence: float
    predicted_at: datetime = Field(default_factory=datetime.utcnow)


class PortfolioPositionModel(Base):
    model_config = {"collection": "portfolio_positions"}

    user_id: str
    symbol: str
    shares: float
    avg_cost: float          # price per share at purchase
    payment_method: str      # "simulation" | "stripe" | "solana"
    purchased_at: datetime = Field(default_factory=datetime.utcnow)
