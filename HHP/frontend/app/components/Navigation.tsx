"use client";

import { useState, useRef, useEffect } from "react";
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import dynamic from "next/dynamic";
import FrontierFinanceLogo from "./FrontierFinanceLogo";

const AuthenticationNavigation = dynamic(
  () => import("./authentication/AuthenticationNavigation"),
  { ssr: false },
);

const NAV = [
  {
    name: "Stocks",
    children: [
      { name: "Businesses & Suggestions", to: "/stocks/suggestions" },
      { name: "Stock History", to: "/stocks/history" },
      { name: "Portfolio", to: "/stocks/portfolio" },
    ],
  },
  {
    name: "Finances",
    children: [
      { name: "Income & Spending", to: "/finances/income" },
      { name: "Savings Tips", to: "/finances/savings" },
      { name: "Nearby Stores", to: "/finances/stores" },
      { name: "Voice Chat", to: "/finances/chat" },
    ],
  },
  { name: "Frontier Rider", to: "/frontier-rider" },
  { name: "My Profile", to: "/profile" },
];

/* ── Desktop dropdown ──────────────────────────────────────────────────── */
function DesktopDropdown({ item }: { item: (typeof NAV)[0] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!item.children) {
    return (
      <Link
        href={item.to!}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        style={{ color: "#D4B483" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#F59E0B")}
        onMouseLeave={e => (e.currentTarget.style.color = "#D4B483")}
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        style={{ color: open ? "#F59E0B" : "#D4B483", background: open ? "rgba(255,255,255,0.05)" : "transparent" }}
      >
        {item.name}
        <ChevronDownIcon
          className="h-3.5 w-3.5 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="dropdown-shadow absolute left-0 top-full z-50 mt-2 w-56 rounded-xl overflow-hidden"
          style={{
            background: "rgba(12, 4, 0, 0.94)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(217, 119, 6, 0.22)",
          }}
        >
          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(217,119,6,0.5), transparent)" }} />
          {item.children.map((child, i) => (
            <Link
              key={child.to}
              href={child.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm transition-colors"
              style={{
                color: "#C8A870",
                borderBottom: i < item.children!.length - 1 ? "1px solid rgba(217,119,6,0.08)" : "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#F59E0B"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#C8A870"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main navigation ───────────────────────────────────────────────────── */
export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="nav-glass"
      style={{ position: "sticky", top: 0, zIndex: 50 }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center mr-8 shrink-0">
            <FrontierFinanceLogo size={44} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5 flex-1">
            {NAV.map((item) => (
              <DesktopDropdown key={item.name} item={item} />
            ))}
          </nav>

          {/* Auth + mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <AuthenticationNavigation />
            </div>
            <button
              className="sm:hidden p-2 rounded-lg transition-colors"
              style={{ color: "#C8A870" }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Gold accent line at bottom */}
      <div className="gold-divider" />

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: "rgba(8, 2, 0, 0.96)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(217,119,6,0.12)",
          }}
        >
          <div className="px-4 py-4 space-y-1">
            {/* Mobile menu logo header */}
            <div className="flex items-center gap-3 px-1 pb-3 mb-1" style={{ borderBottom: "1px solid rgba(217,119,6,0.12)" }}>
              <FrontierFinanceLogo size={36} />
            </div>
            {NAV.map((item) =>
              item.children ? (
                <div key={item.name} className="mb-3">
                  <p className="px-3 py-1" style={{ color: "#7A5020", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    {item.name}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      href={child.to}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 text-sm rounded-lg transition-colors"
                      style={{ color: "#C8A870" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#F59E0B")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#C8A870")}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.to!}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: "#D4B483" }}
                >
                  {item.name}
                </Link>
              )
            )}
            <div className="pt-3" style={{ borderTop: "1px solid rgba(217,119,6,0.12)" }}>
              <AuthenticationNavigation />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
