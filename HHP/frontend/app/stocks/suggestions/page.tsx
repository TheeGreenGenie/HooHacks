"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { predictStock, searchStocks, fetchTrending, fetchStockGraphs } from "../../lib/api/stocks";
import { useApiToken } from "../../lib/hooks/useApiToken";

const SERIF = "Georgia, 'Palatino Linotype', Palatino, serif";

export default function StockSuggestionsPage() {
  const router = useRouter();
  const token = useApiToken();
  const [trending, setTrending] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const progressTimers = useRef<number[]>([]);

  const clearProgressTimers = () => {
    progressTimers.current.forEach((t) => window.clearTimeout(t));
    progressTimers.current = [];
  };

  const startProgress = () => {
    clearProgressTimers();
    setProgressStep("Fetching market data");
    setProgressPct(18);
    progressTimers.current.push(
      window.setTimeout(() => {
        setProgressStep("Running prediction model");
        setProgressPct(52);
      }, 700)
    );
    progressTimers.current.push(
      window.setTimeout(() => {
        setProgressStep("Building charts");
        setProgressPct(78);
      }, 1600)
    );
  };

  const finishProgress = () => {
    clearProgressTimers();
    setProgressStep("Complete");
    setProgressPct(100);
    window.setTimeout(() => {
      setProgressStep("");
      setProgressPct(0);
    }, 800);
  };

  useEffect(() => {
    fetchTrending(token).then(setTrending).catch(() => {});
  }, [token]);

  const handleSearch = async () => {
    setError("");
    try { setResults(await searchStocks(query, token)); }
    catch (e: any) { setError(e.message); }
  };

  const handleSelect = async (sym: string) => {
    setResults([]);
    setLoading(true);
    setError("");
    setPrediction(null);
    setGraphData(null);
    setShowDetails(false);
    startProgress();
    try {
      const [pred, graph] = await Promise.all([
        predictStock(sym, token),
        fetchStockGraphs(sym, token),
      ]);
      setPrediction(pred);
      setGraphData(graph);
    } catch (e: any) {
      setError(e.message);
    } finally {
      finishProgress();
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-7 text-center">
          <h1
            className="text-2xl font-bold tracking-wide text-glow"
            style={{ fontFamily: SERIF, color: "#E8C060" }}
          >
            ☆ The Trading Post
          </h1>
          <p className="text-sm mt-1" style={{ fontFamily: SERIF, color: "#7A5830" }}>
            Pick your wager — the frontier awaits
          </p>
        </div>

        {/* Trending pills */}
        {trending.length > 0 && (
          <div className="mb-5">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ fontFamily: SERIF, color: "#5A3810" }}
            >
              — Today's Most Active —
            </p>
            <div className="flex flex-wrap gap-2">
              {trending.map((t: any) => (
                <button
                  key={t.symbol}
                  onClick={() => handleSelect(t.symbol)}
                  className="px-3.5 py-1 rounded-full text-sm font-semibold transition-colors"
                  style={{
                    background: "rgba(146,64,14,0.2)",
                    border: "1px solid rgba(217,119,6,0.3)",
                    color: "#F59E0B",
                    fontFamily: SERIF,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(146,64,14,0.45)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(146,64,14,0.2)"; }}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <input
            className="flex-1 rounded-lg px-4 py-2.5 focus:outline-none"
            style={{
              background: "rgba(35,14,2,0.7)",
              border: "1px solid rgba(217,119,6,0.25)",
              color: "#F5DEB3",
              fontFamily: SERIF,
              fontSize: "0.875rem",
            }}
            placeholder="Search company or ticker…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="btn-3d px-5 py-2.5 rounded-lg font-semibold"
            style={{
              background: "linear-gradient(135deg, #92400E, #B45309)",
              color: "#FDE68A",
              border: "1px solid rgba(217,119,6,0.4)",
              fontFamily: SERIF,
              fontSize: "0.875rem",
            }}
            onClick={handleSearch}
          >
            Scout
          </button>
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <ul
            className="glass-card rounded-xl mb-5 overflow-hidden divide-y"
            style={{ borderColor: "rgba(217,119,6,0.15)" }}
          >
            {results.map((r: any) => (
              <li key={r.symbol}>
                <button
                  className="w-full text-left px-4 py-2.5 transition-colors"
                  style={{ color: "#F5DEB3", fontFamily: SERIF, fontSize: "0.875rem" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  onClick={() => handleSelect(r.symbol)}
                >
                  {r.display}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p
            className="text-red-400 mb-4 rounded-lg px-3 py-2"
            style={{
              background: "rgba(127,29,29,0.3)",
              border: "1px solid rgba(239,68,68,0.3)",
              fontFamily: SERIF,
              fontSize: "0.875rem",
            }}
          >
            {error}
          </p>
        )}

        {loading && (
          <div className="glass-card rounded-xl p-4 mb-5">
            <div className="flex items-center gap-3 mb-2" style={{ color: "#A07850" }}>
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#D97706 transparent transparent transparent" }}
              />
              <span style={{ fontFamily: SERIF, fontSize: "0.875rem" }}>
                {progressStep || "Processing stock data"}
              </span>
              <span className="ml-auto text-xs" style={{ color: "#C8A870" }}>
                {progressPct}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(217,119,6,0.18)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #D97706, #F59E0B)",
                  transition: "width 200ms ease",
                }}
              />
            </div>
          </div>
        )}

        {graphData && !loading && (
          <div className="space-y-4">

            {/* ── 4 Main Panels (2 × 2) ───────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Panel 1: Stock + 4 Stat Tabs */}
              <div className="glass-card rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-1"
                      style={{ fontFamily: SERIF, color: "#5A3810" }}
                    >
                      — Analysis —
                    </p>
                    <p className="text-3xl font-bold" style={{ fontFamily: SERIF, color: "#F59E0B" }}>
                      {prediction?.symbol ?? "—"}
                    </p>
                    <p className="text-sm mt-0.5" style={{ fontFamily: SERIF, color: "#7A5830" }}>
                      AI Prediction · Next Trading Day
                    </p>
                  </div>
                  {prediction && (
                    <button
                      className="btn-3d px-4 py-2 rounded-lg font-bold"
                      style={{
                        background: "linear-gradient(135deg, #D97706, #F59E0B)",
                        color: "#1C1007",
                        border: "none",
                        fontFamily: SERIF,
                        fontSize: "0.8125rem",
                        flexShrink: 0,
                      }}
                      onClick={() =>
                        router.push(
                          `/stocks/purchase?symbol=${prediction.symbol}&price=${prediction.expected_value}&shares=1`
                        )
                      }
                    >
                      Buy →
                    </button>
                  )}
                </div>

                {/* 2×2 stat panels */}
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <StatPanel
                    label="Boom Rating"
                    value={`${graphData.boom_score?.toFixed(0) ?? "—"}`}
                    suffix="/100"
                    color={
                      graphData.boom_score >= 70 ? "#22C55E"
                      : graphData.boom_score >= 45 ? "#EAB308"
                      : "#EF4444"
                    }
                  />
                  {prediction && (
                    <>
                      <StatPanel
                        label="Expected Value"
                        value={`$${prediction.expected_value?.toFixed(2)}`}
                        color="#F59E0B"
                      />
                      <StatPanel
                        label="Upper Bound"
                        value={`$${prediction.upper_bound?.toFixed(2)}`}
                        color="#34D399"
                      />
                      <StatPanel
                        label="Confidence"
                        value={`${(prediction.confidence * 100).toFixed(1)}%`}
                        color="#60A5FA"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Panel 2: 3-Line Comparison Chart */}
              <div className="glass-card rounded-xl overflow-hidden flex flex-col">
                <p
                  className="text-xs font-bold uppercase tracking-widest px-4 pt-4 pb-1"
                  style={{ fontFamily: SERIF, color: "#5A3810" }}
                >
                  — Performance vs S&P 500 —
                </p>
                {graphData.comparison_traces?.length > 0 ? (
                  <div className="flex-1">
                    <ComparisonChart
                      traces={graphData.comparison_traces}
                      layout={graphData.comparison_layout}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-sm" style={{ fontFamily: SERIF, color: "#5A3810" }}>
                      No comparison data available.
                    </p>
                  </div>
                )}
              </div>

              {/* Panel 3: AI Investor Profile */}
              <div className="glass-card rounded-xl p-5 flex flex-col">
                {graphData.investor_profile ? (
                  <InvestorProfile profile={graphData.investor_profile} />
                ) : prediction ? (
                  <InvestorProfileFallback boomScore={graphData.boom_score} />
                ) : null}
              </div>

              {/* Panel 4: Boom Meter */}
              <div className="glass-card rounded-xl p-5 flex flex-col">
                <BoomMeter
                  boomScore={graphData.boom_score}
                  boomLabel={graphData.boom_label}
                  marketOutperformance={graphData.market_outperformance}
                />
              </div>

            </div>

            {/* ── Collapsible: Indicator Charts + Full Chart ─────── */}
            <div className="glass-card rounded-xl overflow-hidden">
              <button
                className="w-full px-5 py-3.5 flex items-center justify-between transition-colors"
                style={{
                  borderBottom: showDetails ? "1px solid rgba(217,119,6,0.12)" : "none",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                onClick={() => setShowDetails((v) => !v)}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ fontFamily: SERIF, color: "#5A3810" }}
                >
                  — Technical Indicators & Full Chart —
                </p>
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: SERIF, color: "#F59E0B" }}
                >
                  {showDetails ? "Hide ▲" : "Show ▼"}
                </span>
              </button>

              {showDetails && (
                <div className="p-5 space-y-6">

                  {/* Indicator charts: flexbox, 3 per row */}
                  {graphData.indicator_charts?.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-4"
                        style={{ fontFamily: SERIF, color: "#5A3810" }}
                      >
                        — Indicator Charts —
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                        {graphData.indicator_charts.map((chart: any) => (
                          <div
                            key={chart.id}
                            className="glass-card rounded-xl overflow-hidden"
                            style={{ flex: "1 1 260px", minWidth: "min(260px, 100%)" }}
                          >
                            <p
                              className="font-bold uppercase tracking-wide px-4 pt-3"
                              style={{
                                fontFamily: SERIF,
                                color: "#C8A870",
                                fontSize: "0.75rem",
                              }}
                            >
                              {chart.title}
                            </p>
                            <ResidualChart traces={chart.traces} layout={chart.layout} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full 4-panel technical chart */}
                  {graphData.traces?.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-3"
                        style={{ fontFamily: SERIF, color: "#5A3810" }}
                      >
                        — Full Technical Chart · Price · Volume · RSI · MACD —
                      </p>
                      <div className="glass-card rounded-xl overflow-hidden">
                        <FullChart traces={graphData.traces} layout={graphData.layout} />
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

/* ── Stat Panel ────────────────────────────────────────────────────────── */
function StatPanel({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col justify-between"
      style={{ background: `${color}10`, border: `1px solid ${color}28` }}
    >
      <p
        className="font-bold uppercase tracking-wide mb-2"
        style={{ fontFamily: SERIF, color: `${color}99`, fontSize: "0.6875rem" }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span
          className="font-bold"
          style={{ fontFamily: SERIF, color, fontSize: "1.375rem" }}
        >
          {value}
        </span>
        {suffix && (
          <span style={{ fontFamily: SERIF, color: `${color}66`, fontSize: "0.75rem" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Boom Meter ────────────────────────────────────────────────────────── */
function BoomMeter({
  boomScore,
  boomLabel,
  marketOutperformance,
}: {
  boomScore: number;
  boomLabel: string;
  marketOutperformance: number | null;
}) {
  const pct = Math.max(0, Math.min(100, boomScore));

  return (
    <div className="flex flex-col h-full">
      <p
        className="font-bold uppercase tracking-widest mb-6"
        style={{ fontFamily: SERIF, color: "#5A3810", fontSize: "0.6875rem" }}
      >
        — Boom Meter —
      </p>

      {/* Bar */}
      <div
        className="relative h-4 rounded-full mb-2"
        style={{ background: "linear-gradient(to right, #EF4444 0%, #EAB308 50%, #22C55E 100%)" }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-6 rounded-sm bg-white shadow-lg"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
        <div
          className="absolute -top-6 font-bold text-white"
          style={{ fontFamily: SERIF, fontSize: "0.75rem", left: `calc(${pct}% - 8px)` }}
        >
          {pct}
        </div>
      </div>

      {/* Zone labels */}
      <div className="grid grid-cols-4 text-center mt-1 mb-6">
        <span className="font-bold uppercase" style={{ fontFamily: SERIF, color: "#EF4444", fontSize: "0.625rem" }}>Poor</span>
        <span className="font-bold uppercase" style={{ fontFamily: SERIF, color: "#EAB308", fontSize: "0.625rem" }}>OK</span>
        <span className="font-bold uppercase" style={{ fontFamily: SERIF, color: "#84CC16", fontSize: "0.625rem" }}>Good</span>
        <span className="font-bold uppercase" style={{ fontFamily: SERIF, color: "#22C55E", fontSize: "0.625rem" }}>Boom</span>
      </div>

      <p
        className="font-bold mb-2"
        style={{ fontFamily: SERIF, color: "#F59E0B", fontSize: "1.75rem" }}
      >
        {boomLabel}
      </p>

      {marketOutperformance != null && (
        <p style={{ fontFamily: SERIF, color: "#7A5830", fontSize: "0.875rem" }}>
          {marketOutperformance >= 0
            ? `+${marketOutperformance.toFixed(1)}% vs S&P 500`
            : `${marketOutperformance.toFixed(1)}% vs S&P 500`}
        </p>
      )}
    </div>
  );
}

/* ── Comparison Chart ──────────────────────────────────────────────────── */
function ComparisonChart({ traces, layout }: { traces: any[]; layout: any }) {
  const Plot = require("react-plotly.js").default;
  return (
    <Plot
      data={traces}
      layout={{
        ...layout,
        autosize: true,
        height: 290,
        margin: { t: 10, b: 70, l: 52, r: 14 },
        font: { ...layout.font, size: 12, family: "Georgia, Palatino, serif" },
        legend: {
          bgcolor: "rgba(0,0,0,0)",
          font: { size: 11, family: "Georgia, Palatino, serif" },
          orientation: "h",
          y: -0.3,
        },
      }}
      useResizeHandler
      style={{ width: "100%" }}
      config={{ displayModeBar: false, responsive: true }}
    />
  );
}

/* ── Investor Profile ──────────────────────────────────────────────────── */
function InvestorProfile({ profile }: { profile: any }) {
  const COLORS: Record<string, string> = { bullish: "#22C55E", neutral: "#EAB308", bearish: "#EF4444" };
  const EMOJI: Record<string, string> = { bullish: "🚀", neutral: "⚖️", bearish: "⚠️" };
  const color = COLORS[profile.signal] ?? "#F59E0B";

  return (
    <div className="flex flex-col h-full">
      <p
        className="font-bold uppercase tracking-widest mb-4"
        style={{ fontFamily: SERIF, color: "#5A3810", fontSize: "0.6875rem" }}
      >
        — AI Investor Profile —
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span style={{ fontSize: "1.75rem" }}>{EMOJI[profile.signal] ?? "📊"}</span>
        <span
          className="font-bold uppercase tracking-wide px-3 py-1 rounded-full"
          style={{
            fontFamily: SERIF,
            fontSize: "0.8125rem",
            background: `${color}18`,
            color,
            border: `1px solid ${color}35`,
          }}
        >
          {profile.signal}
        </span>
      </div>

      <p
        className="font-semibold mb-3"
        style={{ fontFamily: SERIF, color: "#C8A870", fontSize: "0.875rem" }}
      >
        Suited for:{" "}
        <span style={{ color: "#F59E0B" }}>{profile.suitable_for}</span>
      </p>

      <p
        className="leading-relaxed flex-1"
        style={{ fontFamily: SERIF, color: "#9A7850", fontSize: "0.875rem" }}
      >
        {profile.text}
      </p>

      <p
        className="mt-4"
        style={{ fontFamily: SERIF, color: "#4A2C10", fontSize: "0.75rem" }}
      >
        ☆ Not financial advice. Ride at your own risk.
      </p>
    </div>
  );
}

/* ── Investor Profile Fallback ─────────────────────────────────────────── */
function InvestorProfileFallback({ boomScore }: { boomScore: number }) {
  const signal = boomScore >= 70 ? "bullish" : boomScore >= 45 ? "neutral" : "bearish";
  const COLORS: Record<string, string> = { bullish: "#22C55E", neutral: "#EAB308", bearish: "#EF4444" };
  const color = COLORS[signal];

  return (
    <div className="flex flex-col h-full">
      <p
        className="font-bold uppercase tracking-widest mb-4"
        style={{ fontFamily: SERIF, color: "#5A3810", fontSize: "0.6875rem" }}
      >
        — AI Investor Profile —
      </p>
      <span
        className="font-bold uppercase px-3 py-1 rounded-full mb-4 self-start"
        style={{
          fontFamily: SERIF,
          fontSize: "0.8125rem",
          background: `${color}18`,
          color,
          border: `1px solid ${color}35`,
        }}
      >
        {signal}
      </span>
      <p
        className="leading-relaxed flex-1"
        style={{ fontFamily: SERIF, color: "#9A7850", fontSize: "0.875rem" }}
      >
        {signal === "bullish"
          ? "Strong indicators suggest this stock may outperform. Suitable for growth-oriented investors."
          : signal === "neutral"
          ? "Mixed signals. Consider a balanced approach with dollar-cost averaging."
          : "Caution advised. Consider waiting for clearer confirmation before entering."}
      </p>
      <p
        className="mt-4"
        style={{ fontFamily: SERIF, color: "#4A2C10", fontSize: "0.75rem" }}
      >
        ☆ Not financial advice. Ride at your own risk.
      </p>
    </div>
  );
}

/* ── Residual Chart (dropdown, natural size) ───────────────────────────── */
function ResidualChart({ traces, layout }: { traces: any[]; layout: any }) {
  const Plot = require("react-plotly.js").default;
  return (
    <Plot
      data={traces}
      layout={{
        ...layout,
        autosize: true,
        height: 230,
        margin: { t: 8, b: 36, l: 48, r: 10 },
        font: { ...layout.font, size: 12, family: "Georgia, Palatino, serif" },
        showlegend: false,
      }}
      useResizeHandler
      style={{ width: "100%" }}
      config={{ displayModeBar: false, responsive: true }}
    />
  );
}

/* ── Full Chart ────────────────────────────────────────────────────────── */
function FullChart({ traces, layout }: { traces: any[]; layout: any }) {
  const Plot = require("react-plotly.js").default;
  return (
    <Plot
      data={traces}
      layout={{
        ...layout,
        autosize: true,
        font: { ...layout.font, size: 12, family: "Georgia, Palatino, serif" },
      }}
      useResizeHandler
      style={{ width: "100%" }}
      config={{
        displayModeBar: true,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
        responsive: true,
      }}
    />
  );
}
