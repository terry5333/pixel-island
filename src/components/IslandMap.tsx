import React, { useMemo } from 'react';
import {
  ISLAND_WIDTH,
  ISLAND_HEIGHT,
  TILE_SIZE,
  getIslandTile,
  TOWN_SCENERY,
  ActiveHouse,
  getActiveHouses,
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
  activeHouses?: ActiveHouse[];
  onTileClick?: (x: number, y: number) => void;
  onPlayerClick?: (player: IslandPresence) => void;
  onEnterHouse?: (house: ActiveHouse) => void;
}

export const IslandMap: React.FC<IslandMapProps> = ({
  currentUid,
  localPos,
  currentUser,
  presences,
  itemsMap,
  activeHouses: propHouses,
  onTileClick,
  onPlayerClick,
  onEnterHouse,
}) => {
  const selfPresence = presences[currentUid];
  const selfX = localPos.x;
  const selfY = localPos.y;

  // Compute active houses for all players online if not passed as prop
  const activeHouses = useMemo(() => {
    if (propHouses && propHouses.length > 0) return propHouses;
    return getActiveHouses(
      currentUid,
      currentUser?.displayName || selfPresence?.displayName || '冒險家',
      presences
    );
  }, [propHouses, currentUid, currentUser?.displayName, selfPresence?.displayName, presences]);

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
            className="absolute cursor-pointer select-none"
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

  // Memoized Buildings & Street Details
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
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-amber-400/60 rounded border border-amber-300 animate-pulse-glow"
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
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-pink-400/60 rounded border border-pink-300 animate-pulse-glow"
          />
        </div>

        {/* 3. Multiplayer Loaded Houses (Dynamic for local player + remote players) */}
        {activeHouses.map((house) => (
          <div
            key={house.plotId}
            className="absolute z-20"
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
              roofColor={house.roofColor}
              roofShadow={house.roofShadow}
              ownerName={house.ownerName}
              isSelf={house.isSelf}
            />
            {/* Interactive Doorstep Mat with Pulse Portal */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onEnterHouse?.(house);
              }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-emerald-400/60 hover:bg-emerald-300 rounded border border-emerald-300 animate-pulse cursor-pointer pointer-events-auto flex items-center justify-center group shadow-md"
              title={`點擊進入 ${house.ownerName} 的家`}
            >
              <span className="text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                進入
              </span>
            </div>
          </div>
        ))}

        {/* Overhead High-Voltage Power Lines Spanning Utility Poles (Eastward Anime Aesthetic) */}
        <svg
          className="absolute pointer-events-none z-25"
          style={{
            left: 10 * TILE_SIZE + 48,
            top: 7 * TILE_SIZE + 24,
            width: (24 - 10) * TILE_SIZE,
            height: 80,
          }}
          viewBox="0 0 672 80"
          preserveAspectRatio="none"
        >
          {/* Main Power Line 1 with Catenary Sag */}
          <path d="M 0 10 Q 336 48 672 10" stroke="#0f172a" strokeWidth="2.5" fill="none" opacity="0.85" />
          {/* Secondary Power Line 2 */}
          <path d="M 0 30 Q 336 68 672 30" stroke="#1e293b" strokeWidth="2" fill="none" opacity="0.75" />
          {/* Third Telephone Wire */}
          <path d="M 0 46 Q 336 78 672 46" stroke="#334155" strokeWidth="1.5" fill="none" opacity="0.65" />
        </svg>

        {/* Street Details & Scenery Items */}
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
                  <span className="font-sans font-bold text-2xl text-white/60 tracking-wider drop-shadow-xs">
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
  }, [activeHouses, onEnterHouse]);

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
    <div className="relative w-full h-full overflow-hidden bg-[#071329]">
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

// ================= RICH RETRO PIXEL GROUND TILES (Eastward / 風來之國 Aesthetic) =================
function renderSquareTownTile(type: string, x: number, y: number) {
  switch (type) {
    case 'asphalt': {
      const isYellowLine = y === 13 && x % 2 === 0;
      const isTopCurb = y === 12;
      const isBottomCurb = y === 15;
      return (
        <div className="w-full h-full bg-[#373b47] border border-[#262830]/40 relative overflow-hidden">
          {/* Road micro texture specks */}
          {(x * 7 + y * 13) % 4 === 0 && (
            <div className="absolute top-1.5 left-2 w-1.5 h-1.5 bg-[#4c5263] rounded-xs opacity-60" />
          )}
          {(x * 11 + y * 5) % 5 === 0 && (
            <div className="absolute bottom-2 right-3 w-1 h-1 bg-[#23252e] rounded-xs opacity-75" />
          )}
          {/* White Curb Edging */}
          {isTopCurb && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#f1f5f9]/40 border-b border-[#94a3b8]/30" />
          )}
          {isBottomCurb && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f1f5f9]/40 border-t border-[#94a3b8]/30" />
          )}
          {/* Yellow Road Center Divider Line */}
          {isYellowLine && (
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-[#facc15] shadow-xs" />
          )}
        </div>
      );
    }

    case 'sidewalk':
      return (
        <div className="w-full h-full bg-[#cbd5e1] border border-[#94a3b8] relative flex items-center justify-center overflow-hidden">
          {/* Herringbone / Interlocking Stone Blocks */}
          <div className="w-9 h-9 border border-[#94a3b8]/60 bg-[#e2e8f0]" />
          {(x + y) % 2 === 0 ? (
            <div className="absolute top-0 left-0 w-3 h-3 bg-[#f8fafc]/50" />
          ) : (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#64748b]/20" />
          )}
        </div>
      );

    case 'boardwalk':
      return (
        <div className="w-full h-full bg-[#854d0e] border-x border-[#5c330a] relative overflow-hidden flex flex-col justify-between">
          <div className="w-full h-2.5 border-b border-[#5c330a] bg-[#a16207]" />
          <div className="w-full h-3 border-b border-[#5c330a] bg-[#854d0e]" />
          <div className="w-full h-2.5 border-b border-[#5c330a] bg-[#a16207]" />
          <div className="w-full h-3 bg-[#713f12]" />
          {/* Brass Wood Planks Nails */}
          <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-[#ca8a04]" />
          <div className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-[#ca8a04]" />
          <div className="absolute bottom-1 left-1.5 w-1 h-1 rounded-full bg-[#ca8a04]" />
          <div className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-[#ca8a04]" />
        </div>
      );

    case 'plaza':
      return (
        <div className="w-full h-full bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center relative overflow-hidden">
          {/* Central Medallion Cobblestone */}
          <div className="w-8 h-8 rounded-full border border-[#94a3b8] bg-[#e2e8f0] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#cbd5e1]" />
          </div>
          {(x + y) % 3 === 0 && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#94a3b8]/40 rounded-full" />
          )}
        </div>
      );

    case 'sand': {
      const hasShell = (x * 7 + y * 13) % 9 === 0;
      const hasStarfish = (x * 11 + y * 7) % 17 === 0;
      return (
        <div className="w-full h-full bg-[#fde047] border border-[#facc15]/50 relative overflow-hidden">
          {/* Warm Sand Dunes / Ripples */}
          {(x + y) % 2 === 0 && (
            <div className="absolute top-2 left-1 right-2 h-1 bg-[#eab308]/25 rounded-full" />
          )}
          {hasShell && (
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#fda4af] border border-[#f43f5e]/40" />
          )}
          {hasStarfish && (
            <div className="absolute top-2 left-2 w-2 h-2 rotate-45 bg-[#fb923c] border border-[#ea580c]/50" />
          )}
        </div>
      );
    }

    case 'water': {
      const hasWhiteFoam = (x + y) % 3 === 0;
      const hasLightSallows = (x + y) % 4 === 1;
      return (
        <div className="w-full h-full bg-[#0284c7] border border-[#0369a1]/40 relative overflow-hidden">
          {/* Sun glint waves */}
          {hasWhiteFoam && (
            <div className="absolute top-2 left-2 w-7 h-1.5 bg-[#e0f2fe]/70 rounded-full animate-water-flow shadow-xs" />
          )}
          {hasLightSallows && (
            <div className="absolute bottom-2.5 right-2 w-6 h-1 bg-[#38bdf8]/60 rounded-full" />
          )}
          {/* Deep shimmer */}
          {(x * 5 + y * 7) % 5 === 0 && (
            <div className="absolute top-6 left-3 w-4 h-1 bg-[#0284c7]/40 rounded-full" />
          )}
        </div>
      );
    }

    case 'grass':
    default: {
      const flowerHash = (x * 13 + y * 17) % 16;
      return (
        <div className="w-full h-full bg-[#38b764] border border-[#2b9348]/40 relative overflow-hidden">
          {/* Grass Tufts */}
          {(x * 3 + y * 5) % 4 === 0 && (
            <div className="absolute top-2 left-2 w-1.5 h-2.5 bg-[#52c97a] rounded-xs shadow-xs" />
          )}
          {(x * 7 + y * 3) % 5 === 0 && (
            <div className="absolute bottom-2 right-2 w-1.5 h-2 bg-[#2d7f38] rounded-xs" />
          )}
          {/* Multi-Colored Wild Flower Blossoms */}
          {flowerHash === 1 && (
            // Pink Sakura Flower
            <div className="absolute bottom-2 left-3 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f472b6] shadow-xs" />
              <div className="absolute w-1 h-1 rounded-full bg-[#fef08a]" />
            </div>
          )}
          {flowerHash === 3 && (
            // Golden Buttercup Flower
            <div className="absolute top-2.5 right-2.5 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#facc15] shadow-xs" />
              <div className="absolute w-1 h-1 rounded-full bg-[#ea580c]" />
            </div>
          )}
          {flowerHash === 7 && (
            // Forget-Me-Not Blue Blossom
            <div className="absolute bottom-3 right-3 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#60a5fa] shadow-xs" />
              <div className="absolute w-0.5 h-0.5 rounded-full bg-white" />
            </div>
          )}
          {flowerHash === 11 && (
            // White Daisy Blossom
            <div className="absolute top-3 left-3 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f8fafc] shadow-xs" />
              <div className="absolute w-1 h-1 rounded-full bg-[#facc15]" />
            </div>
          )}
        </div>
      );
    }
  }
}
