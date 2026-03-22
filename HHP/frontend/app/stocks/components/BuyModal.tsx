"use client";

import { useState } from "react";
import { purchaseStock } from "../../lib/api/stocks";

const METHODS = [
  { id: "simulation", label: "Simulation", icon: "🎮", desc: "Free — no real money" },
  { id: "stripe",     label: "Card",       icon: "💳", desc: "Credit / Debit via Stripe" },
  { id: "solana",     label: "Solana",     icon: "◎",  desc: "Pay with SOL" },
];

interface Props {
  symbol: string;
  currentPrice: number;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuyModal({ symbol, currentPrice, token, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState("simulation");
  const [shares, setShares] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const sharesNum = parseFloat(shares) || 0;
  const totalUsd = (sharesNum * currentPrice).toFixed(2);

  const handleBuy = async () => {
    if (sharesNum <= 0) { setError("Enter a valid number of shares."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await purchaseStock(symbol, sharesNum, method, token);
      setResult(res);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">

        {result ? (
          /* ── Confirmation screen ── */
          <div>
            <p className="text-4xl text-center mb-3">✅</p>
            <h2 className="text-xl font-bold text-center mb-4">Purchase Confirmed</h2>
            <div className="space-y-2 text-sm mb-4">
              <Row label="Symbol"        value={result.symbol} />
              <Row label="Shares"        value={result.shares} />
              <Row label="Price / share" value={`$${result.price_per_share?.toFixed(4)}`} />
              <Row label="Total USD"     value={`$${result.total_usd?.toFixed(2)}`} />
              <Row label="Method"        value={result.payment_method} />
              {result.wolfram_sol && (
                <Row label="≈ SOL"       value={result.wolfram_sol} />
              )}
              <Row label="Payment status" value={result.payment_detail?.status ?? "—"} />
              {result.payment_detail?.message && (
                <p className="text-gray-500 text-xs mt-1">{result.payment_detail.message}</p>
              )}
            </div>
            <button
              className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Purchase form ── */
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Buy {symbol}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <p className="text-sm text-gray-500 mb-1">Current price</p>
            <p className="text-2xl font-bold text-amber-700 mb-4">${currentPrice.toFixed(4)}</p>

            {/* Shares input */}
            <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-1 text-lg"
            />
            <p className="text-sm text-gray-500 mb-4">
              Total: <span className="font-semibold text-gray-800">${totalUsd}</span>
            </p>

            {/* Payment method */}
            <p className="text-sm font-medium text-gray-700 mb-2">Payment method</p>
            <div className="space-y-2 mb-5">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 border rounded-lg px-4 py-3 text-left transition-colors ${
                    method === m.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                  {method === m.id && <span className="ml-auto text-amber-600">✓</span>}
                </button>
              ))}
            </div>

            {method === "solana" && (
              <p className="text-xs text-gray-400 mb-3">
                SOL equivalent will be calculated via Wolfram Alpha and shown on confirmation.
              </p>
            )}

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Processing…" : `Confirm Purchase — $${totalUsd}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
