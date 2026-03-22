"""
Server-wide in-process TTL cache.

Module-level — one shared instance for the entire uvicorn process,
so every user hitting the same key gets the cached value.
"""
from __future__ import annotations

import time
import threading
from typing import Any


class TTLCache:
    """Thread-safe dict cache with per-entry TTL (seconds)."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expires_at)
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int) -> None:
        with self._lock:
            self._store[key] = (value, time.monotonic() + ttl)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def size(self) -> int:
        with self._lock:
            return len(self._store)


# Singletons — imported everywhere, shared across all requests
stock_cache = TTLCache()
finance_cache = TTLCache()
