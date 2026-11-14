import React, { useMemo } from 'react';
import {
  ISLAND_WIDTH,
  ISLAND_HEIGHT,
  TILE_SIZE,
  BUILDINGS,
  ActiveHouse,
  getActiveHouses,
} from '../config/mapData';
import { IslandPresence, Item, UserProfile } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { CozyCottageBuilding } from './scenery/CozyCottageBuilding';
import { Gamepad2, ShoppingBag, Dices } from 'lucide-react';

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
  mapBgUrl = '/island_map_bg.jpg',
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
            {/* Glowing Entrance Mat Portal */}
            <div
              className={`w-full h-full rounded-full animate-pulse-glow flex items-center justify-center border transition-all ${
                b.type === 'casino'
                  ? 'bg-amber-400/40 hover:bg-amber-400/60 border-amber-300 shadow-amber-500/50'
                  : b.type === 'arcade'
                  ? 'bg-cyan-400/40 hover:bg-cyan-400/60 border-cyan-300 shadow-cyan-500/50'
                  : 'bg-pink-400/40 hover:bg-pink-400/60 border-pink-300 shadow-pink-500/50'
              } shadow-lg`}
            >
              {b.type === 'casino' && <Dices className="w-5 h-5 text-amber-200" />}
              {b.type === 'arcade' && <Gamepad2 className="w-5 h-5 text-cyan-200" />}
              {b.type === 'boutique' && <ShoppingBag className="w-5 h-5 text-pink-200" />}
            </div>

            {/* Hover Tooltip Capsule */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-slate-950/90 text-[11px] font-bold text-white border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {b.name}
            </div>
          </div>
        ))}

        {/* ================= 3. MULTIPLAYER RESIDENT HOUSES ================= */}
        {activeHouses.map((house) => (
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
            <CozyCottageBuilding
              width={house.width * TILE_SIZE}
              height={house.height * TILE_SIZE}
              level={house.level || 1}
              ownerName={house.ownerName}
              isSelf={house.isSelf}
              onUpgradeClick={onOpenUpgrade}
            />

            {/* Interactive Doorstep Mat */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onEnterHouse?.(house);
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-emerald-400/70 hover:bg-emerald-300 rounded-full animate-pulse cursor-pointer pointer-events-auto flex items-center justify-center group shadow-md"
              title={`點擊進入 ${house.ownerName} 的家`}
            >
              <span className="text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                進入
              </span>
            </div>
          </div>
        ))}

        {/* ================= 4. LOCAL PLAYER SPRITE ================= */}
        <div
          className="absolute z-30 pointer-events-none will-change-transform"
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

        {/* ================= 5. REMOTE PLAYERS ================= */}
        {remotePlayers.map((player) => (
          <div
            key={player.uid}
            onClick={(e) => {
              e.stopPropagation();
              onPlayerClick?.(player);
            }}
            className="absolute z-30 transition-[left,top] duration-150 linear will-change-transform cursor-pointer"
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
        ))}
      </div>
    </div>
  );
};
