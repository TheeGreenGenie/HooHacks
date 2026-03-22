"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { purchaseStock, fetchPlatformWallet } from "../../lib/api/stocks";
import { useApiToken } from "../../lib/hooks/useApiToken";

const METHODS = [
  { id: "simulation", label: "Simulation", icon: "🎮", desc: "Free demo — no real money" },
  { id: "stripe",     label: "Card",       icon: "💳", desc: "Credit / Debit via Stripe" },
  { id: "solana",     label: "Solana",     icon: "◎",  desc: "Pay with SOL" },
];

function PurchaseForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useApiToken();

  const symbol    = params.get("symbol") ?? "";
  const initPrice = parseFloat(params.get("price") ?? "0");
  const initShares = parseFloat(params.get("shares") ?? "1");

  const [method, setMethod]   = useState("simulation");
  const [shares, setShares]   = useState(String(initShares));
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);
  const [error, setError]     = useState("");
  const [wallet, setWallet]   = useState<{ address: string; balance_sol: number } | null>(null);

  const sharesNum = parseFloat(shares) || 0;
  const totalUsd  = (sharesNum * initPrice).toFixed(2);

  useEffect(() => {
    fetchPlatformWallet(token).then(setWallet).catch(() => {});
  }, [token]);

  const handleBuy = async () => {
    if (sharesNum <= 0) { setError("Enter a valid number of shares."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await purchaseStock(symbol, sharesNum, method, token);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── Confirmation screen ────────────────────────────────────── */
  if (result) {
    const isSolana = result.payment_method === "solana";
    const pd = result.payment_detail ?? {};
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
          <p className="text-5xl text-center mb-4">{isSolana ? "◎" : "✅"}</p>
          <h1 className="text-2xl font-bold text-center mb-6">
            {isSolana ? "Complete Your Solana Payment" : "Purchase Confirmed"}
          </h1>

          <div className="space-y-3 text-sm mb-6">
            <Row label="Symbol"        value={result.symbol} />
            <Row label="Shares"        value={result.shares} />
            <Row label="Price / share" value={`$${result.price_per_share?.toFixed(4)}`} />
            <Row label="Total USD"     value={`$${result.total_usd?.toFixed(2)}`} />
            {result.wolfram_sol && (
              <Row label="≈ SOL" value={result.wolfram_sol} highlight />
            )}
          </div>

          {/* Solana payment instructions */}
          {isSolana && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
              <h2 className="font-bold text-purple-800 mb-3">◎ Solana Payment Details</h2>
              {pd.amount_sol > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Amount to send</p>
                  <p className="text-2xl font-bold text-purple-700">{pd.amount_sol?.toFixed(6)} SOL</p>
                </div>
              )}
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Platform wallet address</p>
                <code className="block bg-white border rounded p-2 text-xs break-all text-gray-800 select-all">
                  {pd.platform_wallet ?? wallet?.address ?? "Loading…"}
                </code>
              </div>
              <p className="text-xs text-gray-500 mb-3">{pd.message}</p>
              {pd.explorer && (
                <a
                  href={pd.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:underline"
                >
                  View wallet on Solana Explorer →
                </a>
              )}
            </div>
          )}

          {/* Stripe result */}
          {result.payment_method === "stripe" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h2 className="font-bold text-blue-800 mb-2">💳 Payment Status</h2>
              <p className="text-sm text-gray-700">{pd.message ?? "Processing…"}</p>
              {pd.payment_intent_id && (
                <p className="text-xs text-gray-400 mt-1">Intent ID: {pd.payment_intent_id}</p>
              )}
            </div>
          )}

          {/* Simulation result */}
          {result.payment_method === "simulation" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-green-800">{pd.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/stocks/portfolio")}
              className="flex-1 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700"
            >
              View Portfolio
            </button>
            <button
              onClick={() => router.push("/stocks/suggestions")}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
            >
              Buy More
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Purchase form ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 mb-4 text-sm">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-1">Buy {symbol}</h1>
        <p className="text-3xl font-bold text-amber-700 mb-6">${initPrice.toFixed(4)}</p>

        {/* Shares */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
        <input
          type="number"
          min="0.0001"
          step="0.0001"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 text-xl mb-1"
        />
        <p className="text-sm text-gray-500 mb-6">
          Total: <span className="font-semibold text-gray-800">${totalUsd}</span>
        </p>

        {/* Payment method */}
        <p className="text-sm font-medium text-gray-700 mb-3">Payment method</p>
        <div className="space-y-2 mb-6">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-colors ${
                method === m.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-semibold text-sm">{m.label}</p>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
              {method === m.id && <span className="ml-auto text-amber-600 font-bold">✓</span>}
            </button>
          ))}
        </div>

        {/* Solana info box */}
        {method === "solana" && wallet?.address && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 text-sm">
            <p className="font-semibold text-purple-800 mb-1">◎ Platform Wallet</p>
            <code className="block bg-white border rounded p-2 text-xs break-all text-gray-700 select-all mb-2">
              {wallet.address}
            </code>
            <p className="text-xs text-gray-500">
              Wolfram Alpha will calculate the exact SOL amount on confirmation.
            </p>
            {wallet.balance_sol > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                Platform balance: {wallet.balance_sol.toFixed(4)} SOL
              </p>
            )}
          </div>
        )}

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Processing…" : `Confirm Purchase — $${totalUsd}`}
        </button>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <PurchaseForm />
    </Suspense>
  );
}

function Row({ label, value, highlight }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${highlight ? "text-purple-700" : ""}`}>{value}</span>
    </div>
  );
}
