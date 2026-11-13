import React from 'react';

// ================= 1. UTILITY POLE & WIRES (電線桿) =================
export const UtilityPole: React.FC<{ width?: number; height?: number }> = ({
  width = 96,
  height = 192,
}) => {
  return (
    <svg viewBox="0 0 96 192" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      {/* Main Wooden Pole */}
      <rect x="42" y="24" width="12" height="168" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      {/* Top Crossbars */}
      <rect x="20" y="32" width="56" height="6" fill="#a16207" stroke="#713f12" strokeWidth="1" />
      <rect x="26" y="52" width="44" height="5" fill="#a16207" stroke="#713f12" strokeWidth="1" />
      {/* Insulator Caps */}
      <rect x="24" y="28" width="4" height="4" fill="#f8fafc" />
      <rect x="68" y="28" width="4" height="4" fill="#f8fafc" />
      <rect x="30" y="48" width="4" height="4" fill="#f8fafc" />
      <rect x="62" y="48" width="4" height="4" fill="#f8fafc" />
      {/* Transformer Canister */}
      <rect x="48" y="66" width="22" height="32" fill="#64748b" stroke="#334155" strokeWidth="2" rx="2" />
      <rect x="52" y="72" width="14" height="6" fill="#94a3b8" />
      {/* Cable Lines dangling */}
      <line x1="0" y1="32" x2="24" y2="30" stroke="#0f172a" strokeWidth="2" />
      <line x1="72" y1="30" x2="96" y2="32" stroke="#0f172a" strokeWidth="2" />
      <line x1="0" y1="52" x2="30" y2="50" stroke="#0f172a" strokeWidth="1" />
      <line x1="66" y1="50" x2="96" y2="52" stroke="#0f172a" strokeWidth="1" />
      {/* Street Sign / Notice on Pole */}
      <rect x="38" y="118" width="20" height="26" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <rect x="41" y="122" width="14" height="4" fill="#ef4444" />
      <line x1="42" y1="130" x2="54" y2="130" stroke="#0f172a" strokeWidth="1" />
      <line x1="42" y1="135" x2="52" y2="135" stroke="#0f172a" strokeWidth="1" />
    </svg>
  );
};

// ================= 2. RETRO BILLBOARD & BENCH (大型街頭復古廣告看板與長椅) =================
export const RetroBillboard: React.FC<{ width?: number; height?: number }> = ({
  width = 160,
  height = 112,
}) => {
  return (
    <svg viewBox="0 0 160 112" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      {/* Billboard Metal Frame Legs */}
      <rect x="18" y="58" width="6" height="50" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      <rect x="136" y="58" width="6" height="50" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      {/* Outer Billboard Frame */}
      <rect x="10" y="4" width="140" height="74" fill="#f8fafc" stroke="#334155" strokeWidth="3" rx="2" />
      {/* Billboard Poster Area */}
      <rect x="14" y="8" width="132" height="66" fill="#1e1b4b" />
      {/* Retro Poster Graphics (Anime girl with drink as in reference image) */}
      <rect x="14" y="8" width="132" height="66" fill="#fbcfe8" />
      {/* Typography: "CITY 60's" */}
      <text x="24" y="32" fill="#e11d48" fontSize="16" fontFamily="sans-serif" fontWeight="900" fontStyle="italic">
        CITY
      </text>
      <text x="26" y="44" fill="#881337" fontSize="8" fontFamily="sans-serif" fontWeight="bold">
        CASINO & BAR
      </text>
      {/* Anime Silhouette Artwork */}
      <circle cx="112" cy="28" r="14" fill="#f43f5e" />
      <ellipse cx="112" cy="22" rx="9" ry="8" fill="#fda4af" />
      {/* Hair */}
      <ellipse cx="110" cy="18" rx="10" ry="8" fill="#451a03" />
      <rect x="100" y="24" width="6" height="14" fill="#451a03" />
      {/* Red Dress & Legs */}
      <polygon points="106,36 122,36 128,58 98,58" fill="#e11d48" />
      <line x1="102" y1="58" x2="88" y2="70" stroke="#fbcfe8" strokeWidth="4" />
      <line x1="112" y1="58" x2="108" y2="70" stroke="#fbcfe8" strokeWidth="4" />
      {/* Cocktail Glass */}
      <polygon points="90,32 98,32 94,40" fill="#38bdf8" />
      <line x1="94" y1="40" x2="94" y2="48" stroke="#ffffff" strokeWidth="2" />

      {/* Park Bench in front of Billboard */}
      <rect x="42" y="82" width="76" height="18" fill="#78350f" stroke="#451a03" strokeWidth="2" rx="1" />
      {/* Bench Slats */}
      <rect x="44" y="85" width="72" height="3" fill="#a16207" />
      <rect x="44" y="91" width="72" height="3" fill="#a16207" />
      {/* Bench Cast Iron Legs */}
      <rect x="48" y="98" width="4" height="12" fill="#1e293b" />
      <rect x="108" y="98" width="4" height="12" fill="#1e293b" />
    </svg>
  );
};

// ================= 3. PARKED RETRO MINI CAR (停在路邊的復古小白車) =================
export const ParkedMiniCar: React.FC<{ width?: number; height?: number }> = ({
  width = 96,
  height = 64,
}) => {
  return (
    <svg viewBox="0 0 96 64" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      {/* Ground Shadow */}
      <ellipse cx="48" cy="58" rx="42" ry="5" fill="rgba(0,0,0,0.35)" />
      {/* Car Body Base */}
      <rect x="10" y="26" width="76" height="26" fill="#f8fafc" stroke="#334155" strokeWidth="2" rx="4" />
      {/* Rounded Cabin Roof */}
      <polygon points="26,10 68,10 80,26 14,26" fill="#f8fafc" stroke="#334155" strokeWidth="2" />
      {/* Windows with Tint & Reflection */}
      <polygon points="28,12 46,12 46,24 18,24" fill="#7dd3fc" stroke="#0284c7" strokeWidth="1" />
      <polygon points="50,12 66,12 76,24 50,24" fill="#7dd3fc" stroke="#0284c7" strokeWidth="1" />
      {/* Window Highlight Stripe */}
      <line x1="24" y1="14" x2="36" y2="22" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
      {/* Headlights & Tail Lights */}
      <rect x="8" y="32" width="4" height="6" fill="#ef4444" />
      <circle cx="84" cy="34" r="4" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
      {/* Chrome Bumper */}
      <rect x="6" y="42" width="6" height="5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
      <rect x="84" y="42" width="6" height="5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
      {/* Door Handle */}
      <rect x="42" y="30" width="8" height="2" fill="#64748b" />
      {/* Cute Front Fender Badge */}
      <rect x="76" y="34" width="3" height="3" fill="#3b82f6" />
      {/* Wheels */}
      <circle cx="26" cy="52" r="9" fill="#1e293b" />
      <circle cx="26" cy="52" r="4" fill="#cbd5e1" />
      <circle cx="68" cy="52" r="9" fill="#1e293b" />
      <circle cx="68" cy="52" r="4" fill="#cbd5e1" />
    </svg>
  );
};

// ================= 4. JAPANESE VENDING MACHINE (自動販賣機) =================
export const VendingMachine: React.FC<{ width?: number; height?: number }> = ({
  width = 48,
  height = 72,
}) => {
  return (
    <svg viewBox="0 0 48 72" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      {/* Vending Machine Cabinet */}
      <rect x="4" y="6" width="40" height="64" fill="#e11d48" stroke="#881337" strokeWidth="2" rx="2" />
      {/* Lighted Canopy Header */}
      <rect x="8" y="10" width="32" height="10" fill="#ffffff" />
      <text x="24" y="17" textAnchor="middle" fill="#e11d48" fontSize="6" fontFamily="sans-serif" fontWeight="bold">
        DRINKS
      </text>
      {/* Drinks Showcase Grid */}
      <rect x="8" y="24" width="32" height="26" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
      {/* Shelf 1 Cans */}
      <rect x="11" y="27" width="5" height="8" fill="#3b82f6" />
      <rect x="18" y="27" width="5" height="8" fill="#22c55e" />
      <rect x="25" y="27" width="5" height="8" fill="#facc15" />
      <rect x="32" y="27" width="5" height="8" fill="#ef4444" />
      {/* Push Buttons */}
      <rect x="11" y="36" width="5" height="2" fill="#38bdf8" />
      <rect x="18" y="36" width="5" height="2" fill="#38bdf8" />
      <rect x="25" y="36" width="5" height="2" fill="#38bdf8" />
      <rect x="32" y="36" width="5" height="2" fill="#38bdf8" />
      {/* Shelf 2 Cans */}
      <rect x="11" y="40" width="5" height="8" fill="#a855f7" />
      <rect x="18" y="40" width="5" height="8" fill="#06b6d4" />
      <rect x="25" y="40" width="5" height="8" fill="#f97316" />
      <rect x="32" y="40" width="5" height="8" fill="#ec4899" />
      {/* Dispenser Slot */}
      <rect x="10" y="55" width="28" height="9" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
      {/* Coin Return */}
      <rect x="34" y="51" width="3" height="2" fill="#facc15" />
    </svg>
  );
};

// ================= 5. HEDGE BUSHES & SPHERICAL STREET LAMPS =================
export const StreetLamp: React.FC<{ width?: number; height?: number }> = ({
  width = 32,
  height = 56,
}) => {
  return (
    <svg viewBox="0 0 32 56" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      {/* Stone Base */}
      <rect x="11" y="46" width="10" height="10" fill="#64748b" stroke="#334155" strokeWidth="1" />
      {/* Metal Post */}
      <rect x="14" y="16" width="4" height="30" fill="#334155" />
      {/* Ornate Lamp Bracket */}
      <rect x="12" y="18" width="8" height="2" fill="#1e293b" />
      {/* Glowing Spherical Globe */}
      <circle cx="16" cy="12" r="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="14" cy="10" r="3" fill="#ffffff" />
      {/* Soft Glow Effect */}
      <circle cx="16" cy="12" r="14" fill="#fef08a" opacity="0.2" />
    </svg>
  );
};

export const FloweringHedge: React.FC<{ width?: number; height?: number }> = ({
  width = 48,
  height = 40,
}) => {
  return (
    <svg viewBox="0 0 48 40" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      {/* Stone Planter Curb */}
      <rect x="2" y="24" width="44" height="14" fill="#94a3b8" stroke="#475569" strokeWidth="2" rx="1" />
      <rect x="4" y="26" width="40" height="4" fill="#cbd5e1" />
      {/* Lush Green Foliage Mound */}
      <ellipse cx="24" cy="20" rx="20" ry="14" fill="#15803d" />
      <ellipse cx="24" cy="18" rx="17" ry="11" fill="#16a34a" />
      <ellipse cx="20" cy="14" rx="12" ry="8" fill="#22c55e" />
      {/* Pink & Purple Flowers */}
      <circle cx="14" cy="18" r="2.5" fill="#f43f5e" />
      <circle cx="28" cy="16" r="2.5" fill="#a855f7" />
      <circle cx="36" cy="20" r="2" fill="#ec4899" />
      <circle cx="22" cy="22" r="2" fill="#fde047" />
    </svg>
  );
};

// ================= 6. ROAD MARKING & MANHOLE COVER =================
export const ManholeCover: React.FC<{ width?: number; height?: number }> = ({
  width = 36,
  height = 36,
}) => {
  return (
    <svg viewBox="0 0 36 36" width={width} height={height} shapeRendering="crispEdges" className="select-none pointer-events-none">
      <circle cx="18" cy="18" r="16" fill="#475569" stroke="#1e293b" strokeWidth="2" />
      <circle cx="18" cy="18" r="12" fill="#334155" stroke="#1e293b" strokeWidth="1" />
      <circle cx="18" cy="18" r="5" fill="#1e293b" />
      {/* Radial grip spokes */}
      <line x1="18" y1="6" x2="18" y2="30" stroke="#1e293b" strokeWidth="2" />
      <line x1="6" y1="18" x2="30" y2="18" stroke="#1e293b" strokeWidth="2" />
    </svg>
  );
};
