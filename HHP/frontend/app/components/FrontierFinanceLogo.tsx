// Frontier Finance SVG Logo — inline, no external assets required
export default function FrontierFinanceLogo({
  size = 220,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Frontier Finance logo"
    >
      <defs>
        {/* Radial glow behind badge */}
        <radialGradient id="ff-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#92400E" stopOpacity="0" />
        </radialGradient>

        {/* Badge fill */}
        <linearGradient id="ff-badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1C0A00" />
          <stop offset="100%" stopColor="#0D0400" />
        </linearGradient>

        {/* Hat fill */}
        <linearGradient id="ff-hat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#3B1A00" />
          <stop offset="100%" stopColor="#1F0D00" />
        </linearGradient>

        {/* Sun / horizon glow */}
        <radialGradient id="ff-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="60%"  stopColor="#D97706" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#92400E" stopOpacity="0" />
        </radialGradient>

        {/* Gold shimmer on text */}
        <linearGradient id="ff-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FDE68A" />
          <stop offset="50%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <filter id="ff-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
        </filter>
        <filter id="ff-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Outer ambient glow ─────────────────────────── */}
      <circle cx="110" cy="110" r="105" fill="url(#ff-glow)" />

      {/* ── Outer ring ────────────────────────────────── */}
      <circle cx="110" cy="110" r="100" fill="none"
        stroke="#92400E" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />

      {/* ── Shield / Badge body ───────────────────────── */}
      {/* Octagonal badge */}
      <path
        d="M110,18
           L158,32 L188,72 L188,132
           L158,172 L110,188
           L62,172 L32,132
           L32,72 L62,32 Z"
        fill="url(#ff-badge)"
        stroke="#D97706"
        strokeWidth="2"
        filter="url(#ff-shadow)"
      />

      {/* Inner badge border */}
      <path
        d="M110,26
           L153,38 L180,74 L180,130
           L153,166 L110,178
           L67,166 L40,130
           L40,74 L67,38 Z"
        fill="none"
        stroke="#92400E"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* ── Horizon / Mesa landscape ──────────────────── */}
      {/* Sun glow on horizon */}
      <ellipse cx="110" cy="128" rx="28" ry="10" fill="url(#ff-sun)" />
      {/* Horizon line */}
      <line x1="48" y1="128" x2="172" y2="128" stroke="#D97706" strokeWidth="0.8" opacity="0.6" />
      {/* Left mesa */}
      <polygon
        points="48,128 56,108 72,100 88,108 88,128"
        fill="#2A1000" opacity="0.9"
      />
      {/* Right mesa */}
      <polygon
        points="172,128 164,110 148,102 134,112 134,128"
        fill="#2A1000" opacity="0.9"
      />
      {/* Center small butte */}
      <polygon
        points="96,128 101,118 110,114 119,118 124,128"
        fill="#1C0800" opacity="0.8"
      />

      {/* ── Cactus (left of hat) ──────────────────────── */}
      {/* Main trunk */}
      <rect x="60" y="90" width="7" height="38" rx="3.5" fill="#1A4A1A" />
      {/* Left arm */}
      <rect x="49" y="96" width="11" height="5" rx="2.5" fill="#1A4A1A" />
      <rect x="49" y="86" width="5" height="15" rx="2.5" fill="#1A4A1A" />
      {/* Right arm */}
      <rect x="67" y="100" width="11" height="5" rx="2.5" fill="#1A4A1A" />
      <rect x="73" y="90" width="5" height="15" rx="2.5" fill="#1A4A1A" />
      {/* Cactus highlight */}
      <line x1="62" y1="92" x2="62" y2="126" stroke="#2D6B2D" strokeWidth="1" opacity="0.6" />

      {/* ── Cowboy Hat ───────────────────────────────── */}
      {/* Wide brim */}
      <ellipse cx="110" cy="78" rx="42" ry="9"
        fill="url(#ff-hat)"
        stroke="#D97706" strokeWidth="1.2"
        filter="url(#ff-shadow)"
      />
      {/* Crown */}
      <path
        d="M75,78 Q76,42 110,40 Q144,42 145,78 Z"
        fill="url(#ff-hat)"
        stroke="#D97706" strokeWidth="1.2"
      />
      {/* Hat band */}
      <path
        d="M76,76 Q76,70 110,70 Q144,70 144,76"
        fill="none" stroke="#F59E0B" strokeWidth="2.5"
      />
      {/* Band star */}
      <polygon
        points="110,66 112,71 117,71 113,74 115,79 110,76 105,79 107,74 103,71 108,71"
        fill="#F59E0B"
        filter="url(#ff-glow-filter)"
      />
      {/* Hat indent crease */}
      <path
        d="M90,55 Q110,50 130,55"
        fill="none" stroke="#0D0400" strokeWidth="2" opacity="0.5"
      />

      {/* ── Dollar coin (right side) ──────────────────── */}
      <circle cx="155" cy="105" r="14" fill="#1C0A00" stroke="#D97706" strokeWidth="1.5" />
      <circle cx="155" cy="105" r="10" fill="none" stroke="#92400E" strokeWidth="0.8" opacity="0.5" />
      <text x="155" y="110" textAnchor="middle"
        fontSize="13" fontWeight="bold" fill="url(#ff-gold)"
        fontFamily="Georgia, serif">$</text>

      {/* ── "FRONTIER" text ──────────────────────────── */}
      <text
        x="110" y="150"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        letterSpacing="3"
        fill="url(#ff-gold)"
        fontFamily="Georgia, 'Times New Roman', serif"
        filter="url(#ff-shadow)"
      >
        FRONTIER
      </text>

      {/* ── Decorative divider ────────────────────────── */}
      <line x1="62" y1="156" x2="158" y2="156" stroke="#D97706" strokeWidth="0.8" opacity="0.5" />
      <circle cx="110" cy="156" r="2" fill="#F59E0B" opacity="0.8" />

      {/* ── "FINANCE" text ────────────────────────────── */}
      <text
        x="110" y="170"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        letterSpacing="4.5"
        fill="#C8A040"
        fontFamily="Georgia, 'Times New Roman', serif"
        opacity="0.9"
      >
        FINANCE
      </text>
    </svg>
  );
}
