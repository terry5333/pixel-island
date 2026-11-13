import React, { useState } from 'react';
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
import { RotateCw, Trash2, Check, Hammer, DoorOpen } from 'lucide-react';

interface HomeMapProps {
  hostUser: UserProfile;
  currentUid: string;
  presences: Record<string, IslandPresence>;
  itemsMap: Record<string, Item>;
  onSaveLayout: (newLayout: RoomFurniture[]) => Promise<void>;
  onExitHome: () => void;
  onTileClick?: (x: number, y: number) => void;
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
  const [isDecorating, setIsDecorating] = useState(false);
  const [layout, setLayout] = useState<RoomFurniture[]>(hostUser.roomLayout || []);
  const [selectedFurnitureItemId, setSelectedFurnitureItemId] = useState<string | null>(null);
  const [selectedPlacedInstanceId, setSelectedPlacedInstanceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selfPresence = presences[currentUid];
  const selfX = selfPresence?.x ?? 5;
  const selfY = selfPresence?.y ?? 6;

  // Filter owned furniture from inventory
  const ownedFurnitureItems = hostUser.inventory
    .map((id) => itemsMap[id])
    .filter((it): it is Item => !!it && it.category === 'furniture');

  // Center camera on player inside house
  const cameraX = -(selfX * TILE_SIZE + TILE_SIZE / 2);
  const cameraY = -(selfY * TILE_SIZE + TILE_SIZE / 2);

  // Handle grid cell click in decorating mode
  const handleCellClick = (x: number, y: number) => {
    if (!isDecorating) {
      onTileClick?.(x, y);
      return;
    }

    // Do not place on walls
    if (x <= 0 || x >= HOME_WIDTH - 1 || y <= 0 || y >= HOME_HEIGHT - 1) return;
    // Do not block exit door mat
    if (y === HOME_HEIGHT - 1 && (x === 5 || x === 6)) return;

    // Check if cell already has furniture
    const existing = layout.find((f) => f.x === x && f.y === y);
    if (existing) {
      setSelectedPlacedInstanceId(existing.instanceId);
      sound.playClick();
      return;
    }

    // Place selected furniture
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

  // Players visiting this specific home
  const homeVisitors = Object.values(presences).filter(
    (p) => p.currentPlace === 'home' && (p.visitingHomeUid === hostUser.uid || (!p.visitingHomeUid && p.uid === hostUser.uid))
  );

  // Render 12x12 grid
  const tiles: React.ReactNode[] = [];
  for (let y = 0; y < HOME_HEIGHT; y++) {
    for (let x = 0; x < HOME_WIDTH; x++) {
      const type = getHomeTile(x, y);
      const isExit = y === HOME_HEIGHT - 1 && (x === 5 || x === 6);

      tiles.push(
        <div
          key={`home_${x}_${y}`}
          onClick={() => handleCellClick(x, y)}
          className={`absolute select-none ${
            isDecorating ? 'cursor-pointer hover:bg-amber-300/20' : 'cursor-pointer'
          }`}
          style={{
            left: x * TILE_SIZE,
            top: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
        >
          {type === 'wall' ? (
            <div className="w-full h-full bg-[#475569] border border-[#334155] relative">
              <div className="absolute top-1 left-1 right-1 h-3 bg-[#64748b] rounded-xs" />
              <div className="absolute bottom-1 left-2 w-3 h-2 bg-[#1e293b]/60" />
            </div>
          ) : (
            <div
              className={`w-full h-full bg-[#b45309] border border-[#92400e]/60 relative ${
                isDecorating ? 'border-dashed border-amber-300/40' : ''
              }`}
            >
              {/* Wood Floor Grain */}
              <div className="absolute top-0 bottom-0 left-0 right-0 opacity-20 bg-[linear-gradient(90deg,transparent_46%,#78350f_48%,transparent_52%)]" />
              {(x + y) % 2 === 0 && (
                <div className="absolute top-2 left-2 w-2 h-1 bg-[#d97706]/40 rounded-sm" />
              )}
            </div>
          )}

          {/* Welcome Exit Mat */}
          {isExit && (
            <div className="absolute inset-x-1 bottom-0 h-4 bg-emerald-700/80 border border-emerald-400/80 rounded-t flex items-center justify-center animate-pulse">
              <span className="text-[8px] text-white font-bold">出口</span>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f172a]">
      {/* Home HUD Header */}
      <div className="absolute top-16 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        <div className="pixel-card px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
          <span className="text-amber-400 font-bold text-sm">
            🏡 {hostUser.displayName} 的溫馨小屋
          </span>
          {isOwner && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40">
              屋主
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {isOwner && (
            <button
              onClick={() => {
                setIsDecorating(!isDecorating);
                sound.playClick();
              }}
              className={`pixel-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1 rounded ${
                isDecorating ? 'bg-amber-500 text-black' : 'bg-slate-700 text-white'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              {isDecorating ? '退出佈置' : '🔨 佈置模式'}
            </button>
          )}

          <button
            onClick={onExitHome}
            className="pixel-btn px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 rounded"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            回到島嶼
          </button>
        </div>
      </div>

      {/* Follow Camera World Container */}
      <div
        className="absolute top-1/2 left-1/2 transition-transform duration-150 ease-out will-change-transform"
        style={{
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)`,
          width: HOME_WIDTH * TILE_SIZE,
          height: HOME_HEIGHT * TILE_SIZE,
        }}
      >
        {/* Floor & Wall Tiles */}
        <div className="relative w-full h-full">{tiles}</div>

        {/* Placed Furniture Items */}
        {layout.map((item) => {
          const furnMeta = itemsMap[item.itemId];
          const isSelected = selectedPlacedInstanceId === item.instanceId;
          return (
            <div
              key={item.instanceId}
              onClick={(e) => {
                e.stopPropagation();
                if (isDecorating) {
                  setSelectedPlacedInstanceId(item.instanceId);
                  sound.playClick();
                }
              }}
              className={`absolute z-20 select-none ${
                isDecorating ? 'cursor-pointer hover:ring-2 hover:ring-amber-400' : ''
              } ${isSelected ? 'ring-2 ring-amber-400 bg-amber-400/20 rounded' : ''}`}
              style={{
                left: item.x * TILE_SIZE,
                top: item.y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
              }}
            >
              <PixelAsset
                category="furniture"
                item={furnMeta}
                r2Url={furnMeta?.r2Url}
                rotation={item.rotation}
                width={TILE_SIZE}
                height={TILE_SIZE}
              />
            </div>
          );
        })}

        {/* Characters inside the house */}
        {homeVisitors.map((player) => {
          const isSelf = player.uid === currentUid;
          return (
            <div
              key={player.uid}
              className="absolute z-30 transition-[left,top] duration-150 ease-out will-change-transform"
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
                isSelf={isSelf}
                size={64}
              />
            </div>
          );
        })}
      </div>

      {/* Decorating Mode Toolbar & Drawer */}
      {isDecorating && (
        <div className="absolute bottom-4 left-4 right-4 z-50 flex flex-col gap-2 max-w-xl mx-auto">
          {/* Actions for Selected Placed Furniture */}
          {selectedPlacedInstanceId && (
            <div className="pixel-card p-2 flex items-center justify-between text-xs bg-slate-900/90 text-white animate-bounce-gentle">
              <span className="text-amber-300 font-bold">已選中家具</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRotate(selectedPlacedInstanceId)}
                  className="pixel-btn px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" /> 旋轉 90°
                </button>
                <button
                  onClick={() => handleRemove(selectedPlacedInstanceId)}
                  className="pixel-btn px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> 收回背包
                </button>
              </div>
            </div>
          )}

          {/* Owned Furniture Selector */}
          <div className="pixel-card p-3 bg-slate-900/95 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-bold">
                選擇家具放置（點擊地板即可擺放）：
              </span>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="pixel-btn px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {isSaving ? '儲存中...' : '💾 儲存佈置'}
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {ownedFurnitureItems.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">
                  背包目前沒有家具，快去「島嶼服飾店」逛逛家具館吧！
                </div>
              ) : (
                ownedFurnitureItems.map((fItem) => {
                  const isSelected = selectedFurnitureItemId === fItem.id;
                  return (
                    <div
                      key={fItem.id}
                      onClick={() => {
                        setSelectedFurnitureItemId(fItem.id);
                        sound.playClick();
                      }}
                      className={`flex-shrink-0 p-1.5 rounded cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/20 scale-105'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                      }`}
                    >
                      <PixelAsset
                        category="furniture"
                        item={fItem}
                        r2Url={fItem.r2Url}
                        width={40}
                        height={40}
                      />
                      <div className="text-[9px] text-center text-slate-200 mt-1 max-w-[48px] truncate">
                        {fItem.name}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
