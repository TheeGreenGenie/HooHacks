"""
cache.py — In-process TTL cache, shared server-wide.

Thread-safe dict-based store; no external dependencies.
Expired entries are evicted lazily on access and periodically on set().
"""
from __future__ import annotations

import threading
import time
from typing import Any


class TTLCache:
    """Simple in-process key/value store with per-entry TTL (seconds)."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expires_at)
        self._lock = threading.Lock()
        self._set_count = 0  # track writes to trigger periodic sweep

    # ── Public API ────────────────────────────────────────────────────────

    def get(self, key: str) -> Any | None:
        """Return value if present and not expired, else None."""
        with self._lock:
            entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            with self._lock:
                self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Store value with a TTL in seconds (default 5 min)."""
        expires_at = time.monotonic() + ttl
        with self._lock:
            self._store[key] = (value, expires_at)
            self._set_count += 1
            # Sweep every 200 writes to keep memory tidy
            if self._set_count % 200 == 0:
                self._evict_expired()

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def size(self) -> int:
        """Number of live (non-expired) entries."""
        now = time.monotonic()
        with self._lock:
            return sum(1 for _, exp in self._store.values() if exp > now)

    # ── Internal ──────────────────────────────────────────────────────────

    def _evict_expired(self) -> None:
        """Remove all expired entries. Must be called with lock held."""
        now = time.monotonic()
        dead = [k for k, (_, exp) in self._store.items() if exp <= now]
        for k in dead:
            del self._store[k]


# ── Disk-backed TTL cache (survives restarts) ─────────────────────────────────

import hashlib
import json
import os
from pathlib import Path


class DiskTTLCache:
    """
    File-backed JSON cache with per-entry TTL.  Entries survive server restarts.
    Values must be JSON-serialisable (dicts/lists/primitives).
    """

    def __init__(self, cache_dir: str) -> None:
        self._dir = Path(cache_dir)
        self._dir.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        h = hashlib.sha256(key.encode()).hexdigest()[:20]
        return self._dir / f"{h}.json"

    def get(self, key: str) -> Any | None:
        p = self._path(key)
        try:
            payload = json.loads(p.read_text(encoding="utf-8"))
            if time.time() > payload["exp"]:
                p.unlink(missing_ok=True)
                return None
            return payload["v"]
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: int = 3600) -> None:
        p = self._path(key)
        try:
            p.write_text(
                json.dumps({"exp": time.time() + ttl, "v": value}, default=str),
                encoding="utf-8",
            )
        except Exception:
            pass

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


# ── Singletons ────────────────────────────────────────────────────────────────

# Stock data: history, graphs, predictions, trending, profiles
stock_cache = TTLCache()

# Finance data: summaries, savings suggestions, store lookups
finance_cache = TTLCache()

# Disk-backed caches — survive restarts (TODO-S5, TODO-F8)
_CACHE_DIR = os.environ.get("FF_CACHE_DIR", str(Path(__file__).parents[4] / ".ff_disk_cache"))
stock_disk_cache   = DiskTTLCache(os.path.join(_CACHE_DIR, "stocks"))   # TODO-S5
kroger_disk_cache  = DiskTTLCache(os.path.join(_CACHE_DIR, "kroger"))   # TODO-F8
