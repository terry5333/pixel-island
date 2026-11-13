import React, { useState, useMemo } from 'react';
import {
  HOME_WIDTH,
  HOME_HEIGHT,
  TILE_SIZE,
  getHomeTile,
} from '../config/mapData';
import { RoomFurniture, Item, IslandPresence, UserProfile } from '../types/game';
import { PixelAsset } from './PixelAsset';
import { CharacterSprite } from './CharacterSprite';
import { sound } from '../services/audio';
import { RotateCw, Trash2, Check, Hammer, DoorOpen, Box, Layers, Sparkles, Sun, Moon } from 'lucide-react';

interface HomeMapProps {
  hostUser: UserProfile;
  currentUid: string;
  presences: Record<string, IslandPresence>;
  itemsMap: Record<string, Item>;
  onSaveLayout: (newLayout: RoomFurniture[]) => Promise<void>;
  onExitHome: () => void;
  onTileClick?: (x: number, y: number) => void;
}

// Isometric Projection Math (Classic 2:1 Dimetric Diamond Grid)
const ISO_TILE_W = 54;
const ISO_TILE_H = 27;
const ROOM_SIZE = 8; // 8x8 usable interior area for optimal 3D isometric view

function toIso(x: number, y: number, originX: number, originY: number) {
  const isoX = originX + (x - y) * (ISO_TILE_W / 2);
  const isoY = originY + (x + y) * (ISO_TILE_H / 2);
  const depthZ = (x + y) * 10;
  return { isoX, isoY, depthZ };
}

export const HomeMap: React.FC<HomeMapProps> = ({
  hostUser,
  currentUid,
  presences,
  itemsMap,
  onSaveLayout,
  onExitHome,
  onTileClick,
}) => {
  const isOwner = hostUser.uid === currentUid;
  const [is3DMode, setIs3DMode] = useState(true);
  const [isDecorating, setIsDecorating] = useState(false);
  const [layout, setLayout] = useState<RoomFurniture[]>(hostUser.roomLayout || []);
  const [selectedFurnitureItemId, setSelectedFurnitureItemId] = useState<string | null>(null);
  const [selectedPlacedInstanceId, setSelectedPlacedInstanceId] = useState<string | null>(null);
  const [hoveredIsoCell, setHoveredIsoCell] = useState<{ x: number; y: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selfPresence = presences[currentUid];
  // Clamped room coordinates (0..ROOM_SIZE - 1)
  const selfX = Math.min(Math.max((selfPresence?.x ?? 4) % ROOM_SIZE, 0), ROOM_SIZE - 1);
  const selfY = Math.min(Math.max((selfPresence?.y ?? 5) % ROOM_SIZE, 0), ROOM_SIZE - 1);

  // Filter owned furniture
  const ownedFurnitureItems = hostUser.inventory
    .map((id) => itemsMap[id])
    .filter((it): it is Item => !!it && it.category === 'furniture');

  // Center coordinate offsets for 3D Isometric Room
  const originX = 380;
  const originY = 160;

  // Handle cell click in 3D Isometric View
  const handleIsoCellClick = (x: number, y: number) => {
    if (!isDecorating) {
      onTileClick?.(x, y);
      return;
    }

    // Doorway entrance cell (7, 4) is exit mat
    if (x === ROOM_SIZE - 1 && y === Math.floor(ROOM_SIZE / 2)) return;

    const existing = layout.find((f) => (f.x % ROOM_SIZE) === x && (f.y % ROOM_SIZE) === y);
    if (existing) {
      setSelectedPlacedInstanceId(existing.instanceId);
      sound.playClick();
      return;
    }

    if (selectedFurnitureItemId) {
      const newPiece: RoomFurniture = {
        instanceId: 'furn_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        itemId: selectedFurnitureItemId,
        x,
        y,
        rotation: 0,
      };
      setLayout([...layout, newPiece]);
      sound.playBuy();
      setSelectedPlacedInstanceId(newPiece.instanceId);
    }
  };

  const handleRotate = (instanceId: string) => {
    setLayout(
      layout.map((item) => {
        if (item.instanceId === instanceId) {
          const nextRotation = ((item.rotation + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...item, rotation: nextRotation };
        }
        return item;
      })
    );
    sound.playClick();
  };

  const handleRemove = (instanceId: string) => {
    setLayout(layout.filter((item) => item.instanceId !== instanceId));
    if (selectedPlacedInstanceId === instanceId) {
      setSelectedPlacedInstanceId(null);
    }
    sound.playBump();
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveLayout(layout);
    setIsSaving(false);
    setIsDecorating(false);
    setSelectedPlacedInstanceId(null);
    sound.playWin();
  };

  // Players visiting this room
  const roomVisitors = Object.values(presences).filter(
    (p) =>
      p.currentPlace === 'home' &&
      (p.visitingHomeUid === hostUser.uid || (!p.visitingHomeUid && p.uid === hostUser.uid))
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d1322] select-none flex flex-col items-center justify-center">
      {/* ================= TOP ROOM CONTROL CAPSULE ================= */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2">
        <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-pixel-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-lg">
            🏡
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>{hostUser.displayName} 的 3D 小屋</span>
              {isOwner && (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  房主
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-400">
              {roomVisitors.length} 位訪客在房內 · {is3DMode ? '3D 等角透視' : '2D 俯視模式'}
            </p>
          </div>
        </div>

        {/* 3D / 2D Toggle Button */}
        <button
          onClick={() => {
            sound.playClick();
            setIs3DMode(!is3DMode);
          }}
          className="pixel-btn px-3 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-500 rounded-xl text-xs font-bold shadow-pixel flex items-center gap-1.5"
        >
          <Box className="w-3.5 h-3.5 text-indigo-300" />
          <span>{is3DMode ? '3D 視角 (已啟用)' : '切換 3D 視角'}</span>
        </button>
      </div>

      {/* Top Right Exit & Decorate Toolbar */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {isOwner && (
          <button
            onClick={() => {
              sound.playClick();
              setIsDecorating(!isDecorating);
            }}
            className={`pixel-btn px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-pixel ${
              isDecorating
                ? 'bg-amber-400 text-slate-950 border-amber-500 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>{isDecorating ? '正在佈置中...' : '🔨 佈置房間'}</span>
          </button>
        )}

        <button
          onClick={() => {
            sound.playDoor();
            onExitHome();
          }}
          className="pixel-btn px-3 py-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold border border-rose-500 shadow-pixel flex items-center gap-1.5"
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>離開房間</span>
        </button>
      </div>

      {/* ================= 3D ISOMETRIC ROOM VIEWPORT ================= */}
      {is3DMode ? (
        <div className="relative w-full h-full flex items-center justify-center overflow-auto">
          {/* 3D Isometric Room Stage */}
          <div
            className="relative will-change-transform"
            style={{
              width: 760,
              height: 520,
              margin: 'auto',
            }}
          >
            {/* Ambient Room Light Aura */}
            <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none rounded-full" />

            {/* 1. Back-Left Isometric Wall (Runs along x=0, y=0..7) */}
            <svg
              className="absolute pointer-events-none"
              style={{
                left: originX - (ROOM_SIZE * ISO_TILE_W) / 2,
                top: originY - 140,
                width: (ROOM_SIZE * ISO_TILE_W) / 2,
                height: 140 + (ROOM_SIZE * ISO_TILE_H) / 2,
                zIndex: 5,
              }}
              viewBox={`0 0 ${(ROOM_SIZE * ISO_TILE_W) / 2} ${140 + (ROOM_SIZE * ISO_TILE_H) / 2}`}
            >
              {/* Wall Surface */}
              <polygon
                points={`0,140 ${(ROOM_SIZE * ISO_TILE_W) / 2},${140 + (ROOM_SIZE * ISO_TILE_H) / 2} ${(ROOM_SIZE * ISO_TILE_W) / 2},${(ROOM_SIZE * ISO_TILE_H) / 2} 0,0`}
                fill="#475569"
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Wallpaper stripes */}
              <polygon
                points={`10,135 70,175 70,35 10,0`}
                fill="#3b82f6"
                opacity="0.1"
              />
              {/* 3D Window with morning sky & warm light */}
              <g transform="translate(60, 45) skewY(26.5) scale(0.9)">
                <rect x="0" y="0" width="55" height="45" fill="#38bdf8" stroke="#1e293b" strokeWidth="3" rx="2" />
                <rect x="2" y="2" width="23" height="19" fill="#7dd3fc" />
                <rect x="29" y="2" width="23" height="19" fill="#7dd3fc" />
                <rect x="2" y="24" width="23" height="19" fill="#bae6fd" />
                <rect x="29" y="24" width="23" height="19" fill="#bae6fd" />
                {/* Sunlight beam onto floor */}
                <polygon points="0,45 55,45 90,120 20,120" fill="#fef08a" opacity="0.12" />
              </g>
            </svg>

            {/* 2. Back-Right Isometric Wall (Runs along y=0, x=0..7) */}
            <svg
              className="absolute pointer-events-none"
              style={{
                left: originX,
                top: originY - 140,
                width: (ROOM_SIZE * ISO_TILE_W) / 2,
                height: 140 + (ROOM_SIZE * ISO_TILE_H) / 2,
                zIndex: 5,
              }}
              viewBox={`0 0 ${(ROOM_SIZE * ISO_TILE_W) / 2} ${140 + (ROOM_SIZE * ISO_TILE_H) / 2}`}
            >
              {/* Wall Surface */}
              <polygon
                points={`0,${140 + (ROOM_SIZE * ISO_TILE_H) / 2} ${(ROOM_SIZE * ISO_TILE_W) / 2},140 ${(ROOM_SIZE * ISO_TILE_W) / 2},0 0,${(ROOM_SIZE * ISO_TILE_H) / 2}`}
                fill="#334155"
                stroke="#1e293b"
                strokeWidth="2"
              />
              {/* Wall Poster / Hanging Pixel Clock */}
              <g transform="translate(50, 45) skewY(-26.5) scale(0.9)">
                <circle cx="20" cy="20" r="14" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
                <line x1="20" y1="20" x2="20" y2="12" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="20" x2="26" y2="20" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            </svg>

            {/* 3. 3D Isometric Diamond Floor Tiles (8x8 Grid) */}
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ zIndex: 10 }}
            >
              {Array.from({ length: ROOM_SIZE * ROOM_SIZE }).map((_, idx) => {
                const x = idx % ROOM_SIZE;
                const y = Math.floor(idx / ROOM_SIZE);
                const { isoX, isoY } = toIso(x, y, originX, originY);
                const isHovered = hoveredIsoCell?.x === x && hoveredIsoCell?.y === y;
                const isExitCell = x === ROOM_SIZE - 1 && y === Math.floor(ROOM_SIZE / 2);

                // 4 Diamond vertices
                const pTop = `${isoX},${isoY}`;
                const pRight = `${isoX + ISO_TILE_W / 2},${isoY + ISO_TILE_H / 2}`;
                const pBottom = `${isoX},${isoY + ISO_TILE_H}`;
                const pLeft = `${isoX - ISO_TILE_W / 2},${isoY + ISO_TILE_H / 2}`;
                const points = `${pTop} ${pRight} ${pBottom} ${pLeft}`;

                // Parquet wood tile color pattern
                const isEven = (x + y) % 2 === 0;
                const baseFill = isExitCell
                  ? '#0284c7'
                  : isEven
                  ? '#9a3412'
                  : '#7c2d12';

                return (
                  <polygon
                    key={`tile_${x}_${y}`}
                    points={points}
                    fill={isHovered && isDecorating ? '#38bdf8' : baseFill}
                    stroke="#451a03"
                    strokeWidth="1"
                    className={isDecorating ? 'cursor-pointer transition-colors duration-100' : 'cursor-pointer'}
                    onMouseEnter={() => setHoveredIsoCell({ x, y })}
                    onMouseLeave={() => setHoveredIsoCell(null)}
                    onClick={() => handleIsoCellClick(x, y)}
                  />
                );
              })}
            </svg>

            {/* 4. Placed 3D Furniture Items (Sorted by Depth Z) */}
            {layout
              .slice()
              .sort((a, b) => {
                const zA = (a.x % ROOM_SIZE) + (a.y % ROOM_SIZE);
                const zB = (b.x % ROOM_SIZE) + (b.y % ROOM_SIZE);
                return zA - zB;
              })
              .map((furn) => {
                const fx = furn.x % ROOM_SIZE;
                const fy = furn.y % ROOM_SIZE;
                const { isoX, isoY, depthZ } = toIso(fx, fy, originX, originY);
                const item = itemsMap[furn.itemId];
                const isSelected = selectedPlacedInstanceId === furn.instanceId;

                return (
                  <div
                    key={furn.instanceId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDecorating) setSelectedPlacedInstanceId(furn.instanceId);
                    }}
                    className={`absolute select-none transition-transform will-change-transform ${
                      isDecorating ? 'cursor-pointer' : 'pointer-events-none'
                    } ${isSelected ? 'ring-2 ring-cyan-400 rounded-lg animate-pulse' : ''}`}
                    style={{
                      left: isoX - 32,
                      top: isoY - 42,
                      width: 64,
                      height: 64,
                      zIndex: depthZ + 15,
                    }}
                  >
                    {/* Render 3D Isometric Furniture */}
                    <Render3DFurniture
                      item={item}
                      rotation={furn.rotation}
                    />

                    {/* Floor Shadow beneath furniture */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/40 rounded-full blur-[1px] -z-10" />
                  </div>
                );
              })}

            {/* 5. 3D Isometric Character Sprites */}
            {roomVisitors.map((player) => {
              const px = player.uid === currentUid ? selfX : Math.min(Math.max((player.x ?? 4) % ROOM_SIZE, 0), ROOM_SIZE - 1);
              const py = player.uid === currentUid ? selfY : Math.min(Math.max((player.y ?? 5) % ROOM_SIZE, 0), ROOM_SIZE - 1);
              const { isoX, isoY, depthZ } = toIso(px, py, originX, originY);
              const isMe = player.uid === currentUid;

              return (
                <div
                  key={player.uid}
                  className="absolute pointer-events-none transition-all duration-130 linear will-change-transform"
                  style={{
                    left: isoX - 32,
                    top: isoY - 56,
                    zIndex: depthZ + 20,
                  }}
                >
                  <CharacterSprite
                    displayName={player.displayName}
                    facing={player.facing || 'right'}
                    equipped={player.equipped}
                    itemsMap={itemsMap}
                    isMoving={player.isMoving}
                    emojiBubble={player.emojiBubble}
                    isSelf={isMe}
                    size={64}
                  />

                  {/* Soft 3D drop shadow beneath character */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-black/45 rounded-full blur-[1px] -z-10" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="relative p-6 bg-slate-900 border-4 border-slate-800 rounded-2xl shadow-pixel-lg">
          {/* 2D Classic Top-Down Fallback View */}
          <div
            className="grid grid-cols-8 gap-1 bg-[#451a03] p-2 border-2 border-[#7c2d12] rounded-xl"
            style={{ width: 8 * 48, height: 8 * 48 }}
          >
            {Array.from({ length: 64 }).map((_, idx) => {
              const x = idx % 8;
              const y = Math.floor(idx / 8);
              return (
                <div
                  key={`2d_${x}_${y}`}
                  onClick={() => handleIsoCellClick(x, y)}
                  className="w-11 h-11 bg-[#78350f] hover:bg-[#9a3412] border border-[#451a03] rounded flex items-center justify-center cursor-pointer text-xs"
                >
                  {(x + y) % 2 === 0 && <span className="opacity-20 text-white">·</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 3D DECORATING CONTROLS DOCK ================= */}
      {isDecorating && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-slide-up">
          <div className="bg-slate-950/95 backdrop-blur-md border-2 border-amber-400/80 rounded-2xl p-3 shadow-pixel-lg flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D 房間佈置模式：點擊地板擺放家具</span>
              </span>

              <div className="flex items-center gap-2">
                {selectedPlacedInstanceId && (
                  <>
                    <button
                      onClick={() => handleRotate(selectedPlacedInstanceId)}
                      className="pixel-btn px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs rounded-lg border border-slate-600 flex items-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> 旋轉 90°
                    </button>
                    <button
                      onClick={() => handleRemove(selectedPlacedInstanceId)}
                      className="pixel-btn px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs rounded-lg border border-rose-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 移除
                    </button>
                  </>
                )}

                <button
                  disabled={isSaving}
                  onClick={handleSave}
                  className="pixel-btn px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg border border-emerald-600 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? '儲存中...' : '儲存 3D 佈局'}</span>
                </button>
              </div>
            </div>

            {/* Owned Furniture Selector */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {ownedFurnitureItems.map((item) => {
                const isSelected = selectedFurnitureItemId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedFurnitureItemId(item.id);
                    }}
                    className={`flex-shrink-0 p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 shadow-pixel'
                        : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <PixelAsset category="furniture" item={item} width={36} height={36} />
                    </div>
                    <span className="text-[10px] text-slate-300 max-w-[64px] truncate">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3D Isometric Furniture Renderer
function Render3DFurniture({ item, rotation }: { item?: Item; rotation: number }) {
  if (!item) return null;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
      }}
    >
      <PixelAsset category="furniture" item={item} width={54} height={54} />
    </div>
  );
}

export default HomeMap;