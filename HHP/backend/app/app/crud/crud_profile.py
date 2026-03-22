from __future__ import annotations
from odmantic import AIOEngine
from app.models.profile import UserProfileModel
from app.schemas.profile import UserProfile


async def get_or_create_profile(engine: AIOEngine, auth0_sub: str) -> UserProfileModel:
    profile = await engine.find_one(UserProfileModel, UserProfileModel.auth0_sub == auth0_sub)
    if profile is None:
        profile = UserProfileModel(auth0_sub=auth0_sub)
        await engine.save(profile)
    return profile


async def update_profile(engine: AIOEngine, auth0_sub: str, data: UserProfile) -> UserProfileModel:
    profile = await get_or_create_profile(engine, auth0_sub)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    await engine.save(profile)
    return profile
