import React from 'react';

interface GrandArcadeComplexProps {
  width?: number;
  height?: number;
  className?: string;
}

export const GrandArcadeComplex: React.FC<GrandArcadeComplexProps> = ({
  width = 576, // 12 tiles wide (12 * 48)
  height = 384, // 8 tiles high (8 * 48)
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 576 384"
      className={`w-full h-full select-none ${className}`}
      shapeRendering="crispEdges"
    >
      {/* ================= BACKGROUND SKY & CLOUDS BEHIND ROOF ================= */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8ec5fc" />
          <stop offset="100%" stopColor="#e0c3fc" />
        </linearGradient>
        <pattern id="brickPattern" width="12" height="6" patternUnits="userSpaceOnUse">
          <rect width="12" height="6" fill="#8c5843" />
          <rect x="0" y="0" width="11" height="5" fill="#a46950" />
          <rect x="6" y="3" width="5" height="3" fill="#754532" />
        </pattern>
      </defs>

      {/* ================= LEFT BUILDING (TRADITIONAL GABLED HOUSE) ================= */}
      {/* Left Wall Base */}
      <rect x="0" y="80" width="96" height="260" fill="#2d3748" />
      <rect x="8" y="100" width="80" height="235" fill="#4a5568" />
      {/* Slanted Japanese Blue Gabled Roof */}
      <polygon points="48,30 -10,88 106,88" fill="#1e3a8a" />
      <polygon points="48,34 -4,85 100,85" fill="#2563eb" />
      <rect x="-8" y="84" width="112" height="8" fill="#1e293b" />
      {/* Exterior Pipes & Vents */}
      <rect x="18" y="90" width="6" height="240" fill="#94a3b8" />
      <rect x="16" y="120" width="10" height="4" fill="#64748b" />
      <rect x="16" y="190" width="10" height="4" fill="#64748b" />
      <rect x="16" y="270" width="10" height="4" fill="#64748b" />
      {/* Left House Windows with Warm Light */}
      <rect x="36" y="120" width="40" height="50" fill="#1e293b" stroke="#78350f" strokeWidth="3" />
      <rect x="40" y="124" width="32" height="42" fill="#fef08a" />
      <line x1="56" y1="124" x2="56" y2="166" stroke="#78350f" strokeWidth="2" />
      <line x1="40" y1="145" x2="72" y2="145" stroke="#78350f" strokeWidth="2" />
      {/* Lower Shop Doorway / Shutter */}
      <rect x="30" y="230" width="52" height="105" fill="#334155" stroke="#1e293b" strokeWidth="3" />
      <rect x="36" y="240" width="40" height="95" fill="#0f172a" />
      <rect x="38" y="250" width="36" height="6" fill="#3b82f6" />
      <rect x="38" y="265" width="36" height="6" fill="#3b82f6" />
      <rect x="38" y="280" width="36" height="6" fill="#3b82f6" />

      {/* ================= RIGHT COURTYARD & PINE GARDEN ================= */}
      {/* Courtyard Brick Wall */}
      <rect x="480" y="90" width="96" height="250" fill="#475569" />
      <rect x="484" y="94" width="88" height="242" fill="url(#brickPattern)" />
      {/* Stone Spikes on Wall */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <polygon key={i} points={`${488 + i * 11},90 ${493 + i * 11},78 ${498 + i * 11},90`} fill="#334155" />
      ))}
      {/* Japanese Pine Bonsai Tree in Garden */}
      <rect x="520" y="160" width="10" height="120" fill="#5c2d15" />
      <rect x="510" y="200" width="20" height="8" fill="#5c2d15" />
      {/* Layered Pine Needles */}
      <ellipse cx="505" cy="180" rx="26" ry="14" fill="#14532d" />
      <ellipse cx="505" cy="177" rx="22" ry="10" fill="#166534" />
      <ellipse cx="535" cy="150" rx="30" ry="16" fill="#14532d" />
      <ellipse cx="535" cy="147" rx="24" ry="12" fill="#16a34a" />
      <ellipse cx="525" cy="120" rx="28" ry="14" fill="#15803d" />
      <ellipse cx="525" cy="117" rx="22" ry="10" fill="#22c55e" />

      {/* ================= CENTER MAIN GRAND COMPLEX ("銭屋") ================= */}
      {/* Main Base Facade */}
      <rect x="100" y="70" width="376" height="270" fill="#f8fafc" />
      <rect x="104" y="74" width="368" height="262" fill="url(#brickPattern)" />

      {/* Tier 3: Rooftop "GAME" Billboard Tower */}
      <rect x="236" y="4" width="104" height="66" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
      <rect x="242" y="10" width="92" height="32" fill="#dc2626" />
      <text x="288" y="32" textAnchor="middle" fill="#ffffff" fontSize="18" fontFamily="monospace" fontWeight="bold">
        GAME
      </text>
      {/* Ivy on Rooftop */}
      <rect x="232" y="42" width="24" height="24" fill="#15803d" />
      <rect x="240" y="50" width="18" height="18" fill="#22c55e" />
      <rect x="320" y="40" width="24" height="26" fill="#15803d" />
      <rect x="328" y="48" width="16" height="18" fill="#16a34a" />

      {/* Tier 2: Rooftop Garden Terrace & Railings */}
      <rect x="130" y="66" width="316" height="16" fill="#334155" />
      {/* Terrace Railings */}
      {[...Array(24)].map((_, i) => (
        <rect key={i} x={136 + i * 13} y="48" width="4" height="20" fill="#cbd5e1" />
      ))}
      <rect x="132" y="46" width="312" height="4" fill="#94a3b8" />
      {/* Rooftop Bushes & Foliage */}
      <rect x="140" y="54" width="80" height="14" fill="#166534" />
      <rect x="356" y="54" width="80" height="14" fill="#166534" />

      {/* Tier 2 Arch & Center Clock */}
      <rect x="230" y="76" width="116" height="40" fill="#1e1b4b" stroke="#312e81" strokeWidth="3" />
      {/* Center Clock */}
      <circle cx="288" cy="94" r="14" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
      <line x1="288" y1="94" x2="288" y2="84" stroke="#0f172a" strokeWidth="2" />
      <line x1="288" y1="94" x2="295" y2="94" stroke="#0f172a" strokeWidth="2" />
      {/* Glowing Star Accents */}
      <text x="250" y="98" fill="#facc15" fontSize="14" fontWeight="bold">★</text>
      <text x="264" y="98" fill="#facc15" fontSize="14" fontWeight="bold">★</text>
      <text x="306" y="98" fill="#facc15" fontSize="14" fontWeight="bold">★</text>
      <text x="320" y="98" fill="#facc15" fontSize="14" fontWeight="bold">★</text>

      {/* Directional Neon Arrows: Left & Right */}
      {/* Left Orange/Red Arrow ◀ 服飾館 */}
      <rect x="136" y="86" width="84" height="26" fill="#ea580c" rx="4" stroke="#7c2d12" strokeWidth="2" />
      <text x="178" y="103" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
        ◀ 服飾精品
      </text>
      {/* Right Cyan Arrow 街機廳 ▶ */}
      <rect x="356" y="86" width="84" height="26" fill="#0284c7" rx="4" stroke="#0369a1" strokeWidth="2" />
      <text x="398" y="103" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
        街機遊樂 ▶
      </text>

      {/* Side Neon Banners (as in reference image) */}
      {/* Left Blue Vertical Banner: 大正口 */}
      <rect x="144" y="118" width="38" height="60" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="2" />
      <text x="163" y="142" textAnchor="middle" fill="#ffffff" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
        大正口
      </text>
      <text x="163" y="162" textAnchor="middle" fill="#93c5fd" fontSize="9" fontFamily="sans-serif">
        ルエン
      </text>

      {/* Right Cyan Vertical Banner: 金銀島 */}
      <rect x="394" y="118" width="46" height="60" fill="#0e7490" stroke="#155e75" strokeWidth="2" />
      <text x="417" y="152" textAnchor="middle" fill="#fef08a" fontSize="13" fontFamily="sans-serif" fontWeight="bold">
        金銀島
      </text>

      {/* ================= GRAND WOODEN CENTER SIGN: 銭屋 ================= */}
      <rect x="208" y="116" width="160" height="64" fill="#78350f" stroke="#451a03" strokeWidth="4" rx="2" />
      <rect x="214" y="122" width="148" height="52" fill="#b45309" stroke="#92400e" strokeWidth="2" />
      {/* Traditional Calligraphy Signboard */}
      <rect x="220" y="126" width="136" height="44" fill="#dc2626" />
      <text
        x="288"
        y="158"
        textAnchor="middle"
        fill="#fef08a"
        fontSize="30"
        fontFamily="sans-serif"
        fontWeight="900"
        letterSpacing="8"
        style={{ filter: 'drop-shadow(2px 2px 0px #7f1d1d)' }}
      >
        銭屋
      </text>

      {/* Main Building Columns & Pillars */}
      <rect x="188" y="186" width="22" height="154" fill="#1e1b4b" stroke="#312e81" strokeWidth="3" />
      <rect x="366" y="186" width="22" height="154" fill="#1e1b4b" stroke="#312e81" strokeWidth="3" />
      <rect x="236" y="186" width="14" height="154" fill="#1e1b4b" />
      <rect x="326" y="186" width="14" height="154" fill="#1e1b4b" />

      {/* Red Festive Temple Lanterns on Pillars */}
      <rect x="189" y="244" width="20" height="24" fill="#ef4444" rx="4" />
      <rect x="194" y="240" width="10" height="4" fill="#000000" />
      <rect x="194" y="268" width="10" height="4" fill="#000000" />
      <rect x="367" y="244" width="20" height="24" fill="#ef4444" rx="4" />
      <rect x="372" y="240" width="10" height="4" fill="#000000" />
      <rect x="372" y="268" width="10" height="4" fill="#000000" />

      {/* Upper Windows with Wood Shutters */}
      <rect x="200" y="128" width="0" height="0" />
      <rect x="188" y="126" width="16" height="46" fill="#1e293b" />
      <rect x="372" y="126" width="16" height="46" fill="#1e293b" />

      {/* ================= SLIDING AUTOMATIC DOUBLE ENTRANCE DOORS ================= */}
      {/* Door Frame */}
      <rect x="250" y="196" width="76" height="144" fill="#0f172a" stroke="#1e293b" strokeWidth="3" />
      {/* Left Glass Door */}
      <rect x="254" y="200" width="33" height="136" fill="#1e293b" />
      <rect x="258" y="206" width="25" height="66" fill="#0284c7" opacity="0.8" />
      {/* Circular Frosted Viewport Eyes (as in reference image) */}
      <circle cx="270" cy="236" r="10" fill="#f8fafc" stroke="#0369a1" strokeWidth="2" />
      <circle cx="270" cy="236" r="4" fill="#0284c7" />
      {/* Right Glass Door */}
      <rect x="289" y="200" width="33" height="136" fill="#1e293b" />
      <rect x="293" y="206" width="25" height="66" fill="#0284c7" opacity="0.8" />
      <circle cx="306" cy="236" r="10" fill="#f8fafc" stroke="#0369a1" strokeWidth="2" />
      <circle cx="306" cy="236" r="4" fill="#0284c7" />

      {/* Entrance Welcome Steps */}
      <rect x="242" y="340" width="92" height="12" fill="#64748b" stroke="#334155" strokeWidth="2" />
      <rect x="236" y="352" width="104" height="10" fill="#475569" stroke="#1e293b" strokeWidth="2" />
      <text x="288" y="360" textAnchor="middle" fill="#fde047" fontSize="8" fontFamily="monospace" fontWeight="bold">
        ▼ 進入 Qian-Wu 街機與商城 ▼
      </text>

      {/* Potted Planters at Entrance */}
      <rect x="222" y="326" width="16" height="18" fill="#ea580c" />
      <ellipse cx="230" cy="324" rx="10" ry="8" fill="#16a34a" />
      <rect x="338" y="326" width="16" height="18" fill="#ea580c" />
      <ellipse cx="346" cy="324" rx="10" ry="8" fill="#16a34a" />
    </svg>
  );
};
