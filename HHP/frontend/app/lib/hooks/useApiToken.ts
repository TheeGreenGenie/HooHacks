"use client";

/**
 * useApiToken — fetches the Auth0 ID token from /api/auth/token once per
 * session and caches it in module-level state so we don't hammer the server
 * route on every re-render.
 *
 * Returns "" while loading or if the user is not authenticated, so all API
 * calls gracefully fall back to anonymous mode on the backend.
 */
import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

let _cached: string = "";
let _fetching = false;
const _listeners: Array<(t: string) => void> = [];

async function fetchToken(): Promise<string> {
  if (_cached) return _cached;
  if (_fetching) {
    return new Promise((resolve) => _listeners.push(resolve));
  }
  _fetching = true;
  try {
    const res = await fetch("/api/auth/token");
    if (res.ok) {
      const data = await res.json();
      _cached = data.token ?? "";
    }
  } catch {
    _cached = "";
  } finally {
    _fetching = false;
    _listeners.forEach((cb) => cb(_cached));
    _listeners.length = 0;
  }
  return _cached;
}

export function useApiToken(): string {
  const { user } = useUser();
  const [token, setToken] = useState(_cached);

  useEffect(() => {
    if (!user) {
      _cached = "";
      setToken("");
      return;
    }
    fetchToken().then(setToken);
  }, [user]);

  return token;
}
