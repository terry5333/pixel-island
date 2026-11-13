import React from 'react';
import { EquippedItems, Item, EmojiBubble as EmojiBubbleType } from '../types/game';
import { PixelAsset } from './PixelAsset';
import { EmojiBubble } from './EmojiBubble';

interface CharacterSpriteProps {
  displayName: string;
  facing?: 'left' | 'right';
  equipped: EquippedItems;
  itemsMap?: Record<string, Item>;
  isMoving?: boolean;
  emojiBubble?: EmojiBubbleType | null;
  isSelf?: boolean;
  isAdmin?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  displayName,
  facing = 'right',
  equipped,
  itemsMap = {},
  isMoving = false,
  emojiBubble,
  isSelf = false,
  isAdmin = false,
  size = 64,
  className = '',
  onClick,
}) => {
  const hairItem = equipped.hair ? itemsMap[equipped.hair] : undefined;
  const topItem = equipped.top ? itemsMap[equipped.top] : undefined;
  const bottomItem = equipped.bottom ? itemsMap[equipped.bottom] : undefined;
  const accessoryItem = equipped.accessory ? itemsMap[equipped.accessory] : undefined;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size + 20 }}
    >
      {/* Emoji Speech Bubble */}
      {emojiBubble && <EmojiBubble emoji={emojiBubble.emoji} />}

      {/* Name Tag */}
      <div className="absolute -top-5 z-40 whitespace-nowrap pointer-events-none">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded border ${
            isSelf
              ? 'bg-amber-400 text-black border-amber-600 font-bold shadow-pixel-sm'
              : 'bg-slate-900/80 text-white border-slate-700 shadow-pixel-sm'
          }`}
        >
          {isAdmin && <span className="mr-0.5 text-red-500">👑</span>}
          {displayName}
          {isSelf && <span className="ml-0.5 text-[9px] text-amber-900">(你)</span>}
        </span>
      </div>

      {/* Layered Paperdoll Container */}
      <div
        className={`relative w-16 h-16 transition-transform duration-100 ${
          isMoving ? 'animate-jelly' : 'animate-bounce-gentle'
        }`}
        style={{
          width: size,
          height: size,
          transform: `${facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'} ${
            isMoving ? (facing === 'left' ? 'rotate(-3deg)' : 'rotate(3deg)') : ''
          }`,
        }}
      >
        {/* Layer 1: Body (Z-Index 10) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <PixelAsset category="body" width={size} height={size} />
        </div>

        {/* Layer 2: Bottom (Z-Index 20) */}
        {bottomItem && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <PixelAsset
              category="bottom"
              item={bottomItem}
              r2Url={bottomItem.r2Url}
              width={size}
              height={size}
            />
          </div>
        )}

        {/* Layer 3: Top (Z-Index 30) */}
        {topItem && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <PixelAsset
              category="top"
              item={topItem}
              r2Url={topItem.r2Url}
              width={size}
              height={size}
            />
          </div>
        )}

        {/* Layer 4: Hair (Z-Index 40) */}
        {hairItem && (
          <div className="absolute inset-0 z-40 pointer-events-none">
            <PixelAsset
              category="hair"
              item={hairItem}
              r2Url={hairItem.r2Url}
              width={size}
              height={size}
            />
          </div>
        )}

        {/* Layer 5: Accessory (Z-Index 50) */}
        {accessoryItem && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            <PixelAsset
              category="accessory"
              item={accessoryItem}
              r2Url={accessoryItem.r2Url}
              width={size}
              height={size}
            />
          </div>
        )}
      </div>
    </div>
  );
};
