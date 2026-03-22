"use client";

import FrontierRiderGame from "./WildRiderGame";

export default function WildRiderPage() {
  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem 1rem" }}>
      <h1
        className="text-glow font-bold mb-1 text-center"
        style={{ fontFamily: "Georgia, serif", color: "#E8C060", fontSize: "clamp(1.4rem, 4vw, 2rem)" }}
      >
        🤠 Frontier Rider
      </h1>
      <p className="mb-5 text-center text-sm" style={{ color: "#7A5830" }}>
        Dodge obstacles — earn money on good collisions. Space / Tap to jump.
      </p>
      <div style={{ width: "100%", maxWidth: 860 }}>
        <FrontierRiderGame />
      </div>
    </div>
  );
}
