"use client";

import { useEffect, useRef, useState } from "react";
import { fetchSummary, scanDocument } from "../../lib/api/finances";
import { updateMyProfile } from "../../lib/api/users";
import { useApiToken } from "../../lib/hooks/useApiToken";

const SERIF = "Georgia, 'Palatino Linotype', Palatino, serif";

export default function FinancesIncomePage() {
  const token = useApiToken();

  // ── session state (pulled once on mount) ──────────────────────────────
  const [summary, setSummary]           = useState<any>(null);
  const [manualIncome, setManualIncome] = useState("");
  const [dirty, setDirty]               = useState(false); // unsaved changes?

  // ── action state ──────────────────────────────────────────────────────
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [savedMsg,  setSavedMsg]  = useState("");
  const [scanStep,  setScanStep]  = useState("");
  const [scanPct,   setScanPct]   = useState(0);
  const scanTimers = useRef<number[]>([]);

  // ── pull once on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchSummary(token)
      .then((data) => {
        setSummary(data);
        if (data.manual_income != null) {
          setManualIncome(String(data.manual_income));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // ── scan progress helpers ─────────────────────────────────────────────
  const clearScanTimers = () => {
    scanTimers.current.forEach((t) => window.clearTimeout(t));
    scanTimers.current = [];
  };
  const startScanProgress = () => {
    clearScanTimers();
    setScanStep("Uploading file"); setScanPct(12);
    scanTimers.current.push(window.setTimeout(() => { setScanStep("Running OCR");           setScanPct(42); }, 600));
    scanTimers.current.push(window.setTimeout(() => { setScanStep("Parsing transactions");  setScanPct(68); }, 1500));
    scanTimers.current.push(window.setTimeout(() => { setScanStep("Summarising totals");    setScanPct(86); }, 2500));
  };
  const finishScanProgress = () => {
    clearScanTimers();
    setScanStep("Done"); setScanPct(100);
    window.setTimeout(() => { setScanStep(""); setScanPct(0); }, 700);
  };

  // ── upload doc — saves to DB, then refreshes display ─────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) { setError("Please sign in to scan documents."); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    startScanProgress();
    try {
      await scanDocument(file, token);
      // refresh summary using current local income value (don't save it yet)
      const income = manualIncome ? parseFloat(manualIncome) : undefined;
      const data = await fetchSummary(token, income);
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      finishScanProgress();
      setUploading(false);
    }
  };

  // ── apply — recalculates display locally, does NOT write to DB ────────
  const handleApply = async () => {
    if (!token) { setError("Please sign in."); return; }
    const val = parseFloat(manualIncome);
    if (isNaN(val) || val < 0) return;
    try {
      const data = await fetchSummary(token, val);
      setSummary(data);
      setDirty(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── save — persists manual_income to DB via PATCH /me/profile ─────────
  const handleSave = async () => {
    if (!token) { setError("Please sign in."); return; }
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const val = manualIncome ? parseFloat(manualIncome) : undefined;
      await updateMyProfile(token, { manual_income: val });
      setDirty(false);
      setSavedMsg("Saved!");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "5rem" }}>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wide text-glow" style={{ fontFamily: SERIF, color: "#E8C060" }}>
            💰 Income &amp; Spending
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7A5830" }}>
            Track your earnings and expenses, partner
          </p>
        </div>

        {/* Manual income + upload row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* Manual income */}
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7A5830", fontFamily: SERIF }}>
              Monthly Income
            </p>
            <div className="flex gap-2 mb-3">
              <div className="flex flex-1">
                <span className="px-3 py-2 rounded-l-lg text-sm border-r-0"
                  style={{ background: "rgba(146,64,14,0.3)", border: "1px solid rgba(217,119,6,0.25)", color: "#E8C060" }}>
                  $
                </span>
                <input
                  type="number" min="0" step="0.01"
                  className="flex-1 px-3 py-2 rounded-r-lg text-sm focus:outline-none"
                  placeholder="e.g. 3500"
                  value={manualIncome}
                  onChange={(e) => { setManualIncome(e.target.value); setDirty(true); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  style={{ background: "rgba(20,8,0,0.6)", border: "1px solid rgba(217,119,6,0.25)", color: "#F5DEB3" }}
                />
              </div>
              <button onClick={handleApply} disabled={!manualIncome}
                className="px-3 py-2 rounded-lg text-sm font-semibold btn-3d disabled:opacity-40"
                style={{ background: "rgba(146,64,14,0.5)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.3)" }}>
                Apply
              </button>
            </div>
            {/* Save button */}
            <button onClick={handleSave} disabled={saving || !dirty}
              className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: dirty ? "rgba(74,222,128,0.2)" : "rgba(40,40,40,0.3)",
                       border: `1px solid ${dirty ? "rgba(74,222,128,0.4)" : "rgba(80,80,80,0.3)"}`,
                       color: dirty ? "#4ADE80" : "#5A5A5A" }}>
              {saving ? "Saving…" : savedMsg || (dirty ? "💾 Save Changes" : "No changes")}
            </button>
          </div>

          {/* Document upload */}
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7A5830", fontFamily: SERIF }}>
              Upload Document
            </p>
            <label className="block cursor-pointer">
              <div className="rounded-lg px-4 py-3 text-center text-sm transition-colors"
                style={{ border: "1px dashed rgba(217,119,6,0.4)", background: "rgba(20,8,0,0.4)",
                         color: uploading ? "#7A5830" : "#C8A870" }}>
                {uploading ? "Scanning document..." : "PDF / JPG / PNG"}
              </div>
              <input type="file" accept=".pdf,image/jpeg,image/png" className="hidden"
                onChange={handleFile} disabled={uploading} />
            </label>
            {uploading && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase tracking-wider" style={{ color: "#7A5830" }}>
                    {scanStep || "Working"}
                  </span>
                  <span className="text-[11px]" style={{ color: "#C8A870" }}>{scanPct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(217,119,6,0.18)" }}>
                  <div className="h-full" style={{ width: `${scanPct}%`,
                    background: "linear-gradient(90deg, #D97706, #F59E0B)", transition: "width 200ms ease" }} />
                </div>
              </div>
            )}
            <p className="text-[10px] mt-2" style={{ color: "#5A3820" }}>
              Tip: use finances_millionaire.png as a test file
            </p>
          </div>
        </div>

        {error && (
          <p className="mb-4 px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(180,30,30,0.2)", color: "#F87171", border: "1px solid rgba(180,30,30,0.3)" }}>
            {error}
          </p>
        )}

        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(217,119,6,0.6)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "#7A5830" }}>Loading your finances…</p>
            </div>
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <StatCard label="Monthly Income"      value={`$${summary.total_income.toFixed(2)}`}                    accent="#4ADE80" />
              <StatCard label="Monthly Expenses"    value={`$${Math.abs(summary.total_expenses).toFixed(2)}`}        accent="#F87171" />
              <StatCard label="Bills (fixed)"        value={`$${summary.bills_total.toFixed(2)}`}                    accent="#FB923C" />
              <StatCard label="Disposable Income"   value={`$${summary.disposable_income.toFixed(2)}`}
                accent={summary.disposable_income >= 0 ? "#4ADE80" : "#F87171"} />
              <StatCard label="Yearly Income (est.)"   value={`$${(summary.yearly_total_income ?? 0).toFixed(2)}`}   accent="#60A5FA" />
              <StatCard label="Yearly Expenses (est.)" value={`$${Math.abs(summary.yearly_total_expenses ?? 0).toFixed(2)}`} accent="#F87171" />
            </div>

            <div className="glass-card rounded-xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#E8C060", fontFamily: SERIF }}>
                By Category
              </h2>
              <ul className="space-y-1">
                {Object.entries(summary.by_category ?? {}).map(([cat, val]: any) => (
                  <li key={cat} className="flex justify-between items-center py-1.5"
                    style={{ borderBottom: "1px solid rgba(217,119,6,0.1)" }}>
                    <span className="text-sm capitalize" style={{ color: "#C8A870" }}>{cat}</span>
                    <span className="text-sm font-semibold" style={{ color: val < 0 ? "#F87171" : "#4ADE80" }}>
                      ${Math.abs(val).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-sm" style={{ color: "#5A3820" }}>
              Enter your income or upload a document to see your summary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "#7A5830" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: accent, fontFamily: SERIF }}>{value}</p>
    </div>
  );
}
