import React from 'react';

interface BoutiqueBuildingProps {
  width?: number;
  height?: number;
  className?: string;
}

export const BoutiqueBuilding: React.FC<BoutiqueBuildingProps> = ({
  width = 240, // 5 tiles wide
  height = 192, // 4 tiles high
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 240 192"
      width={width}
      height={height}
      className={`select-none pointer-events-none ${className}`}
      shapeRendering="crispEdges"
    >
      {/* Upper Parapet & Roof Trim */}
      <rect x="16" y="24" width="208" height="24" fill="#831843" stroke="#500724" strokeWidth="2" />
      <rect x="12" y="18" width="216" height="8" fill="#be185d" />
      {/* Decorative Roof Urns / Ornaments */}
      <rect x="24" y="10" width="8" height="8" fill="#fbcfe8" />
      <rect x="116" y="8" width="8" height="10" fill="#fbcfe8" />
      <rect x="208" y="10" width="8" height="8" fill="#fbcfe8" />

      {/* Boutique Signboard */}
      <rect x="52" y="28" width="136" height="18" fill="#fbcfe8" stroke="#be185d" strokeWidth="2" rx="2" />
      <text
        x="120"
        y="41"
        textAnchor="middle"
        fill="#831843"
        fontSize="11"
        fontFamily="sans-serif"
        fontWeight="900"
        letterSpacing="3"
      >
        ✦ BOUTIQUE ✦
      </text>

      {/* Main Building Stucco Walls */}
      <rect x="20" y="48" width="200" height="138" fill="#fdf2f8" stroke="#831843" strokeWidth="3" />

      {/* Striped Fabric Awning (Pink & Cream) */}
      <polygon points="16,66 224,66 230,86 10,86" fill="#db2777" stroke="#9d174d" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <polygon
          key={i}
          points={`${20 + i * 26},66 ${34 + i * 26},66 ${36 + i * 26},86 ${22 + i * 26},86`}
          fill="#fdf2f8"
        />
      ))}
      {/* Scalloped Awning Fringe */}
      {[...Array(14)].map((_, i) => (
        <circle key={i} cx={18 + i * 15} cy={88} r="5" fill="#db2777" />
      ))}

      {/* Left Glass Showcase Window with Fashion Mannequin */}
      <rect x="32" y="96" width="76" height="80" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
      <rect x="36" y="100" width="68" height="72" fill="#f0f9ff" />
      {/* Showcase Mannequin with Designer Dress */}
      <ellipse cx="70" cy="112" rx="6" ry="6" fill="#fde68a" />
      <rect x="68" y="118" width="4" height="6" fill="#fde68a" />
      {/* Cute Dress */}
      <polygon points="66,124 74,124 82,156 58,156" fill="#ec4899" />
      <rect x="64" y="124" width="12" height="4" fill="#ffffff" />
      <rect x="68" y="156" width="4" height="14" fill="#78350f" />
      {/* Showcase Glass Glare Highlight */}
      <line x1="42" y1="102" x2="88" y2="168" stroke="#ffffff" strokeWidth="3" opacity="0.6" />

      {/* Right French Boutique Double Entrance Door */}
      <rect x="130" y="96" width="70" height="90" fill="#831843" stroke="#500724" strokeWidth="3" />
      {/* Left Door Panel */}
      <rect x="134" y="100" width="29" height="82" fill="#9d174d" />
      <rect x="138" y="104" width="21" height="38" fill="#fdf2f8" opacity="0.9" />
      <rect x="138" y="148" width="21" height="28" fill="#701a75" />
      <circle cx="160" cy="144" r="2.5" fill="#facc15" />
      {/* Right Door Panel */}
      <rect x="167" y="100" width="29" height="82" fill="#9d174d" />
      <rect x="171" y="104" width="21" height="38" fill="#fdf2f8" opacity="0.9" />
      <rect x="171" y="148" width="21" height="28" fill="#701a75" />
      <circle cx="170" cy="144" r="2.5" fill="#facc15" />

      {/* Potted Rose Topiary Plants */}
      <rect x="22" y="160" width="8" height="16" fill="#b45309" />
      <circle cx="26" cy="154" r="9" fill="#15803d" />
      <circle cx="25" cy="153" r="3" fill="#f43f5e" />

      <rect x="210" y="160" width="8" height="16" fill="#b45309" />
      <circle cx="214" cy="154" r="9" fill="#15803d" />
      <circle cx="213" cy="153" r="3" fill="#f43f5e" />
    </svg>
  );
};
