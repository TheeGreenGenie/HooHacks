"use client";

import { useEffect, useRef, useState } from "react";
import { fetchStores, fetchFrequentItems } from "../../lib/api/finances";
import { useApiToken } from "../../lib/hooks/useApiToken";

const CATEGORIES = [
  { id: "groceries",  label: "Groceries",  icon: "🛒" },
  { id: "dining",     label: "Dining",     icon: "🍽️" },
  { id: "shopping",   label: "Shopping",   icon: "🛍️" },
  { id: "transport",  label: "Transport",  icon: "🚗" },
  { id: "utilities",  label: "Utilities",  icon: "⚡" },
];

interface GeoCoords { lat: number; lon: number }

export default function FinancesStoresPage() {
  const token           = useApiToken();
  const [category, setCategory] = useState("groceries");
  const [stores,   setStores]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // F6 — item search
  const [search,      setSearch]      = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // F5 — geolocation
  const [geo,        setGeo]        = useState<GeoCoords | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoLabel,   setGeoLabel]   = useState("");

  const [frequentItems, setFrequentItems] = useState<string[]>([]);

  const load = async (
    cat: string,
    coords?: GeoCoords | null,
    searchTerm?: string
  ) => {
    setLoading(true);
    setError("");
    try {
      const g = coords !== undefined ? coords : geo;
      const s = searchTerm !== undefined ? searchTerm : search;
      const result = await fetchStores(cat, token, {
        lat:    g?.lat,
        lon:    g?.lon,
        radius: 15,
        search: s || undefined,
      });
      setStores(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(category);
    fetchFrequentItems(token).then(setFrequentItems).catch(() => {});
  }, []);  // eslint-disable-line

  const handleCat = (cat: string) => {
    setCategory(cat);
    load(cat);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(category, undefined, search);
  };

  const handleGeoLocate = () => {
    if (!navigator.geolocation) {
      setGeoLabel("Geolocation not supported");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: GeoCoords = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setGeo(coords);
        setGeoLabel(`📍 ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`);
        setGeoLoading(false);
        load(category, coords);
      },
      () => {
        setGeoLabel("Location denied");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const clearGeo = () => {
    setGeo(null);
    setGeoLabel("");
    load(category, null);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-7 text-center">
          <h1
            className="text-2xl font-bold tracking-wide text-glow"
            style={{ fontFamily: "Georgia, serif", color: "#E8C060" }}
          >
            🏪 Nearby Stores &amp; Deals
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A5830" }}>
            Best prices in your neck of the woods
          </p>
        </div>

        {/* ── Row: search + geo ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {/* Item search bar (F6) */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items, e.g. whole milk…"
              className="flex-1 rounded-lg px-4 py-2 text-sm outline-none"
              style={{
                background: "rgba(35,14,2,0.65)",
                border: "1px solid rgba(217,119,6,0.3)",
                color: "#FDE68A",
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
              style={{ background: "rgba(146,64,14,0.7)", color: "#FDE68A" }}
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); load(category, undefined, ""); }}
                className="px-3 py-2 rounded-lg text-sm shrink-0"
                style={{ background: "rgba(90,14,2,0.5)", color: "#FCA5A5" }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Geo button (F5) */}
          {geo ? (
            <div className="flex gap-2 items-center shrink-0">
              <span
                className="text-xs px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(20,83,45,0.4)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  color: "#4ADE80",
                }}
              >
                {geoLabel}
              </span>
              <button
                onClick={clearGeo}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: "rgba(90,14,2,0.5)", color: "#FCA5A5" }}
              >
                Clear
              </button>
            </div>
          ) : (
            <button
              onClick={handleGeoLocate}
              disabled={geoLoading}
              className="px-4 py-2 rounded-lg text-sm font-semibold shrink-0 flex items-center gap-2"
              style={{
                background: "rgba(14,116,144,0.5)",
                border: "1px solid rgba(6,182,212,0.3)",
                color: "#67E8F9",
                opacity: geoLoading ? 0.6 : 1,
              }}
            >
              {geoLoading ? (
                <span className="w-3 h-3 border border-t-transparent rounded-full animate-spin inline-block" />
              ) : "📍"}{" "}
              {geoLoading ? "Locating…" : (geoLabel || "Near Me")}
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCat(c.id)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={
                c.id === category
                  ? { background: "rgba(146,64,14,0.55)", border: "1px solid rgba(217,119,6,0.55)", color: "#FDE68A" }
                  : { background: "rgba(35,14,2,0.5)",   border: "1px solid rgba(217,119,6,0.15)", color: "#C8A870" }
              }
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Frequently bought items */}
        {frequentItems.length > 0 && (
          <div className="glass-card rounded-xl px-4 py-3 mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#5A3810" }}>
              — From Your History —
            </p>
            <div className="flex flex-wrap gap-2">
              {frequentItems.map((item) => (
                <button
                  key={item}
                  onClick={() => { setSearch(item); load(category, undefined, item); }}
                  className="px-3 py-0.5 rounded-full text-xs transition-opacity hover:opacity-80"
                  style={{
                    background: "rgba(217,119,6,0.1)",
                    border: "1px solid rgba(217,119,6,0.25)",
                    color: "#D97706",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold mb-1" style={{ color: "#F87171" }}>⚠ Could not load stores</p>
            <p className="text-xs mb-3" style={{ color: "#9A5050" }}>{error}</p>
            <button onClick={() => load(category)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(146,64,14,0.4)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.3)" }}>
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(217,119,6,0.6)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "#7A5830" }}>Scouting the frontier…</p>
            </div>
          </div>
        )}

        {/* Product grid */}
        {!loading && stores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stores.map((store, i) => (
              <ProductCard key={i} store={store} onSearch={(q) => { setSearch(q); load(category, undefined, q); }} />
            ))}
          </div>
        )}

        {!loading && stores.length === 0 && !error && (
          <div className="glass-card rounded-xl px-5 py-10 text-center">
            <p className="text-2xl mb-2">🏜️</p>
            <p className="text-sm" style={{ color: "#5A3810" }}>Nothing found in these parts.</p>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Product Card ──────────────────────────────────────────────────────── */
function ProductCard({ store, onSearch }: { store: any; onSearch: (q: string) => void }) {
  const price = store.estimated_price;
  const name  = store.inventory_note || store.category;

  return (
    <div
      className="glass-card glass-card-hover rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer"
      onClick={() => name && onSearch(name)}
      title="Click to search this item"
    >
      {/* Left: store + product name */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
          style={{ color: "#7A5030" }}
        >
          {store.store_name}
        </p>
        <p
          className="text-sm font-semibold leading-snug"
          style={{ color: "#E8C870" }}
        >
          {name}
        </p>
      </div>

      {/* Right: price */}
      {price != null && (
        <div className="text-right shrink-0">
          <p className="text-lg font-bold" style={{ color: "#4ADE80" }}>
            ${price.toFixed(2)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: "#4A6040" }}>
            avg price
          </p>
        </div>
      )}
    </div>
  );
}
