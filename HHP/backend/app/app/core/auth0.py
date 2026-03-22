"""
Auth0 JWT dependency.

Extracts the Bearer token directly from the Authorization header (no FastAPI
security layer) so that missing/invalid headers always fall through to
"anonymous" — never raises a 401/403.
"""
from __future__ import annotations

import httpx
from jose import jwt, JWTError
from fastapi import HTTPException, Request

from app.core.config import settings

# Simple in-process JWKS cache (refreshed on decode failure)
_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        url = f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


async def _verify_via_userinfo(token: str) -> dict:
    """Verify an opaque (non-JWT) access token via the /userinfo endpoint."""
    url = f"https://{settings.AUTH0_DOMAIN}/userinfo"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=10)
        resp.raise_for_status()
        return resp.json()


async def verify_auth0_token(token: str) -> dict:
    """Decode and validate an Auth0-issued token. Returns the payload.

    Tries JWKS (JWT) first; falls back to /userinfo for opaque tokens.
    """
    global _jwks_cache

    # Try JWT decode first
    try:
        jwks = await _get_jwks()
        return jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE or None,
            issuer=f"https://{settings.AUTH0_DOMAIN}/",
        )
    except JWTError:
        pass

    # Retry once with refreshed JWKS
    try:
        _jwks_cache = None
        jwks = await _get_jwks()
        return jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.AUTH0_AUDIENCE or None,
            issuer=f"https://{settings.AUTH0_DOMAIN}/",
        )
    except JWTError:
        pass

    # Fall back to /userinfo for opaque access tokens
    return await _verify_via_userinfo(token)


async def get_auth0_sub(request: Request) -> str:
    """
    Returns the Auth0 subject (sub) from the Bearer token, or 'anonymous'.
    Never raises — all failures fall through to anonymous.
    """
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.lower().startswith("bearer "):
            return "anonymous"
        token = auth_header[7:].strip()
        if not token:
            return "anonymous"
        if not settings.AUTH0_DOMAIN:
            return "anonymous"
        payload = await verify_auth0_token(token)
        return payload.get("sub", "anonymous")
    except Exception:
        return "anonymous"


async def get_required_auth0_sub(request: Request) -> str:
    """
    Returns the Auth0 subject (sub) from the Bearer token.
    Raises 401 on any missing/invalid token.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.lower().startswith("bearer " ):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth_header[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    if not settings.AUTH0_DOMAIN:
        raise HTTPException(status_code=401, detail="Auth0 not configured")
    try:
        payload = await verify_auth0_token(token)
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return sub
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

