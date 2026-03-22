"use client";

import { useEffect, useState } from "react";
import { fetchPortfolio, sellPosition, importPositions, ImportPositionItem } from "../../lib/api/stocks";
import { useApiToken } from "../../lib/hooks/useApiToken";
import Link from "next/link";

const SERIF = "Georgia, 'Palatino Linotype', Palatino, serif";

const SUGGESTED_BUYS = [
  { symbol: "AAPL", reason: "Consistent growth, strong fundamentals" },
  { symbol: "NVDA", reason: "AI sector leader with strong momentum" },
  { symbol: "MSFT", reason: "Diversified tech with stable dividends" },
];

// Preset portfolios any user can seed with one click
const PRESETS: Record<string, { label: string; positions: ImportPositionItem[] }> = {
  millionaire: {
    label: "💰 Millionaire Portfolio",
    positions: [
      { symbol: "AAPL",  shares: 500,  avg_cost: 145.20, payment_method: "manual" },
      { symbol: "NVDA",  shares: 200,  avg_cost: 280.50, payment_method: "manual" },
      { symbol: "TSLA",  shares: 300,  avg_cost: 195.75, payment_method: "manual" },
      { symbol: "MSFT",  shares: 400,  avg_cost: 310.00, payment_method: "manual" },
      { symbol: "GOOGL", shares: 150,  avg_cost: 130.80, payment_method: "manual" },
      { symbol: "AMZN",  shares: 250,  avg_cost: 118.40, payment_method: "manual" },
      { symbol: "META",  shares: 180,  avg_cost: 290.60, payment_method: "manual" },
      { symbol: "SPY",   shares: 600,  avg_cost: 420.00, payment_method: "manual" },
      { symbol: "BRK-B", shares: 100,  avg_cost: 340.00, payment_method: "manual" },
      { symbol: "JPM",   shares: 220,  avg_cost: 168.90, payment_method: "manual" },
    ],
  },
  starter: {
    label: "🤠 Starter Pack",
    positions: [
      { symbol: "AAPL", shares: 5,  avg_cost: 175.00, payment_method: "manual" },
      { symbol: "MSFT", shares: 3,  avg_cost: 380.00, payment_method: "manual" },
      { symbol: "SPY",  shares: 2,  avg_cost: 480.00, payment_method: "manual" },
    ],
  },
};

export default function PortfolioPage() {
  const token = useApiToken();
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Add Position form state
  const [showForm, setShowForm]       = useState(false);
  const [formSymbol, setFormSymbol]   = useState("");
  const [formShares, setFormShares]   = useState("");
  const [formCost, setFormCost]       = useState("");
  const [formSaving, setFormSaving]   = useState(false);
  const [formError, setFormError]     = useState("");

  // Preset seeding state
  const [seeding, setSeeding] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchPortfolio(token)
      .then(setPositions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line

  const handleSell = async (symbol: string) => {
    try { await sellPosition(symbol, token); load(); }
    catch (e: any) { setError(e.message); }
  };

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSymbol || !formShares || !formCost) { setFormError("All fields required"); return; }
    setFormSaving(true); setFormError("");
    try {
      await importPositions(
        [{ symbol: formSymbol.toUpperCase(), shares: parseFloat(formShares), avg_cost: parseFloat(formCost), payment_method: "manual" }],
        token,
      );
      setFormSymbol(""); setFormShares(""); setFormCost("");
      setShowForm(false);
      load();
    } catch (e: any) { setFormError(e.message); }
    finally { setFormSaving(false); }
  };

  const handlePreset = async (key: string) => {
    setSeeding(key);
    try {
      await importPositions(PRESETS[key].positions, token);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSeeding(null); }
  };

  const totalValue = positions.reduce((s, p) => s + (p.current_value ?? 0), 0);
  const totalCost  = positions.reduce((s, p) => s + p.avg_cost * p.shares, 0);
  const totalPnl   = totalValue - totalCost;

  const inputStyle: React.CSSProperties = {
    background: "rgba(35,14,2,0.65)",
    border: "1px solid rgba(217,119,6,0.25)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    color: "#FDE68A",
    fontSize: "0.85rem",
    outline: "none",
    width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-wide text-glow" style={{ fontFamily: SERIF, color: "#E8C060" }}>
            💼 My Portfolio
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A5830" }}>Your holdings on the frontier exchange</p>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <Link
            href="/stocks/suggestions"
            className="px-5 py-2.5 rounded-xl font-semibold text-sm btn-3d"
            style={{ background: "linear-gradient(135deg, #14532D, #166534)", color: "#86EFAC", border: "1px solid rgba(74,222,128,0.3)" }}
          >
            + Buy Stock
          </Link>
          <button
            onClick={() => { setShowForm(v => !v); setFormError(""); }}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm btn-3d"
            style={{ background: "rgba(255,255,255,0.04)", color: "#D4B483", border: "1px solid rgba(217,119,6,0.25)" }}
          >
            {showForm ? "✕ Cancel" : "✦ Add Position"}
          </button>
        </div>

        {/* Add Position form */}
        {showForm && (
          <form
            onSubmit={handleAddPosition}
            className="glass-card rounded-xl p-5 mb-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#7A5030" }}>
              — Log an Existing Holding —
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5A3820", marginBottom: "0.3rem" }}>Symbol</label>
                <input
                  value={formSymbol}
                  onChange={e => setFormSymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  style={inputStyle}
                  maxLength={8}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5A3820", marginBottom: "0.3rem" }}>Shares</label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={formShares}
                  onChange={e => setFormShares(e.target.value)}
                  placeholder="10"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5A3820", marginBottom: "0.3rem" }}>Avg Cost / Share</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={formCost}
                  onChange={e => setFormCost(e.target.value)}
                  placeholder="150.00"
                  style={inputStyle}
                />
              </div>
            </div>
            {formError && <p className="text-xs mb-3" style={{ color: "#F87171" }}>{formError}</p>}
            <button
              type="submit"
              disabled={formSaving}
              className="w-full py-2 rounded-lg text-sm font-semibold btn-3d"
              style={{ background: "linear-gradient(135deg, #92400E, #B45309)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.4)", opacity: formSaving ? 0.6 : 1 }}
            >
              {formSaving ? "Saving…" : "Add to Portfolio"}
            </button>

            {/* Preset seeds */}
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(217,119,6,0.12)" }}>
              <p className="text-xs mb-2" style={{ color: "#5A3820" }}>Or load a preset:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    disabled={seeding === key}
                    onClick={() => handlePreset(key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-3d"
                    style={{ background: "rgba(217,119,6,0.12)", color: "#C8A040", border: "1px solid rgba(217,119,6,0.22)", opacity: seeding === key ? 0.6 : 1 }}
                  >
                    {seeding === key ? "Loading…" : preset.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {loading && (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(217,119,6,0.6)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "#7A5830" }}>Loading portfolio…</p>
            </div>
          </div>
        )}
        {error && (
          <div className="glass-card rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold mb-1" style={{ color: "#F87171" }}>⚠ Could not load portfolio</p>
            <p className="text-xs mb-3" style={{ color: "#9A5050" }}>{error}</p>
            <button onClick={load} className="px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "rgba(146,64,14,0.4)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.3)" }}>
              Retry
            </button>
          </div>
        )}

        {!loading && positions.length === 0 ? (
          <div>
            <p className="text-center text-sm mb-6" style={{ color: "#5A3820" }}>
              No positions yet. Browse stocks, buy, or add an existing holding above.
            </p>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: "#5A3810" }}>
              — Suggested Picks —
            </p>
            <div className="space-y-3">
              {SUGGESTED_BUYS.map((s) => (
                <div key={s.symbol} className="glass-card glass-card-hover rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold" style={{ color: "#E8C060" }}>{s.symbol}</p>
                    <p className="text-sm mt-0.5" style={{ color: "#9A7850" }}>{s.reason}</p>
                  </div>
                  <Link
                    href="/stocks/suggestions"
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold btn-3d"
                    style={{ background: "rgba(146,64,14,0.55)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.35)" }}
                  >
                    Buy
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            {positions.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <SummaryCard label="Portfolio Value" value={`$${totalValue.toFixed(2)}`} accent="#E8C060" />
                <SummaryCard label="Cost Basis"      value={`$${totalCost.toFixed(2)}`}  accent="#C8A870" />
                <SummaryCard
                  label="Total P&L"
                  value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
                  accent={totalPnl >= 0 ? "#4ADE80" : "#F87171"}
                />
              </div>
            )}

            {/* Positions table — horizontal scroll on mobile */}
            <div className="glass-card rounded-xl" style={{ overflowX: "auto" }}>
              <table style={{ minWidth: 560, width: "100%" }} className="text-sm">
                <thead style={{ background: "rgba(146,64,14,0.35)" }}>
                  <tr>
                    {["Symbol", "Shares", "Avg Cost", "Current", "Value", "P&L", "Via", ""].map((h, i) => (
                      <th key={i}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 0 ? "text-left" : "text-right"}`}
                        style={{ color: "#E8C060" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.symbol} style={{ borderTop: "1px solid rgba(217,119,6,0.1)" }}>
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: "#E8C060" }}>{pos.symbol}</td>
                      <td className="px-4 py-3 text-right" style={{ color: "#C8A870" }}>{pos.shares}</td>
                      <td className="px-4 py-3 text-right" style={{ color: "#C8A870" }}>${pos.avg_cost?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right" style={{ color: "#C8A870" }}>
                        {pos.current_price != null ? `$${pos.current_price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: "#C8A870" }}>
                        {pos.current_value != null ? `$${pos.current_value.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold"
                        style={{ color: pos.pnl == null ? "#5A3820" : pos.pnl >= 0 ? "#4ADE80" : "#F87171" }}>
                        {pos.pnl != null
                          ? `${pos.pnl >= 0 ? "+" : ""}$${pos.pnl.toFixed(2)} (${pos.pnl_pct?.toFixed(1)}%)`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs capitalize" style={{ color: "#5A3820" }}>{pos.payment_method}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSell(pos.symbol)}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: "#F87171" }}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="glass-card rounded-xl p-4 text-center">
      <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#5A3820" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: accent, fontFamily: SERIF }}>{value}</p>
    </div>
  );
}
