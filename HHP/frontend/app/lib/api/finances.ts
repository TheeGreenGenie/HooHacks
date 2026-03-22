import { apiCore } from "./core";

const BASE = `${apiCore.url}/api/v1/finances`;

export async function scanDocument(file: File, token: string) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/scan`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSummary(token: string, manualIncome?: number) {
  const params = manualIncome != null ? `?manual_income=${manualIncome}` : "";
  const res = await fetch(`${BASE}/summary${params}`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchSavings(token: string, frequency?: string) {
  const params = frequency ? `?frequency=${frequency}` : "";
  const res = await fetch(`${BASE}/savings${params}`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchFrequentItems(token: string): Promise<string[]> {
  const res = await fetch(`${BASE}/frequent-items`, {
    headers: apiCore.headers(token),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchStores(
  category: string,
  token: string,
  opts?: { lat?: number; lon?: number; radius?: number; search?: string }
) {
  const p = new URLSearchParams({ category });
  if (opts?.lat  != null) p.set("lat",    String(opts.lat));
  if (opts?.lon  != null) p.set("lon",    String(opts.lon));
  if (opts?.radius != null) p.set("radius", String(opts.radius));
  if (opts?.search)       p.set("search", opts.search);
  const res = await fetch(`${BASE}/stores?${p}`, { headers: apiCore.headers(token) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function speak(text: string, token: string) {
  const res = await fetch(`${apiCore.url}/api/v1/voice/speak`, {
    method: "POST",
    headers: apiCore.headers(token),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
