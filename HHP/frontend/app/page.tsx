"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useApiToken } from "./lib/hooks/useApiToken";
import { fetchSavings } from "./lib/api/finances";
import { fetchMyProfile } from "./lib/api/users";
import Link from "next/link";
import FrontierFinanceLogo from "./components/FrontierFinanceLogo";

/* ── Data ──────────────────────────────────────────────────────────────── */
const MAIN_CARDS = [
  {
    title: "Stocks",
    description: "Browse businesses, get AI predictions, manage your portfolio.",
    href: "/stocks/suggestions",
    icon: "📈",
    accent: "#F59E0B",
    sub: [
      { label: "History", href: "/stocks/history" },
      { label: "Portfolio", href: "/stocks/portfolio" },
    ],
  },
  {
    title: "Finances",
    description: "Track income, analyze spending, get AI-powered savings tips.",
    href: "/finances/income",
    icon: "💰",
    accent: "#34D399",
    sub: [
      { label: "Savings", href: "/finances/savings" },
      { label: "Voice Chat", href: "/finances/chat" },
    ],
  },
  {
    title: "Frontier Rider",
    description: "Dodge bandits, collect gold bags. How far can you ride?",
    href: "/frontier-rider",
    icon: "🤠",
    accent: "#F87171",
    sub: [],
  },
];

/* ── Components ────────────────────────────────────────────────────────── */
function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="glass-card glass-card-hover rounded-xl px-5 py-4 flex justify-between items-center group"
      style={{ textDecoration: "none" }}
    >
      <div>
        <p className="font-semibold text-sm" style={{ color: "#E8C870" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#7A5830" }}>{desc}</p>
      </div>
      <span
        className="text-lg"
        style={{ color: "#5A3818", transition: "transform 0.15s ease" }}
      >
        ›
      </span>
    </Link>
  );
}

function MainCard({ card }: { card: (typeof MAIN_CARDS)[0] }) {
  return (
    <Link
      href={card.href}
      className="glass-card glass-card-hover rounded-2xl p-7 flex flex-col group relative overflow-hidden"
      style={{ textDecoration: "none" }}
    >
      {/* Corner accent glow */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 100, height: 100,
        borderRadius: "0 1rem 0 100%",
        background: `radial-gradient(circle at 80% 20%, ${card.accent}18, transparent 70%)`,
      }} />

      <span style={{ fontSize: "2.25rem", marginBottom: "0.85rem", filter: `drop-shadow(0 0 10px ${card.accent}55)` }}>
        {card.icon}
      </span>

      <h3
        className="text-lg font-bold mb-2"
        style={{ fontFamily: "Georgia, serif", color: card.accent }}
      >
        {card.title}
      </h3>
      <p className="text-sm leading-relaxed flex-1" style={{ color: "#9A7850" }}>
        {card.description}
      </p>

      {card.sub.length > 0 && (
        <div className="flex gap-2 mt-5 flex-wrap">
          {card.sub.map((s) => (
            <span
              key={s.href}
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: `${card.accent}14`,
                color: card.accent,
                border: `1px solid ${card.accent}28`,
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div
        className="mt-5 flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: card.accent, transition: "gap 0.15s ease" }}
      >
        <span>Ride in</span>
        <span>→</span>
      </div>
    </Link>
  );
}

/* ── Landing page (logged-out) ─────────────────────────────────────────── */
function LandingPage() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "rgba(12,4,0,0.78)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(217,119,6,0.28)",
          borderRadius: "1.75rem",
          padding: "3rem 2.5rem 2.5rem",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 80px rgba(217,119,6,0.08)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <FrontierFinanceLogo size={180} />
        </div>

        {/* Tagline */}
        <h1
          className="text-glow"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            color: "#E8C060",
            fontWeight: 700,
            letterSpacing: "0.03em",
            marginBottom: "0.75rem",
          }}
        >
          Ride the Financial Frontier
        </h1>
        <p style={{ color: "#9A7040", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          AI-powered stocks, smart savings, voice coaching — and a little
          western adventure along the way.
        </p>

        {/* Gold divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(217,119,6,0.5),transparent)", marginBottom: "2rem" }} />

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <a
            href="/api/auth/login?screen_hint=signup"
            style={{
              display: "block",
              padding: "0.8rem 1.5rem",
              borderRadius: "0.875rem",
              background: "linear-gradient(135deg, #92400E, #B45309)",
              color: "#FDE68A",
              border: "1px solid rgba(217,119,6,0.5)",
              fontWeight: 700,
              fontSize: "0.95rem",
              textDecoration: "none",
              letterSpacing: "0.04em",
              boxShadow: "0 4px 16px rgba(146,64,14,0.45)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            🤠 &nbsp;Create Account
          </a>
          <a
            href="/api/auth/login"
            style={{
              display: "block",
              padding: "0.8rem 1.5rem",
              borderRadius: "0.875rem",
              background: "rgba(255,255,255,0.04)",
              color: "#D4B483",
              border: "1px solid rgba(217,119,6,0.22)",
              fontWeight: 600,
              fontSize: "0.95rem",
              textDecoration: "none",
              letterSpacing: "0.04em",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Sign In
          </a>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginTop: "2rem" }}>
          {["📈 AI Stocks", "💰 Savings Tips", "🗣️ Voice Chat", "🏇 Frontier Rider"].map(f => (
            <span
              key={f}
              style={{
                fontSize: "0.72rem",
                padding: "0.3rem 0.75rem",
                borderRadius: "999px",
                background: "rgba(217,119,6,0.1)",
                border: "1px solid rgba(217,119,6,0.2)",
                color: "#C8A040",
                fontWeight: 600,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { user, isLoading } = useUser();
  const token = useApiToken();
  const [tips, setTips] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (!token) return;
    fetchSavings(token)
      .then((all) => setTips(all.slice(0, 3)))
      .catch(() => {});
    fetchMyProfile(token)
      .then((p) => {
        // Prefer full_name > display_name > Auth0 name > email-prefix > "Cowboy"
        const emailPrefix = user?.email?.split("@")[0] ?? "";
        setDisplayName(
          p.full_name?.split(" ")[0] ||
          p.display_name ||
          user?.name?.split(" ")[0] ||
          emailPrefix ||
          "Cowboy"
        );
      })
      .catch(() => {
        const emailPrefix = user?.email?.split("@")[0] ?? "";
        setDisplayName(user?.name?.split(" ")[0] || emailPrefix || "Cowboy");
      });
  }, [token]); // eslint-disable-line

  const name = displayName || user?.name?.split(" ")[0] || "Cowboy";

  // Show landing page for logged-out visitors
  if (!isLoading && !user) return <LandingPage />;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", paddingBottom: "5rem" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="text-center py-20 px-6 relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(217,119,6,0.1)" }}
      >
        {/* Horizontal gold line behind text */}
        <div style={{
          position: "absolute", left: "50%", top: "55%",
          transform: "translate(-50%, -50%)",
          width: "55%", height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(217,119,6,0.3), transparent)",
          pointerEvents: "none",
        }} />

        <p style={{ fontSize: "3.5rem", filter: "drop-shadow(0 0 24px rgba(217,119,6,0.65))", marginBottom: "1.25rem" }}>
          🤠
        </p>
        <h1
          className="text-glow font-bold mb-3"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.9rem, 5vw, 3.1rem)",
            color: "#E8C060",
            letterSpacing: "0.02em",
          }}
        >
          Howdy, {name}!
        </h1>
        <p style={{ color: "#9A7040", fontSize: "1rem", maxWidth: 460, margin: "0 auto 2rem" }}>
          Your frontier money guide — AI stocks, savings smarts, and voice chat on the open range.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/stocks/suggestions"
            className="btn-3d px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "linear-gradient(135deg, #92400E, #B45309)", color: "#FDE68A", border: "1px solid rgba(217,119,6,0.45)" }}
          >
            Browse Stocks
          </Link>
          <Link
            href="/finances/income"
            className="btn-3d px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "rgba(255,255,255,0.04)", color: "#D4B483", border: "1px solid rgba(217,119,6,0.2)" }}
          >
            Track Finances
          </Link>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-12">

        {/* Section label */}
        <p
          className="text-xs font-bold uppercase tracking-widest mb-5 text-center"
          style={{ color: "#5A3810" }}
        >
          — Where would you like to ride? —
        </p>

        {/* Main cards */}
        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          {MAIN_CARDS.map((card) => (
            <MainCard key={card.href} card={card} />
          ))}
        </div>

        {/* Gold divider */}
        <div className="gold-divider mb-10" />

        {/* Savings tips */}
        {tips.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#C8A040" }}
              >
                Today's Savings Tips
              </h2>
              <Link
                href="/finances/savings"
                className="text-xs font-semibold"
                style={{ color: "#5A9050" }}
              >
                See all →
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {tips.map((tip, i) => (
                <div key={i} className="glass-card rounded-xl px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#4CAF6B" }}>
                    {tip.category}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#9A7850" }}>
                    {tip.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#5A3810" }}
          >
            — Quick Access —
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink href="/stocks/history"     label="Stock History"   desc="OHLCV charts + indicators" />
            <QuickLink href="/stocks/portfolio"   label="Portfolio"       desc="Your holdings & P&L" />
            <QuickLink href="/finances/savings"   label="Savings Tips"    desc="AI-powered spending analysis" />
            <QuickLink href="/finances/stores"    label="Nearby Stores"   desc="Best prices near you" />
            <QuickLink href="/finances/chat"      label="Voice Chat"      desc="Talk to Frontier Frank" />
            <QuickLink href="/stocks/suggestions" label="AI Predictions"  desc="ML-powered stock forecasts" />
          </div>
        </section>
      </div>
    </div>
  );
}
