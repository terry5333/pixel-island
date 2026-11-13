import React, { useMemo } from 'react';
import {
  ISLAND_WIDTH,
  ISLAND_HEIGHT,
  TILE_SIZE,
  getIslandTile,
  TOWN_SCENERY,
} from '../config/mapData';
import { IslandPresence, Item, UserProfile } from '../types/game';
import { CharacterSprite } from './CharacterSprite';
import { GrandArcadeComplex } from './scenery/GrandArcadeComplex';
import { BoutiqueBuilding } from './scenery/BoutiqueBuilding';
import { CozyCottageBuilding } from './scenery/CozyCottageBuilding';
import {
  UtilityPole,
  RetroBillboard,
  ParkedMiniCar,
  VendingMachine,
  StreetLamp,
  FloweringHedge,
  ManholeCover,
} from './scenery/StreetFurniture';
import { PixelAsset } from './PixelAsset';

interface IslandMapProps {
  currentUid: string;
  localPos: { x: number; y: number; facing: 'left' | 'right'; isMoving: boolean };
  currentUser?: UserProfile | null;
  presences: Record<string, IslandPresence>;
  itemsMap: Record<string, Item>;
  onTileClick?: (x: number, y: number) => void;
  onPlayerClick?: (player: IslandPresence) => void;
}

export const IslandMap: React.FC<IslandMapProps> = ({
  currentUid,
  localPos,
  currentUser,
  presences,
  itemsMap,
  onTileClick,
  onPlayerClick,
}) => {
  const selfPresence = presences[currentUid];
  const selfX = localPos.x;
  const selfY = localPos.y;

  // Camera coordinates directly locked to local position
  const cameraX = -(selfX * TILE_SIZE + TILE_SIZE / 2);
  const cameraY = -(selfY * TILE_SIZE + TILE_SIZE / 2);

  // Memoized 36x36 Square Ground Tiles (Generated ONCE, 0ms overhead during movement)
  const renderedTiles = useMemo(() => {
    const list: React.ReactNode[] = [];
    for (let y = 0; y < ISLAND_HEIGHT; y++) {
      for (let x = 0; x < ISLAND_WIDTH; x++) {
        const type = getIslandTile(x, y);
        list.push(
          <div
            key={`${x}_${y}`}
            onClick={() => onTileClick?.(x, y)}
            className="absolute select-none cursor-pointer"
            style={{
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          >
            {renderSquareTownTile(type, x, y)}
          </div>
        );
      }
    }
    return list;
  }, [onTileClick]);

  // Memoized Static Scenery & Iconic Buildings Layer (Zero re-rendering overhead)
  const renderedSceneryAndBuildings = useMemo(() => {
    return (
      <>
        {/* 1. Grand Qian-Wu "銭屋" Main Arcade Complex (12x8 tiles at x: 12, y: 4) */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: 12 * TILE_SIZE,
            top: 4 * TILE_SIZE,
            width: 12 * TILE_SIZE,
            height: 8 * TILE_SIZE,
          }}
        >
          <GrandArcadeComplex width={12 * TILE_SIZE} height={8 * TILE_SIZE} />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-amber-400/50 rounded border border-amber-300 animate-pulse-glow"
          />
        </div>

        {/* 2. Boutique Fashion Pavilion (5x5 tiles at x: 5, y: 6) */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: 5 * TILE_SIZE,
            top: 6 * TILE_SIZE,
            width: 5 * TILE_SIZE,
            height: 5 * TILE_SIZE,
          }}
        >
          <BoutiqueBuilding width={5 * TILE_SIZE} height={5 * TILE_SIZE} />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-pink-400/50 rounded border border-pink-300 animate-pulse-glow"
          />
        </div>

        {/* 3. Cozy Cottage Home (5x5 tiles at x: 26, y: 6) */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: 26 * TILE_SIZE,
            top: 6 * TILE_SIZE,
            width: 5 * TILE_SIZE,
            height: 5 * TILE_SIZE,
          }}
        >
          <CozyCottageBuilding width={5 * TILE_SIZE} height={5 * TILE_SIZE} />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-emerald-400/50 rounded border border-emerald-300 animate-pulse-glow"
          />
        </div>

        {/* Street Details & Scenery */}
        {TOWN_SCENERY.map((item) => {
          const style: React.CSSProperties = {
            position: 'absolute',
            left: item.x * TILE_SIZE,
            top: item.y * TILE_SIZE,
            width: item.widthTiles * TILE_SIZE,
            height: item.heightTiles * TILE_SIZE,
            zIndex: item.walkable ? 15 : 25,
            pointerEvents: 'none',
          };

          switch (item.type) {
            case 'utility_pole':
              return (
                <div key={item.id} style={style}>
                  <UtilityPole width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'billboard':
              return (
                <div key={item.id} style={style}>
                  <RetroBillboard width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'car':
              return (
                <div key={item.id} style={style}>
                  <ParkedMiniCar width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'vending':
              return (
                <div key={item.id} style={style}>
                  <VendingMachine width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'street_lamp':
              return (
                <div key={item.id} style={style}>
                  <StreetLamp width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'hedge':
              return (
                <div key={item.id} style={style}>
                  <FloweringHedge width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'manhole':
              return (
                <div key={item.id} style={style} className="flex items-center justify-center">
                  <ManholeCover width={36} height={36} />
                </div>
              );
            case 'road_slow':
              return (
                <div key={item.id} style={style} className="flex items-center justify-center select-none">
                  <span className="font-sans font-bold text-2xl text-white/50 tracking-wider">
                    慢
                  </span>
                </div>
              );
            case 'fountain':
              return (
                <div key={item.id} style={style}>
                  <PixelAsset category="fountain" width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            case 'tree_pine':
            case 'tree_palm':
              return (
                <div key={item.id} style={style}>
                  <PixelAsset category="tree" width={item.widthTiles * TILE_SIZE} height={item.heightTiles * TILE_SIZE} />
                </div>
              );
            default:
              return null;
          }
        })}
      </>
    );
  }, []);

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
    <div className="relative w-full h-full overflow-hidden bg-[#0a1128]">
      {/* Follow Camera World Container (130ms linear camera follow matching player velocity) */}
      <div
        className="absolute top-1/2 left-1/2 transition-transform duration-130 linear will-change-transform"
        style={{
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)`,
          width: ISLAND_WIDTH * TILE_SIZE,
          height: ISLAND_HEIGHT * TILE_SIZE,
        }}
      >
        {/* Base Ground Tiles */}
        <div className="relative w-full h-full">{renderedTiles}</div>

        {/* Buildings & Street Details Layer */}
        {renderedSceneryAndBuildings}

        {/* ================= LOCAL PLAYER (BUTTERY SMOOTH 130ms LINEAR SYNC) ================= */}
        <div
          className="absolute z-30 pointer-events-none transition-[left,top] duration-130 linear will-change-transform"
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
            size={64}
          />
        </div>

        {/* ================= REMOTE PLAYERS & NPC (SMOOTH INTERPOLATION) ================= */}
        {remotePlayers.map((player) => (
          <div
            key={player.uid}
            onClick={(e) => {
              e.stopPropagation();
              onPlayerClick?.(player);
            }}
            className="absolute z-30 transition-[left,top] duration-130 linear will-change-transform cursor-pointer"
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
              size={64}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

function renderSquareTownTile(type: string, x: number, y: number) {
  switch (type) {
    case 'asphalt':
      return (
        <div className="w-full h-full bg-[#3f3f46] border border-[#27272a]/25 relative overflow-hidden">
          {(x + y) % 3 === 0 && (
            <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-[#52525b]/40 rounded-full" />
          )}
          {/* Yellow Road Divider Center Line on row 13 */}
          {y === 13 && x % 2 === 0 && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-[#facc15]/80" />
          )}
        </div>
      );

    case 'sidewalk':
      return (
        <div className="w-full h-full bg-[#a1a1aa] border border-[#71717a] relative flex items-center justify-center">
          <div className="w-10 h-10 border border-[#71717a]/50 bg-[#d4d4d8]" />
          {(x + y) % 2 === 0 && (
            <div className="absolute w-2 h-2 bg-[#71717a]/20" />
          )}
        </div>
      );

    case 'boardwalk':
      return (
        <div className="w-full h-full bg-[#9a3412] border-x border-[#7c2d12] relative overflow-hidden">
          <div className="w-full h-2 border-b border-[#7c2d12] bg-[#c2410c]" />
          <div className="w-full h-4 border-b border-[#7c2d12] bg-[#9a3412]" />
          <div className="w-full h-3 border-b border-[#7c2d12] bg-[#c2410c]" />
          <div className="w-full h-3 bg-[#9a3412]" />
        </div>
      );

    case 'plaza':
      return (
        <div className="w-full h-full bg-[#e2e8f0] border border-[#cbd5e1] flex items-center justify-center relative">
          <div className="w-8 h-8 rounded-full border border-[#94a3b8] bg-[#f1f5f9]" />
          {(x + y) % 2 === 0 && (
            <div className="absolute w-2 h-2 bg-[#64748b]/20 rounded-full" />
          )}
        </div>
      );

    case 'sand':
      return (
        <div className="w-full h-full bg-[#fed7aa] border border-[#fdba74]/40 relative">
          {(x * 7 + y * 3) % 5 === 0 && (
            <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-[#ea580c]/30 rounded-full" />
          )}
          {(x + y) % 9 === 0 && (
            <div className="absolute bottom-2 right-3 w-2 h-2 bg-[#f43f5e]/40 rounded-full" />
          )}
        </div>
      );

    case 'water':
      return (
        <div className="w-full h-full bg-[#0284c7] border border-[#0369a1]/40 relative overflow-hidden">
          {(x + y) % 3 === 0 && (
            <div className="absolute top-2 left-2 w-5 h-1 bg-[#7dd3fc]/60 rounded-full animate-water-flow" />
          )}
          {(x + y) % 4 === 1 && (
            <div className="absolute bottom-2 right-2 w-6 h-1 bg-[#bae6fd]/50 rounded-full" />
          )}
        </div>
      );

    case 'grass':
    default:
      return (
        <div className="w-full h-full bg-[#4ade80] border border-[#22c55e]/30 relative overflow-hidden">
          {(x * 3 + y * 5) % 4 === 0 && (
            <div className="absolute top-2 left-2 w-1.5 h-2 bg-[#86efac] rounded-xs" />
          )}
          {(x * 7 + y * 11) % 13 === 0 && (
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#f43f5e] rounded-full" />
          )}
          {(x * 5 + y * 9) % 11 === 0 && (
            <div className="absolute top-3 right-3 w-2 h-2 bg-[#facc15] rounded-full" />
          )}
        </div>
      );
  }
}
