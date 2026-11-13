import React from 'react';

interface CozyCottageBuildingProps {
  width?: number;
  height?: number;
  className?: string;
  level?: number; // 1, 2, 3, 4
  ownerName?: string;
  isSelf?: boolean;
  onUpgradeClick?: () => void;
}

export const CozyCottageBuilding: React.FC<CozyCottageBuildingProps> = ({
  width = 240,
  height = 192,
  className = '',
  level = 1,
  ownerName = '冒險家',
  isSelf = false,
  onUpgradeClick,
}) => {
  const safeLevel = Math.min(Math.max(level, 1), 4);

  const getLevelLabel = (lvl: number) => {
    switch (lvl) {
      case 1:
        return 'Lv.1 紅頂小屋';
      case 2:
        return 'Lv.2 原木小屋';
      case 3:
        return 'Lv.3 石木宅邸';
      case 4:
        return 'Lv.4 雙層莊園';
      default:
        return 'Lv.1 小屋';
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* ================= LEVEL-SPECIFIC ARCHITECTURAL PIXEL ART ================= */}
      {safeLevel === 1 && (
        /* --- TIER 1: RED CONICAL ROOF COTTAGE (Ref: media_1794590294990_ae4334ed.jpg) --- */
        <svg
          viewBox="0 0 240 192"
          width="100%"
          height="100%"
          className="select-none pointer-events-none"
          shapeRendering="crispEdges"
        >
          {/* Tall Red Brick Chimney on Right */}
          <rect x="180" y="32" width="22" height="66" fill="#854d0e" stroke="#451a03" strokeWidth="3" />
          <rect x="176" y="26" width="30" height="8" fill="#451a03" />
          {/* Conical Steep Red Shingle Roof */}
          <polygon points="120,20 30,102 210,102" fill="#b91c1c" stroke="#451a03" strokeWidth="4" />
          <polygon points="120,28 38,100 202,100" fill="#dc2626" />
          {/* Roof Shingle Highlight Curves */}
          <path d="M 90 48 Q 120 54 150 48" stroke="#ef4444" strokeWidth="4" fill="none" />
          <path d="M 68 68 Q 120 76 172 68" stroke="#ef4444" strokeWidth="4" fill="none" />
          <path d="M 48 88 Q 120 98 192 88" stroke="#ef4444" strokeWidth="4" fill="none" />

          {/* White Plaster Wall Base */}
          <rect x="44" y="100" width="152" height="78" fill="#f8fafc" stroke="#1e293b" strokeWidth="4" />
          {/* Bottom Shadow Wall */}
          <rect x="48" y="164" width="144" height="10" fill="#e2e8f0" />

          {/* Left Square Mullion Window */}
          <rect x="58" y="112" width="40" height="36" fill="#7dd3fc" stroke="#451a03" strokeWidth="3" />
          <line x1="78" y1="112" x2="78" y2="148" stroke="#451a03" strokeWidth="2" />
          <line x1="58" y1="130" x2="98" y2="130" stroke="#451a03" strokeWidth="2" />

          {/* Right Tiny Oval Window */}
          <rect x="156" y="114" width="26" height="16" rx="4" fill="#7dd3fc" stroke="#451a03" strokeWidth="3" />

          {/* Center Wooden Entrance Door */}
          <rect x="110" y="120" width="32" height="58" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="114" y="124" width="24" height="24" fill="#92400e" />
          {/* Golden Brass Knob */}
          <circle cx="134" cy="148" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />

          {/* Green Grass Foundation Lawn */}
          <rect x="36" y="174" width="168" height="6" fill="#15803d" />
          <polygon points="36,174 46,182 36,182" fill="#166534" />
          <polygon points="204,174 194,182 204,182" fill="#166534" />
        </svg>
      )}

      {safeLevel === 2 && (
        /* --- TIER 2: LOG CABIN WITH PURPLE ROOF (Ref: media_1794590294969_f9641548.jpg) --- */
        <svg
          viewBox="0 0 240 192"
          width="100%"
          height="100%"
          className="select-none pointer-events-none"
          shapeRendering="crispEdges"
        >
          {/* Top Chimney */}
          <rect x="94" y="24" width="20" height="28" fill="#78350f" stroke="#2e1065" strokeWidth="3" />
          <rect x="90" y="20" width="28" height="6" fill="#451a03" />

          {/* Gabled Purple/Indigo Tile Roof */}
          <polygon points="120,38 20,96 220,96" fill="#4c1d95" stroke="#2e1065" strokeWidth="4" />
          <polygon points="120,44 32,94 208,94" fill="#6d28d9" />
          {/* Shingle Horizontal Lines */}
          <line x1="48" y1="84" x2="192" y2="84" stroke="#581c87" strokeWidth="3" />
          <line x1="68" y1="72" x2="172" y2="72" stroke="#581c87" strokeWidth="3" />
          <line x1="90" y1="58" x2="150" y2="58" stroke="#581c87" strokeWidth="3" />

          {/* Dormer Window in Attic */}
          <polygon points="170,54 150,74 190,74" fill="#581c87" stroke="#2e1065" strokeWidth="2" />
          <rect x="156" y="62" width="18" height="12" fill="#1e1b4b" />
          <rect x="158" y="64" width="14" height="8" fill="#facc15" />

          {/* Horizontal Timber Log Walls */}
          <rect x="36" y="96" width="168" height="82" fill="#92400e" stroke="#451a03" strokeWidth="4" />
          {/* Log Lines & Texture */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="38" y={100 + i * 15} width="164" height="12" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          ))}

          {/* Right Warm Glowing Window */}
          <rect x="146" y="114" width="34" height="42" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="150" y="118" width="12" height="34" fill="#facc15" />
          <rect x="164" y="118" width="12" height="34" fill="#fef08a" />
          <line x1="162" y1="118" x2="162" y2="152" stroke="#451a03" strokeWidth="2" />
          <line x1="150" y1="135" x2="176" y2="135" stroke="#451a03" strokeWidth="2" />

          {/* Cabin Heavy Wood Door */}
          <rect x="68" y="110" width="46" height="68" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="74" y="116" width="34" height="58" fill="#a16207" />
          <rect x="84" y="124" width="14" height="18" fill="#451a03" />
          <rect x="86" y="126" width="10" height="14" fill="#fef08a" />
          {/* Brass Knob */}
          <circle cx="78" cy="150" r="3" fill="#facc15" />
        </svg>
      )}

      {safeLevel === 3 && (
        /* --- TIER 3: STONE & TIMBER COUNTRY HOUSE (Ref: media_1794590294968_baf3340e.jpg) --- */
        <svg
          viewBox="0 0 240 192"
          width="100%"
          height="100%"
          className="select-none pointer-events-none"
          shapeRendering="crispEdges"
        >
          {/* Split Multi-Gabled Terracotta Tile Roof */}
          <polygon points="86,18 20,84 152,84" fill="#c2410c" stroke="#431407" strokeWidth="4" />
          <polygon points="86,24 28,82 144,82" fill="#ea580c" />
          {/* Right Extension Shingle Roof */}
          <polygon points="144,48 144,84 216,84" fill="#c2410c" stroke="#431407" strokeWidth="4" />
          <polygon points="144,54 144,82 210,82" fill="#f97316" />
          {/* Heavy Roof Ridge Beam */}
          <polygon points="86,18 80,84 92,84" fill="#78350f" stroke="#451a03" strokeWidth="2" />

          {/* Heavy Wood Post & Beam Framework */}
          <rect x="24" y="84" width="188" height="94" fill="#475569" stroke="#1e293b" strokeWidth="4" />
          {/* Cobblestone Texture Specks */}
          <rect x="28" y="88" width="180" height="86" fill="#64748b" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect
              key={i}
              x={34 + (i % 4) * 44}
              y={94 + Math.floor(i / 4) * 36}
              width="26"
              height="18"
              fill="#94a3b8"
              stroke="#475569"
              strokeWidth="2"
            />
          ))}

          {/* Timber Crossbeams & Support Columns */}
          <rect x="24" y="84" width="188" height="12" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <rect x="24" y="84" width="18" height="94" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <rect x="130" y="84" width="16" height="94" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <rect x="194" y="84" width="18" height="94" fill="#78350f" stroke="#451a03" strokeWidth="2" />

          {/* Right Mullion Window with Blue Glass */}
          <rect x="148" y="112" width="38" height="42" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="152" y="116" width="30" height="34" fill="#38bdf8" />
          <line x1="167" y1="116" x2="167" y2="150" stroke="#451a03" strokeWidth="2" />
          <line x1="152" y1="133" x2="182" y2="133" stroke="#451a03" strokeWidth="2" />

          {/* Sturdy Wood Plank Door */}
          <rect x="58" y="108" width="52" height="70" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="64" y="114" width="40" height="60" fill="#92400e" />
          {/* Iron Door Hinges */}
          <rect x="62" y="124" width="12" height="4" fill="#1e293b" />
          <rect x="62" y="154" width="12" height="4" fill="#1e293b" />
          <circle cx="98" cy="144" r="3" fill="#1e293b" />
        </svg>
      )}

      {safeLevel === 4 && (
        /* --- TIER 4: GRAND 2-STORY VICTORIAN MANOR / VILLA (Ref: media_1794590294960_05215ced.jpg) --- */
        <svg
          viewBox="0 0 240 192"
          width="100%"
          height="100%"
          className="select-none pointer-events-none"
          shapeRendering="crispEdges"
        >
          {/* Left Brick Chimney */}
          <rect x="52" y="14" width="22" height="52" fill="#991b1b" stroke="#450a0a" strokeWidth="3" />
          <rect x="48" y="10" width="30" height="6" fill="#7f1d1d" />

          {/* Grand Slate Gabled Roof */}
          <polygon points="106,16 12,88 200,88" fill="#475569" stroke="#1e293b" strokeWidth="4" />
          <polygon points="106,22 22,86 190,86" fill="#64748b" />
          <polygon points="190,46 190,88 234,88" fill="#475569" stroke="#1e293b" strokeWidth="4" />
          <polygon points="190,52 190,86 228,86" fill="#64748b" />

          {/* Second Floor Attic Gable & Window with Flower Planters */}
          <polygon points="106,26 80,60 132,60" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
          <rect x="88" y="44" width="36" height="26" fill="#7dd3fc" stroke="#78350f" strokeWidth="2" />
          <line x1="106" y1="44" x2="106" y2="70" stroke="#78350f" strokeWidth="1.5" />
          {/* Attic Window Flower Box */}
          <rect x="84" y="66" width="44" height="8" fill="#15803d" />
          <circle cx="90" cy="65" r="3" fill="#f43f5e" />
          <circle cx="100" cy="64" r="3" fill="#facc15" />
          <circle cx="110" cy="65" r="3" fill="#ec4899" />
          <circle cx="120" cy="64" r="3" fill="#f43f5e" />

          {/* Warm Beige Siding Walls */}
          <rect x="30" y="88" width="180" height="86" fill="#fef3c7" stroke="#78350f" strokeWidth="3" />
          {/* Siding horizontal board lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1="32" y1={88 + i * 14} x2="208" y2={88 + i * 14} stroke="#fde68a" strokeWidth="1" />
          ))}

          {/* Left Large 4-Pane Bay Window */}
          <rect x="44" y="98" width="56" height="42" fill="#7dd3fc" stroke="#78350f" strokeWidth="3" />
          <line x1="72" y1="98" x2="72" y2="140" stroke="#78350f" strokeWidth="2" />
          <line x1="44" y1="118" x2="100" y2="118" stroke="#78350f" strokeWidth="2" />
          {/* Overflowing Red Rose Flower Planter Box */}
          <rect x="40" y="138" width="64" height="12" fill="#15803d" rx="2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={46 + i * 12} cy="137" r="4" fill="#e11d48" />
          ))}

          {/* Right Multi-Pane Window with Planter */}
          <rect x="154" y="100" width="38" height="40" fill="#7dd3fc" stroke="#78350f" strokeWidth="3" />
          <line x1="173" y1="100" x2="173" y2="140" stroke="#78350f" strokeWidth="2" />
          <line x1="154" y1="120" x2="192" y2="120" stroke="#78350f" strokeWidth="2" />
          <rect x="150" y="138" width="46" height="12" fill="#15803d" rx="2" />
          <circle cx="158" cy="137" r="4" fill="#e11d48" />
          <circle cx="172" cy="137" r="4" fill="#facc15" />
          <circle cx="186" cy="137" r="4" fill="#e11d48" />

          {/* Elegant Front Porch & Dark Wood Door */}
          <polygon points="126,88 108,110 144,110" fill="#fef3c7" stroke="#78350f" strokeWidth="2" />
          <rect x="112" y="110" width="30" height="56" fill="#451a03" stroke="#1e293b" strokeWidth="3" />
          <rect x="116" y="114" width="22" height="24" fill="#7dd3fc" />
          <line x1="127" y1="114" x2="127" y2="138" stroke="#451a03" strokeWidth="1.5" />
          {/* Gold Handle */}
          <circle cx="137" cy="142" r="3" fill="#facc15" />

          {/* Exterior Porch Lamps */}
          <rect x="104" y="114" width="4" height="8" fill="#1e293b" />
          <circle cx="106" cy="118" r="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
          <rect x="146" y="114" width="4" height="8" fill="#1e293b" />
          <circle cx="148" cy="118" r="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

          {/* Stone Entrance Staircase Steps */}
          <rect x="102" y="166" width="50" height="8" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
          <rect x="96" y="174" width="62" height="8" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
        </svg>
      )}

      {/* ================= FLOATING NAMEPLATE & UPGRADE BUTTON ================= */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30 select-none">
        <div className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide shadow-md flex items-center gap-1.5 border whitespace-nowrap bg-slate-950/90 text-amber-200 border-amber-500/70 backdrop-blur-xs">
          <span>🏡</span>
          <span className="truncate max-w-[110px]">{ownerName}</span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] px-1 py-0.2 rounded font-mono">
            {getLevelLabel(safeLevel)}
          </span>
          {isSelf && (
            <span className="bg-emerald-500 text-white text-[9px] px-1 py-0.2 rounded font-bold">
              我的家
            </span>
          )}
        </div>

        {/* Quick Upgrade Button on local player's house */}
        {isSelf && safeLevel < 4 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpgradeClick?.();
            }}
            className="px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 border bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 pointer-events-auto cursor-pointer animate-bounce"
            title="花費金幣升級房屋！"
          >
            <span>🔨</span>
            <span>升級</span>
          </button>
        )}
      </div>
    </div>
  );
};
