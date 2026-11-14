import React, { useMemo } from 'react';
import {
  ISLAND_WIDTH,
  ISLAND_HEIGHT,
  TILE_SIZE,
  BUILDINGS,
  ActiveHouse,
  getActiveHouses,
  isPlayerBehindObstacle,
} from '../config/mapData';
import { IslandPresence, Item, UserProfile } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { Gamepad2, ShoppingBag, Dices, Home } from 'lucide-react';

interface IslandMapProps {
  currentUid: string;
  localPos: { x: number; y: number; facing: 'left' | 'right'; isMoving: boolean };
  currentUser?: UserProfile | null;
  presences: Record<string, IslandPresence>;
  itemsMap: Record<string, Item>;
  activeHouses?: ActiveHouse[];
  mapBgUrl?: string;
  onTileClick?: (x: number, y: number) => void;
  onPlayerClick?: (player: IslandPresence) => void;
  onEnterHouse?: (house: ActiveHouse) => void;
  onOpenUpgrade?: () => void;
  onBuildingClick?: (type: 'arcade' | 'casino' | 'boutique') => void;
}

export const IslandMap: React.FC<IslandMapProps> = ({
  currentUid,
  localPos,
  currentUser,
  presences,
  itemsMap,
  activeHouses: propHouses,
  mapBgUrl = '/island_map_showa.jpg',
  onTileClick,
  onPlayerClick,
  onEnterHouse,
  onOpenUpgrade,
  onBuildingClick,
}) => {
  const selfPresence = presences[currentUid];
  const selfX = localPos.x;
  const selfY = localPos.y;
  const isLocalBehind = isPlayerBehindObstacle(selfX, selfY);

  // Active houses populated for community and players
  const activeHouses = useMemo(() => {
    if (propHouses && propHouses.length > 0) return propHouses;
    return getActiveHouses(
      currentUid,
      currentUser?.displayName || selfPresence?.displayName || '冒險家',
      currentUser?.houseLevel || 1,
      presences
    );
  }, [propHouses, currentUid, currentUser?.displayName, currentUser?.houseLevel, selfPresence?.displayName, presences]);

  // Smooth sub-pixel camera follow locked to player center
  const cameraX = -(selfX * TILE_SIZE + TILE_SIZE / 2);
  const cameraY = -(selfY * TILE_SIZE + TILE_SIZE / 2);

  // Remote players on the island
  const remotePlayers = Object.values(presences).filter(
    (p) => p.uid !== currentUid && (!p.currentPlace || p.currentPlace === 'island')
  );

  const localEquipped = selfPresence?.equipped || currentUser?.equipped || {
    hair: 'hair_brown',
    top: 'top_casual',
    bottom: 'bottom_denim',
    accessory: null,
  };
  const localDisplayName = selfPresence?.displayName || currentUser?.displayName || '冒險家';
  const localEmojiBubble = selfPresence?.emojiBubble ?? null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#071329] select-none">
      {/* Dynamic Camera World Container */}
      <div
        className="absolute top-1/2 left-1/2 will-change-transform"
        style={{
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)`,
          width: ISLAND_WIDTH * TILE_SIZE,
          height: ISLAND_HEIGHT * TILE_SIZE,
        }}
        onClick={(e) => {
          // Calculate tile click coordinates relative to world map
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = (e.clientX - rect.left) / TILE_SIZE;
          const clickY = (e.clientY - rect.top) / TILE_SIZE;
          onTileClick?.(clickX, clickY);
        }}
      >
        {/* ================= 1. HIGH-RESOLUTION PIXEL-ART BACKGROUND MAP ================= */}
        <img
          src={mapBgUrl}
          alt="Island Map Background"
          className="absolute top-0 left-0 pointer-events-none select-none max-w-none"
          style={{
            width: ISLAND_WIDTH * TILE_SIZE,
            height: ISLAND_HEIGHT * TILE_SIZE,
            imageRendering: 'pixelated',
          }}
          draggable={false}
        />

        {/* ================= 2. INTERACTIVE BUILDING ENTRANCES & MATS ================= */}
        {BUILDINGS.map((b) => (
          <div
            key={b.id}
            onClick={(e) => {
              e.stopPropagation();
              onBuildingClick?.(b.type as any);
            }}
            className="absolute z-20 cursor-pointer pointer-events-auto group"
            style={{
              left: (b.doorX - 1.2) * TILE_SIZE,
              top: (b.doorY - 0.8) * TILE_SIZE,
              width: 2.4 * TILE_SIZE,
              height: 1.6 * TILE_SIZE,
            }}
            title={b.prompt}
          >
            {/* Japanese Entrance Mat / Stepping Stone Portal */}
            <div
              className={`w-full h-full rounded-2xl animate-pulse-glow flex items-center justify-center border-2 transition-all ${
                b.type === 'casino'
                  ? 'bg-[#b45309]/80 hover:bg-[#d97706] border-[#fef08a] shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                  : b.type === 'arcade'
                  ? 'bg-[#991b1b]/80 hover:bg-[#b91c1c] border-[#fde047] shadow-[0_0_15px_rgba(220,38,38,0.8)]'
                  : 'bg-[#1e1b4b]/85 hover:bg-[#312e81] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.8)]'
              } shadow-xl`}
            >
              {b.type === 'casino' && <Dices className="w-5 h-5 text-[#fef08a]" />}
              {b.type === 'arcade' && <Gamepad2 className="w-5 h-5 text-[#fde047]" />}
              {b.type === 'boutique' && <ShoppingBag className="w-5 h-5 text-[#38bdf8]" />}
            </div>

            {/* Hover Tooltip Clean Light Plaque */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-xl bg-white/95 text-[11px] font-bold text-slate-800 border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-sans tracking-wide">
              {b.name}
            </div>
          </div>
        ))}

        {/* ================= 3. MULTIPLAYER RESIDENT HOUSES ================= */}
        {activeHouses.map((house) => {
          // Requirement 5: Unclaimed houses MUST NOT display any text or floating badge
          if (!house.isClaimed) {
            return null;
          }

          return (
            <div
              key={house.plotId}
              className="absolute z-20 pointer-events-auto"
              style={{
                left: house.x * TILE_SIZE,
                top: house.y * TILE_SIZE,
                width: house.width * TILE_SIZE,
                height: house.height * TILE_SIZE,
              }}
            >
              {/* Clean Light Modern House Owner Badge floating over roof */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-lg text-[11px] whitespace-nowrap pointer-events-auto font-sans tracking-wide">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-indigo-600" />
                  {house.ownerName} 之宅
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[9px] font-bold">
                  Lv.{house.level || 1}
                </span>
                {house.isSelf && onOpenUpgrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUpgrade();
                    }}
                    className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-[9px] cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    升級
                  </button>
                )}
              </div>

              {/* Interactive Japanese Doorstep Mat */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterHouse?.(house);
                }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/95 hover:bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-full animate-bounce-gentle cursor-pointer pointer-events-auto flex items-center justify-center gap-1 shadow-md border border-indigo-200"
                title={`進入 ${house.ownerName} 的玄關`}
              >
                進入玄關 🚪
              </div>
            </div>
          );
        })}

        {/* ================= 4. LOCAL PLAYER SPRITE (SMOOTH 60FPS WITH OCCLUSION DEPTH) ================= */}
        <div
          className={`absolute top-0 left-0 z-30 pointer-events-none will-change-transform ${
            isLocalBehind
              ? 'opacity-75 contrast-125 brightness-110 drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]'
              : ''
          }`}
          style={{
            transform: `translate3d(${selfX * TILE_SIZE + (TILE_SIZE - 64) / 2}px, ${selfY * TILE_SIZE + (TILE_SIZE - 64) / 2 - 8}px, 0)`,
          }}
        >
          <CharacterSprite
            displayName={localDisplayName}
            facing={localPos.facing}
            equipped={localEquipped}
            itemsMap={itemsMap}
            isMoving={localPos.isMoving}
            emojiBubble={localEmojiBubble}
            isSelf={true}
            size={56}
          />
        </div>

        {/* ================= 5. REMOTE PLAYERS (WITH OCCLUSION DEPTH) ================= */}
        {remotePlayers.map((player) => {
          const isRemoteBehind = isPlayerBehindObstacle(player.x, player.y);
          return (
            <div
              key={player.uid}
              onClick={(e) => {
                e.stopPropagation();
                onPlayerClick?.(player);
              }}
              className={`absolute top-0 left-0 z-30 transition-transform duration-150 linear will-change-transform cursor-pointer ${
                isRemoteBehind
                  ? 'opacity-75 contrast-125 brightness-110 drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]'
                  : ''
              }`}
              style={{
                transform: `translate3d(${player.x * TILE_SIZE + (TILE_SIZE - 64) / 2}px, ${player.y * TILE_SIZE + (TILE_SIZE - 64) / 2 - 8}px, 0)`,
              }}
            >
              <CharacterSprite
                displayName={player.displayName}
                facing={player.facing}
                equipped={player.equipped}
                itemsMap={itemsMap}
                isMoving={player.isMoving}
                emojiBubble={player.emojiBubble}
                isSelf={false}
                size={56}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
