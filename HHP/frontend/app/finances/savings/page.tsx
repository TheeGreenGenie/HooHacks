"use client";

import { useEffect, useState } from "react";
import { fetchSavings } from "../../lib/api/finances";
import { useApiToken } from "../../lib/hooks/useApiToken";

const SERIF = "Georgia, 'Palatino Linotype', Palatino, serif";

const FREQUENCIES = [
  { id: "weekly",  label: "Weekly",        icon: "📅" },
  { id: "monthly", label: "Monthly",       icon: "🗓️" },
  { id: "auto",    label: "Auto-delivery", icon: "📦" },
];

const SOURCE_LABEL: Record<string, string> = {
  static:      "Rule-based",
  gemini:      "Gemini AI",
  snowflake:   "Snowflake AI",
  openrouter:  "OpenRouter AI",
  fallback:    "General Advice",
};

const SOURCE_COLOR: Record<string, string> = {
  gemini:     "#818CF8",
  snowflake:  "#38BDF8",
  openrouter: "#A78BFA",
  static:     "#FB923C",
  fallback:   "#6B7280",
};

export default function FinancesSavingsPage() {
  const token = useApiToken();
  const [frequency, setFrequency] = useState("monthly");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (freq: string) => {
    setLoading(true);
    setError("");
    fetchSavings(token, freq)
      .then(setSuggestions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(frequency); }, [token]);

  const handleFrequency = (freq: string) => {
    setFrequency(freq);
    load(freq);
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-7 text-center">
          <h1
            className="text-2xl font-bold tracking-wide text-glow"
            style={{ fontFamily: SERIF, color: "#E8C060" }}
          >
            🪙 Savings Suggestions
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A5830" }}>
            AI-powered tips to keep more gold in your saddlebag
          </p>
        </div>

        {/* Frequency picker */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7A5830", fontFamily: SERIF }}>
            Shopping Frequency
          </p>
          <div className="flex flex-wrap gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                onClick={() => handleFrequency(f.id)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
                style={
                  f.id === frequency
                    ? { background: "rgba(146,64,14,0.55)", border: "1px solid rgba(217,119,6,0.55)", color: "#FDE68A" }
                    : { background: "rgba(35,14,2,0.5)", border: "1px solid rgba(217,119,6,0.15)", color: "#C8A870" }
                }
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(217,119,6,0.6)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "#7A5830" }}>Loading suggestions…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold mb-1" style={{ color: "#F87171" }}>⚠ Could not load suggestions</p>
            <p className="text-xs mb-3" style={{ color: "#9A5050" }}>{error}</p>
            <button onClick={() => load(frequency)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(146,64,14,0.4)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.3)" }}>
              Retry
            </button>
          </div>
        )}

        {!loading && suggestions.length === 0 && !error && (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm" style={{ color: "#5A3820" }}>
              Upload financial documents to get personalised suggestions.
            </p>
          </div>
        )}

        {/* Suggestion cards */}
        {!loading && (
          <ul className="space-y-3">
            {suggestions.map((s, i) => (
              <li key={i} className="glass-card glass-card-hover rounded-xl p-5">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <span
                    className="text-sm font-bold capitalize"
                    style={{ color: "#E8C060", fontFamily: SERIF }}
                  >
                    {s.category}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: "rgba(20,8,0,0.6)",
                      border: `1px solid ${SOURCE_COLOR[s.source] ?? "#6B7280"}40`,
                      color: SOURCE_COLOR[s.source] ?? "#6B7280",
                    }}
                  >
                    {SOURCE_LABEL[s.source] ?? s.source}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#C8A870" }}>{s.suggestion}</p>
                {s.estimated_savings != null && (
                  <p className="text-sm font-semibold mt-2" style={{ color: "#4ADE80" }}>
                    Est. savings: ${s.estimated_savings.toFixed(2)}/mo
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
