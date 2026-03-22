"use client";

import { useEffect, useState } from "react";
import { fetchStockHistory, fetchStockGraphs, fetchCompanyProfile } from "../../lib/api/stocks";
import { useApiToken } from "../../lib/hooks/useApiToken";
import Link from "next/link";

const SERIF = "Georgia, 'Palatino Linotype', Palatino, serif";

export default function StockHistoryPage() {
  const token = useApiToken();
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [traces, setTraces] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("portfolio_symbols") || "[]");
    setPortfolio(saved);
    if (saved.length > 0) loadHistory(saved[0]);
  }, []);

  const loadHistory = async (sym: string) => {
    setSelected(sym);
    setLoading(true);
    setError("");
    try {
      const [hist, graphs, prof] = await Promise.all([
        fetchStockHistory(sym, token),
        fetchStockGraphs(sym, token),
        fetchCompanyProfile(sym, token).catch(() => null),
      ]);
      setHistory(hist);
      setTraces(graphs.traces ?? []);
      setProfile(prof);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <p style={{ fontSize: "3rem", marginBottom: "1rem", filter: "drop-shadow(0 0 16px rgba(217,119,6,0.6))" }}>📈</p>
        <h2 className="text-2xl font-bold mb-2 text-glow" style={{ fontFamily: SERIF, color: "#E8C060" }}>
          Buy your first stock!
        </h2>
        <p className="mb-6 text-sm" style={{ color: "#7A5830" }}>
          Add stocks to your portfolio to view their price history here.
        </p>
        <Link
          href="/stocks/suggestions"
          className="px-6 py-3 rounded-xl font-semibold btn-3d"
          style={{ background: "linear-gradient(135deg, #92400E, #B45309)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.45)" }}
        >
          Browse Businesses & AI Suggestions
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-wide text-glow" style={{ fontFamily: SERIF, color: "#E8C060" }}>
            📈 Stock History
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A5830" }}>Price data &amp; technical indicators for your holdings</p>
        </div>

        {/* Portfolio tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {portfolio.map((sym) => (
            <button
              key={sym}
              onClick={() => loadHistory(sym)}
              className="px-4 py-1.5 rounded-full font-mono text-sm font-semibold transition-colors"
              style={
                selected === sym
                  ? { background: "rgba(146,64,14,0.55)", border: "1px solid rgba(217,119,6,0.55)", color: "#FDE68A" }
                  : { background: "rgba(35,14,2,0.5)", border: "1px solid rgba(217,119,6,0.15)", color: "#C8A870" }
              }
            >
              {sym}
            </button>
          ))}
        </div>

        {error && (
          <div className="glass-card rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold mb-1" style={{ color: "#F87171" }}>⚠ Could not load history</p>
            <p className="text-xs mb-3" style={{ color: "#9A5050" }}>{error}</p>
            <button onClick={() => selected && loadHistory(selected)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(146,64,14,0.4)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.3)" }}>
              Retry
            </button>
          </div>
        )}
        {loading && (
          <div className="glass-card rounded-xl p-8 text-center mb-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(217,119,6,0.6)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "#7A5830" }}>Loading {selected}…</p>
            </div>
          </div>
        )}

        {profile && !loading && (
          <div className="glass-card rounded-xl p-5 mb-6">
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4">
              <span className="font-bold text-lg" style={{ fontFamily: SERIF, color: "#E8C060" }}>{profile.name}</span>
              {profile.sector && (
                <span className="text-sm self-center" style={{ color: "#7A5830" }}>{profile.sector} · {profile.industry}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {profile.market_cap && <StatCard label="Market Cap" value={`$${(profile.market_cap / 1e9).toFixed(1)}B`} />}
              {profile.pe_ratio && <StatCard label="P/E Ratio" value={profile.pe_ratio.toFixed(1)} />}
              {profile.week_52_high && <StatCard label="52-wk High" value={`$${profile.week_52_high.toFixed(2)}`} />}
              {profile.week_52_low && <StatCard label="52-wk Low" value={`$${profile.week_52_low.toFixed(2)}`} />}
              {profile.dividend_yield && <StatCard label="Div Yield" value={`${(profile.dividend_yield * 100).toFixed(2)}%`} />}
              {profile.beta && <StatCard label="Beta" value={profile.beta.toFixed(2)} />}
              {profile.avg_volume && <StatCard label="Avg Volume" value={profile.avg_volume.toLocaleString()} />}
              {profile.employees && <StatCard label="Employees" value={profile.employees.toLocaleString()} />}
            </div>
            {profile.description && (
              <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "#9A7850" }}>{profile.description}</p>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="text-xs mt-1 inline-block hover:underline" style={{ color: "#60A5FA" }}>
                {profile.website}
              </a>
            )}
          </div>
        )}

        {history.length > 0 && !loading && (
          <>
            <div className="glass-card rounded-xl mb-6" style={{ maxHeight: 280, overflowY: "auto", overflowX: "auto" }}>
              <table className="text-xs" style={{ minWidth: 640, width: "100%" }}>
                <thead style={{ background: "rgba(146,64,14,0.35)", position: "sticky", top: 0 }}>
                  <tr>
                    {["Date", "Open", "High", "Low", "Close", "Adj Close", "Volume", "Dividends", "Splits"].map((c) => (
                      <th key={c} className="px-2 py-2 text-left font-semibold uppercase tracking-wide"
                        style={{ color: "#E8C060" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-60).map((row: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(217,119,6,0.08)" }}>
                      <td className="px-2 py-1.5" style={{ color: "#9A7850" }}>{row.date}</td>
                      <td className="px-2 py-1.5" style={{ color: "#C8A870" }}>{row.open?.toFixed(2)}</td>
                      <td className="px-2 py-1.5" style={{ color: "#4ADE80" }}>{row.high?.toFixed(2)}</td>
                      <td className="px-2 py-1.5" style={{ color: "#F87171" }}>{row.low?.toFixed(2)}</td>
                      <td className="px-2 py-1.5" style={{ color: "#C8A870" }}>{row.close?.toFixed(2)}</td>
                      <td className="px-2 py-1.5" style={{ color: "#C8A870" }}>{row.adjclose?.toFixed(2)}</td>
                      <td className="px-2 py-1.5" style={{ color: "#9A7850" }}>{row.volume?.toLocaleString()}</td>
                      <td className="px-2 py-1.5" style={{ color: "#9A7850" }}>{row.dividends > 0 ? row.dividends.toFixed(4) : "—"}</td>
                      <td className="px-2 py-1.5" style={{ color: "#9A7850" }}>{row.splits > 0 ? row.splits : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {traces.length > 0 && <PlotlyChart traces={traces} title={`${selected} — Price & Indicators`} />}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2 text-center" style={{ background: "rgba(20,8,0,0.5)", border: "1px solid rgba(217,119,6,0.15)" }}>
      <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#5A3820" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "#E8C060" }}>{value}</p>
    </div>
  );
}

function PlotlyChart({ traces, title }: { traces: any[]; title: string }) {
  const PlotlyComponent = require("react-plotly.js").default;
  return (
    <PlotlyComponent
      data={traces}
      layout={{
        title: { text: title, font: { color: "#E8C060", family: "Georgia, serif", size: 14 } },
        autosize: true,
        height: 400,
        paper_bgcolor: "rgba(12,4,0,0)",
        plot_bgcolor: "rgba(12,4,0,0)",
        font: { color: "#C8A870" },
      }}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}
