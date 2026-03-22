"""
Merchant inventory service — powered by the Kroger API.

Kroger's API covers: Kroger, Ralph's, Fred Meyer, King Soopers,
Harris Teeter, Mariano's, Fry's, and more (~2,800 US stores).

Setup (free):
  1. developer.kroger.com → sign up
  2. My Apps → Create App → select "Product" and "Locations" scopes
  3. Copy Client ID and Client Secret into .env as KROGER_CLIENT_ID / KROGER_CLIENT_SECRET

Auth: Client Credentials OAuth2 (no user login needed for product/location search).
"""
from __future__ import annotations

import time
import requests
from app.core.config import settings
from app.schemas.finance import StoreLookup

_BASE = "https://api.kroger.com/v1"

# Simple in-process token cache
_token_cache: dict = {"token": None, "expires_at": 0}


def _get_token() -> str | None:
    if not (settings.KROGER_CLIENT_ID and settings.KROGER_CLIENT_SECRET):
        return None

    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    resp = requests.post(
        f"{_BASE}/connect/oauth2/token",
        data={"grant_type": "client_credentials", "scope": "product.compact"},
        auth=(settings.KROGER_CLIENT_ID, settings.KROGER_CLIENT_SECRET),
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 1800)
    return _token_cache["token"]


def _nearest_location_id(token: str, lat: float, lon: float, radius: float = 10.0) -> str | None:
    """Return the Kroger locationId closest to the given coordinates."""
    try:
        resp = requests.get(
            f"{_BASE}/locations",
            params={
                "filter.latLong.lat": round(lat, 6),
                "filter.latLong.lon": round(lon, 6),
                "filter.radiusInMiles": min(radius, 50),
                "filter.limit": 1,
            },
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        locations = resp.json().get("data", [])
        if locations:
            return locations[0].get("locationId")
    except Exception:
        pass
    return None


def _products_to_storelookups(products: list[dict], category: str) -> list[StoreLookup]:
    results = []
    for p in products:
        items      = p.get("items", [{}])
        price_info = items[0].get("price", {}) if items else {}
        price      = price_info.get("regular") or price_info.get("promo")
        results.append(
            StoreLookup(
                store_name="Kroger",
                category=category,
                estimated_price=float(price) if price else None,
                inventory_note=p.get("description", ""),
            )
        )
    return results


def _storelookups_to_dicts(results: list[StoreLookup]) -> list[dict]:
    return [r.model_dump() for r in results]


def _dicts_to_storelookups(rows: list[dict]) -> list[StoreLookup]:
    return [StoreLookup(**r) for r in rows]


def lookup_stores(
    category: str,
    *,
    lat: float | None = None,
    lon: float | None = None,
    radius_miles: float = 10.0,
    search: str | None = None,
) -> list[StoreLookup]:
    """
    Fetch products from the Kroger API.

    Args:
        category:     one of groceries / dining / shopping / transport / utilities
        lat, lon:     user's coordinates for geolocation filtering (TODO-F5)
        radius_miles: search radius when lat/lon are provided
        search:       free-text product search term (TODO-F6), overrides category term
    """
    from app.cache import kroger_disk_cache

    # Build a stable cache key that includes all parameters
    geo_key    = f"{lat:.4f},{lon:.4f}" if (lat is not None and lon is not None) else "nogeo"
    search_key = (search or "").strip().lower()
    disk_key   = f"kroger:{category}:{geo_key}:{search_key}"

    cached = kroger_disk_cache.get(disk_key)
    if cached is not None:
        return _dicts_to_storelookups(cached)

    token = _get_token()
    if not token:
        return _stub_stores(category)

    try:
        # Resolve location ID if coordinates provided
        location_id: str | None = None
        if lat is not None and lon is not None:
            location_id = _nearest_location_id(token, lat, lon, radius_miles)

        # Determine product search term
        if search and search.strip():
            query = search.strip()
        else:
            search_terms: dict[str, str] = {
                "groceries":     "organic produce",
                "dining":        "prepared meals",
                "shopping":      "household essentials",
                "transport":     "motor oil",
                "utilities":     "batteries",
                "subscriptions": "gift cards",
            }
            query = search_terms.get(category, category)

        params: dict = {"filter.term": query, "filter.limit": 8}
        if location_id:
            params["filter.locationId"] = location_id

        resp = requests.get(
            f"{_BASE}/products",
            params=params,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=10,
        )
        resp.raise_for_status()
        products = resp.json().get("data", [])

        results = _products_to_storelookups(products, category)
        if not results:
            results = _stub_stores(category)

        # Persist to disk for 4 h (TODO-F8)
        kroger_disk_cache.set(disk_key, _storelookups_to_dicts(results), ttl=4 * 3600)
        return results

    except Exception:
        return _stub_stores(category)


def _stub_stores(category: str) -> list[StoreLookup]:
    stubs: dict[str, list[StoreLookup]] = {
        "groceries": [
            StoreLookup(store_name="Kroger", category="groceries", estimated_price=3.99,
                        inventory_note="Organic produce — set KROGER_CLIENT_ID/SECRET for live prices"),
            StoreLookup(store_name="Trader Joe's", category="groceries", estimated_price=2.49,
                        inventory_note="Stub data"),
        ],
        "dining": [
            StoreLookup(store_name="Kroger Deli", category="dining", estimated_price=8.99,
                        inventory_note="Prepared meals section"),
        ],
        "shopping": [
            StoreLookup(store_name="Kroger", category="shopping", estimated_price=5.99,
                        inventory_note="Household essentials"),
        ],
        "transport": [
            StoreLookup(store_name="Kroger Fuel", category="transport", estimated_price=3.49,
                        inventory_note="Motor oil & auto supplies"),
        ],
        "utilities": [
            StoreLookup(store_name="Kroger", category="utilities", estimated_price=8.99,
                        inventory_note="Batteries & home essentials"),
        ],
    }
    return stubs.get(
        category,
        [StoreLookup(store_name="Kroger", category=category,
                     inventory_note="Stub — add Kroger API keys for live data")],
    )
