import React from 'react';

interface CozyCottageBuildingProps {
  width?: number;
  height?: number;
  className?: string;
  roofColor?: string;
  roofShadow?: string;
  ownerName?: string;
  isSelf?: boolean;
}

export const CozyCottageBuilding: React.FC<CozyCottageBuildingProps> = ({
  width = 240, // 5 tiles wide
  height = 192, // 4 tiles high
  className = '',
  roofColor = '#d97706',
  roofShadow = '#b45309',
  ownerName = '冒險家',
  isSelf = false,
}) => {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg
        viewBox="0 0 240 192"
        width="100%"
        height="100%"
        className="select-none pointer-events-none"
        shapeRendering="crispEdges"
      >
        {/* Red Brick Chimney with Puffy Smoke */}
        <rect x="172" y="16" width="22" height="48" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
        <rect x="170" y="12" width="26" height="6" fill="#991b1b" />
        {/* Smoke Puffs */}
        <circle cx="183" cy="6" r="6" fill="#e2e8f0" opacity="0.8" />
        <circle cx="188" cy="-4" r="9" fill="#f1f5f9" opacity="0.6" />

        {/* Main Slanted Gabled Roof */}
        <polygon points="120,24 16,92 224,92" fill={roofShadow} stroke="#451a03" strokeWidth="3" />
        <polygon points="120,28 24,90 216,90" fill={roofColor} />
        {/* Roof Shingle Texture Lines */}
        <line x1="40" y1="78" x2="200" y2="78" stroke={roofShadow} strokeWidth="2" />
        <line x1="60" y1="64" x2="180" y2="64" stroke={roofShadow} strokeWidth="2" />
        <line x1="85" y1="48" x2="155" y2="48" stroke={roofShadow} strokeWidth="2" />

        {/* Round Attic Dormer Window */}
        <circle cx="120" cy="62" r="14" fill="#1e293b" stroke="#78350f" strokeWidth="3" />
        <circle cx="120" cy="62" r="10" fill="#fef08a" />
        <line x1="120" y1="52" x2="120" y2="72" stroke="#78350f" strokeWidth="2" />
        <line x1="110" y1="62" x2="130" y2="62" stroke="#78350f" strokeWidth="2" />

        {/* House Front Walls (Warm Cream Stucco & Wood Trim) */}
        <rect x="30" y="90" width="180" height="96" fill="#fef3c7" stroke="#78350f" strokeWidth="3" />

        {/* Left Front Bay Window with Flower Box */}
        <rect x="44" y="108" width="46" height="42" fill="#93c5fd" stroke="#451a03" strokeWidth="3" />
        <rect x="46" y="110" width="42" height="38" fill="#e0f2fe" />
        <line x1="67" y1="110" x2="67" y2="148" stroke="#451a03" strokeWidth="2" />
        <line x1="46" y1="128" x2="88" y2="128" stroke="#451a03" strokeWidth="2" />
        {/* Wooden Flower Box with Colorful Blossoms */}
        <rect x="40" y="148" width="54" height="10" fill="#854d0e" stroke="#451a03" strokeWidth="2" />
        <circle cx="48" cy="146" r="4" fill="#f43f5e" />
        <circle cx="58" cy="145" r="4" fill="#facc15" />
        <circle cx="68" cy="146" r="4" fill="#ec4899" />
        <circle cx="78" cy="145" r="4" fill="#38bdf8" />
        <circle cx="88" cy="146" r="4" fill="#a855f7" />

        {/* Cozy Cottage Wooden Front Door */}
        <rect x="110" y="112" width="36" height="74" fill="#854d0e" stroke="#451a03" strokeWidth="3" />
        <rect x="114" y="116" width="12" height="28" fill="#a16207" />
        <rect x="130" y="116" width="12" height="28" fill="#a16207" />
        <rect x="114" y="150" width="12" height="30" fill="#713f12" />
        <rect x="130" y="150" width="12" height="30" fill="#713f12" />
        {/* Brass Door Knob */}
        <circle cx="140" cy="154" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        {/* Welcome Mat */}
        <rect x="104" y="184" width="48" height="6" fill="#15803d" stroke="#166534" strokeWidth="1" />

        {/* Right Wall Sconce Lamp */}
        <rect x="156" y="124" width="6" height="12" fill="#1e293b" />
        <circle cx="159" cy="120" r="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

        {/* Right Garden Trellis & Ivy */}
        <rect x="174" y="102" width="28" height="60" fill="none" stroke="#a16207" strokeWidth="2" strokeDasharray="6,6" />
        <circle cx="178" cy="114" r="7" fill="#16a34a" />
        <circle cx="192" cy="126" r="8" fill="#15803d" />
        <circle cx="184" cy="144" r="9" fill="#22c55e" />
      </svg>

      {/* Floating Wooden Mailbox / Name Signpost */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-md flex items-center gap-1 border whitespace-nowrap bg-amber-950/90 text-amber-100 border-amber-600/70 backdrop-blur-xs select-none">
        <span>🏡</span>
        <span className="truncate max-w-[120px]">{ownerName}</span>
        {isSelf && (
          <span className="bg-emerald-500 text-white text-[9px] px-1 py-0.2 rounded font-mono">我的家</span>
        )}
      </div>
    </div>
  );
};
