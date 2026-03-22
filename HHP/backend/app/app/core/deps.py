"""
Shared FastAPI dependencies.

get_user_ctx — resolves the Auth0 sub and upserts a MongoDB UserProfileModel
               on every authenticated request (no-op for anonymous).
"""
from __future__ import annotations

from fastapi import Depends
from odmantic import AIOEngine

from app.core.auth0 import get_auth0_sub, get_required_auth0_sub
from app.crud.crud_profile import get_or_create_profile
from app.db.session import get_engine
from app.models.profile import UserProfileModel


class UserContext:
    """Lightweight container returned by get_user_ctx."""

    __slots__ = ("sub", "profile")

    def __init__(self, sub: str, profile: UserProfileModel | None) -> None:
        self.sub = sub
        self.profile = profile


async def get_user_ctx(
    sub: str = Depends(get_auth0_sub),
    engine: AIOEngine = Depends(get_engine),
) -> UserContext:
    """
    FastAPI dependency — call instead of get_auth0_sub on any endpoint that
    stores or reads per-user data.

    - Extracts the Auth0 sub from the Bearer token (or 'anonymous').
    - For authenticated users: upserts a UserProfileModel in MongoDB so every
      user has exactly one profile document keyed by their Auth0 sub.
    - Returns UserContext(sub, profile).  profile is None for anonymous users
      or when MongoDB is unreachable.
    """
    if sub == "anonymous":
        return UserContext("anonymous", None)
    try:
        profile = await get_or_create_profile(engine, sub)
    except Exception:
        profile = None
    return UserContext(sub, profile)


async def get_required_user_ctx(
    sub: str = Depends(get_required_auth0_sub),
    engine: AIOEngine = Depends(get_engine),
) -> UserContext:
    """
    Like get_user_ctx, but rejects anonymous requests with 401.
    Use for any endpoint that reads/writes per-user data.
    """
    try:
        profile = await get_or_create_profile(engine, sub)
    except Exception:
        profile = None
    return UserContext(sub, profile)

