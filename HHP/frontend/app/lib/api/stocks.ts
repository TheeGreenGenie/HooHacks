import { apiCore } from "./core";

const BASE = `${apiCore.url}/api/v1/stocks`;

export async function searchStocks(query: string, token: string) {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchStockHistory(
  symbol: string,
  token: string,
  months = 15
) {
  const res = await fetch(
    `${BASE}/history?symbol=${encodeURIComponent(symbol)}&months=${months}`,
    { headers: apiCore.headers(token) }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function predictStock(symbol: string, token: string) {
  const res = await fetch(
    `${BASE}/predict?symbol=${encodeURIComponent(symbol)}`,
    { method: "POST", headers: apiCore.headers(token) }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchStockGraphs(symbol: string, token: string) {
  const res = await fetch(
    `${BASE}/graphs?symbol=${encodeURIComponent(symbol)}`,
    { headers: apiCore.headers(token) }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCompanyProfile(symbol: string, token: string) {
  const res = await fetch(
    `${BASE}/profile?symbol=${encodeURIComponent(symbol)}`,
    { headers: apiCore.headers(token) }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchTrending(token: string) {
  const res = await fetch(`${BASE}/trending`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function purchaseStock(
  symbol: string,
  shares: number,
  paymentMethod: string,
  token: string,
) {
  const res = await fetch(`${BASE}/purchase`, {
    method: "POST",
    headers: { ...apiCore.headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, shares, payment_method: paymentMethod }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPortfolio(token: string) {
  const res = await fetch(`${BASE}/portfolio`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPlatformWallet(token: string) {
  const res = await fetch(`${BASE}/platform-wallet`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) return { address: "", balance_sol: 0 };
  return res.json();
}

export async function sellPosition(symbol: string, token: string) {
  const res = await fetch(`${BASE}/portfolio/${encodeURIComponent(symbol)}`, {
    method: "DELETE",
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface ImportPositionItem {
  symbol: string;
  shares: number;
  avg_cost: number;
  payment_method?: string;
}

export async function importPositions(positions: ImportPositionItem[], token: string) {
  const res = await fetch(`${BASE}/portfolio/import`, {
    method: "POST",
    headers: { ...apiCore.headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ positions }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
