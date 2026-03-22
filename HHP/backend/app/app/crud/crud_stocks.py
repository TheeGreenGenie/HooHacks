from __future__ import annotations
from odmantic import AIOEngine
from app.models.stocks import StockQueryModel, PredictionResultModel, PortfolioPositionModel
from app.schemas.stocks import PredictionResult


async def log_query(engine: AIOEngine, user_id: str, symbol: str, start_date: str | None, end_date: str | None) -> StockQueryModel:
    obj = StockQueryModel(user_id=user_id, symbol=symbol, start_date=start_date, end_date=end_date)
    await engine.save(obj)
    return obj


async def save_prediction(engine: AIOEngine, user_id: str, result: PredictionResult) -> PredictionResultModel:
    obj = PredictionResultModel(
        user_id=user_id,
        symbol=result.symbol,
        lower_bound=result.lower_bound,
        upper_bound=result.upper_bound,
        expected_value=result.expected_value,
        confidence=result.confidence,
    )
    await engine.save(obj)
    return obj


async def get_predictions_for_user(engine: AIOEngine, user_id: str) -> list[PredictionResultModel]:
    return await engine.find(PredictionResultModel, PredictionResultModel.user_id == user_id)


async def save_position(
    engine: AIOEngine,
    user_id: str,
    symbol: str,
    shares: float,
    avg_cost: float,
    payment_method: str,
) -> PortfolioPositionModel:
    # Upsert: if position already exists, average in the new purchase
    existing = await engine.find_one(
        PortfolioPositionModel,
        PortfolioPositionModel.user_id == user_id,
        PortfolioPositionModel.symbol == symbol,
    )
    if existing:
        total_shares = existing.shares + shares
        existing.avg_cost = (existing.avg_cost * existing.shares + avg_cost * shares) / total_shares
        existing.shares = total_shares
        await engine.save(existing)
        return existing
    obj = PortfolioPositionModel(
        user_id=user_id, symbol=symbol, shares=shares,
        avg_cost=avg_cost, payment_method=payment_method,
    )
    await engine.save(obj)
    return obj


async def get_positions_for_user(engine: AIOEngine, user_id: str) -> list[PortfolioPositionModel]:
    return await engine.find(PortfolioPositionModel, PortfolioPositionModel.user_id == user_id)


async def delete_position(engine: AIOEngine, user_id: str, symbol: str) -> bool:
    pos = await engine.find_one(
        PortfolioPositionModel,
        PortfolioPositionModel.user_id == user_id,
        PortfolioPositionModel.symbol == symbol,
    )
    if pos:
        await engine.delete(pos)
        return True
    return False
