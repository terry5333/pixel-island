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

            {/* Hover Tooltip Japanese Wooden Plaque */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-xl bg-[#201109]/95 text-[11px] font-black text-[#fef08a] border-2 border-[#b45309] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-serif tracking-wider">
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
              {/* Japanese Showa Wood Plaque House Owner Badge floating over roof */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-[#201109]/95 backdrop-blur-md rounded-full border-2 border-[#b45309] shadow-2xl text-[11px] whitespace-nowrap pointer-events-auto font-serif tracking-wider">
                <span className="font-bold text-[#fef08a] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  {house.ownerName} 之宅
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#991b1b]/80 border border-[#f59e0b] text-[#fef08a] font-mono text-[9px] font-bold">
                  Lv.{house.level || 1}
                </span>
                {house.isSelf && onOpenUpgrade && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUpgrade();
                    }}
                    className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-full text-[9px] cursor-pointer shadow-sm active:scale-95 transition-transform"
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
                className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#b45309]/90 hover:bg-[#d97706] text-[#fef08a] font-serif font-black text-[10px] rounded-full animate-pulse cursor-pointer pointer-events-auto flex items-center justify-center gap-1 shadow-lg border-2 border-[#fef08a]"
                title={`進入 ${house.ownerName} 的玄關`}
              >
                進入玄關 🚪
              </div>
            </div>
          );
        })}

        {/* ================= 4. LOCAL PLAYER SPRITE (WITH OCCLUSION DEPTH) ================= */}
        {(() => {
          const isLocalBehind = isPlayerBehindObstacle(selfX, selfY);
          return (
            <div
              className={`absolute z-30 pointer-events-none will-change-transform transition-all duration-150 ${
                isLocalBehind
                  ? 'opacity-70 contrast-125 brightness-110 drop-shadow-[0_0_12px_rgba(254,240,138,0.95)]'
                  : ''
              }`}
              style={{
                left: selfX * TILE_SIZE + (TILE_SIZE - 64) / 2,
                top: selfY * TILE_SIZE + (TILE_SIZE - 64) / 2 - 8,
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
          );
        })()}

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
              className={`absolute z-30 transition-[left,top] duration-150 linear will-change-transform cursor-pointer ${
                isRemoteBehind
                  ? 'opacity-70 contrast-125 brightness-110 drop-shadow-[0_0_12px_rgba(254,240,138,0.95)]'
                  : ''
              }`}
              style={{
                left: player.x * TILE_SIZE + (TILE_SIZE - 64) / 2,
                top: player.y * TILE_SIZE + (TILE_SIZE - 64) / 2 - 8,
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
