import React, { useState } from 'react';
import { Item, ItemCategory } from '../types/game';

interface PixelAssetProps {
  category: ItemCategory | 'body' | 'building' | 'tree' | 'fountain' | 'water' | 'sand';
  r2Url?: string;
  item?: Item;
  variant?: string;
  color?: string;
  secondaryColor?: string;
  width?: number | string;
  height?: number | string;
  facing?: 'left' | 'right';
  className?: string;
  alt?: string;
  buildingType?: 'boutique' | 'arcade' | 'home';
  rotation?: 0 | 90 | 180 | 270;
}

export const PixelAsset: React.FC<PixelAssetProps> = ({
  category,
  r2Url,
  item,
  variant: propVariant,
  color: propColor,
  secondaryColor: propSecondaryColor,
  width = 64,
  height = 64,
  facing = 'right',
  className = '',
  alt = 'Pixel Asset',
  buildingType,
  rotation = 0,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // If R2 URL is provided and has not failed, attempt to render the image
  const resolvedUrl = r2Url || item?.r2Url;
  if (resolvedUrl && !imgFailed) {
    return (
      <img
        src={resolvedUrl}
        alt={alt}
        width={width}
        height={height}
        onError={() => setImgFailed(true)}
        className={`pixelated ${facing === 'left' ? 'scale-x-[-1]' : ''} ${className}`}
        style={{
          transform: `${facing === 'left' ? 'scaleX(-1)' : ''} rotate(${rotation}deg)`,
          imageRendering: 'pixelated',
        }}
      />
    );
  }

  // Fallback to high-quality procedural SVG pixel rendering
  const variant = propVariant || item?.variant || 'default';
  const color = propColor || item?.color || '#3b82f6';
  const secondaryColor = propSecondaryColor || item?.secondaryColor || '#1d4ed8';

  const transformStyle: React.CSSProperties = {
    transform: `${facing === 'left' ? 'scaleX(-1)' : ''} rotate(${rotation}deg)`,
    transformOrigin: 'center',
    imageRendering: 'pixelated',
  };

  return (
    <div
      className={`inline-block overflow-hidden relative select-none ${className}`}
      style={{ width, height, ...transformStyle }}
    >
      {renderSvgFallback(category, variant, color, secondaryColor, buildingType)}
    </div>
  );
};

function renderSvgFallback(
  category: string,
  variant: string,
  color: string,
  secondaryColor: string,
  buildingType?: 'boutique' | 'arcade' | 'home'
) {
  switch (category) {
    case 'body':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {/* Soft Drop Shadow beneath character */}
          <ellipse cx="32" cy="61" rx="13" ry="2.8" fill="rgba(0,0,0,0.3)" />

          {/* Natural Anime Skin Tone */}
          {/* Base Head */}
          <rect x="23" y="13" width="18" height="18" fill="#ffdcb4" />
          <rect x="25" y="11" width="14" height="2" fill="#ffdcb4" />
          <rect x="25" y="31" width="14" height="2" fill="#f6b88f" />
          {/* Head Cheek Width */}
          <rect x="22" y="16" width="1" height="13" fill="#ffdcb4" />
          <rect x="41" y="16" width="1" height="13" fill="#ffdcb4" />

          {/* Chin Shading */}
          <rect x="27" y="32" width="10" height="2" fill="#f0a57b" />

          {/* Big Expressive Anime Pixel Eyes */}
          {/* Left Eye */}
          <rect x="26" y="20" width="4" height="6" fill="#1e1b4b" rx="1" />
          <rect x="26" y="21" width="3" height="3" fill="#312e81" />
          <rect x="26" y="20" width="2" height="2" fill="#ffffff" />
          <rect x="28" y="24" width="1" height="1" fill="#a5b4fc" />

          {/* Right Eye */}
          <rect x="34" y="20" width="4" height="6" fill="#1e1b4b" rx="1" />
          <rect x="34" y="21" width="3" height="3" fill="#312e81" />
          <rect x="34" y="20" width="2" height="2" fill="#ffffff" />
          <rect x="36" y="24" width="1" height="1" fill="#a5b4fc" />

          {/* Cute Rosy Cheeks Blush */}
          <rect x="24" y="26" width="3" height="2" fill="#f43f5e" opacity="0.6" />
          <rect x="37" y="26" width="3" height="2" fill="#f43f5e" opacity="0.6" />

          {/* Tiny Cute Mouth */}
          <rect x="31" y="27" width="2" height="1" fill="#e11d48" />

          {/* Delicate Neck */}
          <rect x="29" y="33" width="6" height="4" fill="#f0a57b" />

          {/* Torso Base */}
          <rect x="24" y="37" width="16" height="12" fill="#ffdcb4" />

          {/* Arms with skin tone */}
          <rect x="20" y="38" width="4" height="10" fill="#ffdcb4" />
          <rect x="40" y="38" width="4" height="10" fill="#ffdcb4" />
          {/* Cute Hands */}
          <rect x="20" y="48" width="4" height="3" fill="#f6b88f" />
          <rect x="40" y="48" width="4" height="3" fill="#f6b88f" />

          {/* Legs Base */}
          <rect x="25" y="49" width="5" height="9" fill="#ffdcb4" />
          <rect x="34" y="49" width="5" height="9" fill="#ffdcb4" />

          {/* Stylish Retro Sneakers */}
          {/* Left Shoe */}
          <rect x="23" y="57" width="7" height="3" fill="#ffffff" />
          <rect x="23" y="56" width="6" height="2" fill="#3b82f6" />
          <rect x="22" y="59" width="8" height="2" fill="#1e293b" />

          {/* Right Shoe */}
          <rect x="34" y="57" width="7" height="3" fill="#ffffff" />
          <rect x="35" y="56" width="6" height="2" fill="#3b82f6" />
          <rect x="34" y="59" width="8" height="2" fill="#1e293b" />
        </svg>
      );

    case 'hair':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {variant === 'twintail' ? (
            <>
              {/* Twin tails base crown */}
              <rect x="21" y="9" width="22" height="13" fill={color} />
              <rect x="19" y="11" width="26" height="9" fill={color} />
              <rect x="23" y="7" width="18" height="2" fill={color} />
              {/* Glossy Anime Highlight Ring */}
              <rect x="24" y="11" width="16" height="2" fill="#ffffff" opacity="0.35" />
              {/* Front Bangs with gentle tips */}
              <rect x="23" y="14" width="4" height="6" fill={secondaryColor} />
              <rect x="28" y="14" width="8" height="5" fill={color} />
              <rect x="37" y="14" width="4" height="6" fill={secondaryColor} />
              <rect x="30" y="18" width="4" height="2" fill={secondaryColor} />
              {/* Side Locks */}
              <rect x="21" y="18" width="2" height="7" fill={color} />
              <rect x="41" y="18" width="2" height="7" fill={color} />
              {/* Pigtails */}
              <rect x="13" y="16" width="7" height="18" fill={color} />
              <rect x="11" y="22" width="5" height="14" fill={secondaryColor} />
              <rect x="44" y="16" width="7" height="18" fill={color} />
              <rect x="48" y="22" width="5" height="14" fill={secondaryColor} />
              {/* Cute Ribbons / Hair ties */}
              <rect x="17" y="17" width="4" height="4" fill="#fb7185" />
              <rect x="43" y="17" width="4" height="4" fill="#fb7185" />
            </>
          ) : variant === 'spiky' ? (
            <>
              {/* Spiky Anime Tuft */}
              <rect x="27" y="3" width="10" height="6" fill={color} />
              <rect x="20" y="7" width="24" height="12" fill={color} />
              <rect x="16" y="9" width="8" height="8" fill={secondaryColor} />
              <rect x="40" y="9" width="8" height="8" fill={secondaryColor} />
              <rect x="29" y="5" width="6" height="3" fill="#ffffff" opacity="0.4" />
              {/* Jagged Bangs */}
              <polygon points="24,19 27,15 30,19 33,14 36,19 39,15 41,19" fill={color} />
              <rect x="22" y="17" width="2" height="5" fill={secondaryColor} />
              <rect x="40" y="17" width="2" height="5" fill={secondaryColor} />
            </>
          ) : variant === 'beanie' ? (
            <>
              {/* Beanie Hat */}
              <rect x="21" y="7" width="22" height="11" fill={color} />
              <rect x="19" y="11" width="26" height="7" fill={color} />
              <rect x="17" y="15" width="30" height="5" fill={secondaryColor} />
              {/* Ribbed texture & Pom-pom */}
              <rect x="30" y="3" width="4" height="4" fill="#ffffff" rx="1" />
              <rect x="22" y="16" width="2" height="3" fill="#000000" opacity="0.2" />
              <rect x="28" y="16" width="2" height="3" fill="#000000" opacity="0.2" />
              <rect x="34" y="16" width="2" height="3" fill="#000000" opacity="0.2" />
              <rect x="40" y="16" width="2" height="3" fill="#000000" opacity="0.2" />
              {/* Soft Side Strands */}
              <rect x="22" y="19" width="3" height="6" fill="#3e2723" />
              <rect x="39" y="19" width="3" height="6" fill="#3e2723" />
            </>
          ) : (
            <>
              {/* Modern Layered Anime Short Hair */}
              <rect x="21" y="9" width="22" height="13" fill={color} />
              <rect x="19" y="11" width="26" height="9" fill={color} />
              <rect x="23" y="7" width="18" height="2" fill={color} />
              {/* Angel Ring Anime Sheen */}
              <rect x="24" y="11" width="16" height="2" fill="#ffffff" opacity="0.4" />
              {/* Side Burns framing face */}
              <rect x="21" y="18" width="3" height="8" fill={color} />
              <rect x="40" y="18" width="3" height="8" fill={color} />
              {/* Beautiful Layered Bangs */}
              <rect x="23" y="15" width="5" height="5" fill={color} />
              <rect x="29" y="15" width="6" height="4" fill={secondaryColor} />
              <rect x="36" y="15" width="5" height="5" fill={color} />
              {/* Tip strands */}
              <rect x="25" y="19" width="2" height="2" fill={secondaryColor} />
              <rect x="32" y="18" width="2" height="2" fill={secondaryColor} />
              <rect x="37" y="19" width="2" height="2" fill={secondaryColor} />
            </>
          )}
        </svg>
      );

    case 'top':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {/* Main Shirt Body */}
          <rect x="24" y="37" width="16" height="13" fill={color} />
          {/* Bottom Hem Band */}
          <rect x="24" y="49" width="16" height="1.5" fill={secondaryColor} />
          {/* Sleeves */}
          <rect x="20" y="37" width="4" height="8" fill={color} />
          <rect x="40" y="37" width="4" height="8" fill={color} />
          {/* Sleeve Cuffs */}
          <rect x="20" y="44" width="4" height="1" fill={secondaryColor} />
          <rect x="40" y="44" width="4" height="1" fill={secondaryColor} />

          {/* Collar / Pattern */}
          {variant === 'striped' ? (
            <>
              {/* Sailor Collar with Stripes */}
              <rect x="28" y="37" width="8" height="3" fill="#ffffff" />
              <rect x="24" y="41" width="16" height="2" fill={secondaryColor} />
              <rect x="24" y="45" width="16" height="2" fill={secondaryColor} />
            </>
          ) : variant === 'hoodie' ? (
            <>
              {/* Streetwear Hoodie with Pocket & Cords */}
              <rect x="28" y="36" width="8" height="4" fill={secondaryColor} />
              {/* White drawstrings */}
              <rect x="29" y="39" width="1" height="4" fill="#ffffff" />
              <rect x="34" y="39" width="1" height="4" fill="#ffffff" />
              {/* Kangaroo Pocket */}
              <rect x="27" y="44" width="10" height="4" fill={secondaryColor} rx="1" />
            </>
          ) : variant === 'coat' ? (
            <>
              {/* Stylish Bomber Jacket with Center Zipper */}
              <rect x="31" y="37" width="2" height="13" fill="#e2e8f0" />
              <rect x="24" y="37" width="3" height="13" fill={secondaryColor} />
              <rect x="37" y="37" width="3" height="13" fill={secondaryColor} />
              {/* Gold Pins */}
              <rect x="28" y="41" width="2" height="2" fill="#facc15" />
            </>
          ) : (
            <>
              {/* Classic V-Neck with Inner Tee */}
              <polygon points="30,37 34,37 32,41" fill="#ffffff" />
              <rect x="27" y="37" width="10" height="1.5" fill={secondaryColor} />
            </>
          )}
        </svg>
      );

    case 'bottom':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {variant === 'skirt' ? (
            <>
              {/* Cute Pleated Anime Skirt */}
              <rect x="23" y="48" width="18" height="2.5" fill={color} />
              <rect x="21" y="50" width="22" height="6" fill={color} />
              {/* Pleat Shading Lines */}
              <rect x="24" y="50" width="1.5" height="6" fill={secondaryColor} />
              <rect x="28" y="50" width="1.5" height="6" fill={secondaryColor} />
              <rect x="34" y="50" width="1.5" height="6" fill={secondaryColor} />
              <rect x="38" y="50" width="1.5" height="6" fill={secondaryColor} />
            </>
          ) : variant === 'shorts' ? (
            <>
              {/* Trendy Denim Shorts */}
              <rect x="24" y="48" width="16" height="3" fill={color} />
              <rect x="23" y="51" width="8" height="4" fill={color} />
              <rect x="33" y="51" width="8" height="4" fill={color} />
              <rect x="27" y="49" width="10" height="1" fill={secondaryColor} />
            </>
          ) : (
            <>
              {/* Cool Cuffed Slim Jeans */}
              <rect x="24" y="48" width="16" height="3" fill={color} />
              <rect x="25" y="50" width="6" height="7" fill={color} />
              <rect x="33" y="50" width="6" height="7" fill={color} />
              {/* Pocket stitches & Belt line */}
              <rect x="25" y="49" width="14" height="1" fill="#facc15" opacity="0.6" />
              {/* Cuffed Ankles */}
              <rect x="25" y="56" width="6" height="1.5" fill={secondaryColor} />
              <rect x="33" y="56" width="6" height="1.5" fill={secondaryColor} />
            </>
          )}
        </svg>
      );

    case 'accessory':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {variant === 'crown' ? (
            <>
              {/* Royal Golden Crown */}
              <rect x="26" y="6" width="12" height="3" fill={color} />
              <polygon points="26,6 26,2 29,5 32,1 35,5 38,2 38,6" fill={color} />
              <rect x="31" y="6" width="2" height="2" fill={secondaryColor} />
            </>
          ) : variant === 'sunglasses' ? (
            <>
              {/* Aviator Sunglasses */}
              <rect x="25" y="21" width="6" height="5" fill="#0f172a" />
              <rect x="33" y="21" width="6" height="5" fill="#0f172a" />
              <rect x="31" y="22" width="2" height="1" fill="#facc15" />
              <rect x="26" y="22" width="2" height="2" fill="#38bdf8" opacity="0.6" />
              <rect x="34" y="22" width="2" height="2" fill="#38bdf8" opacity="0.6" />
            </>
          ) : variant === 'glasses' ? (
            <>
              {/* Retro Round Glasses */}
              <rect x="25" y="21" width="6" height="5" fill="none" stroke="#0f172a" strokeWidth="1" />
              <rect x="33" y="21" width="6" height="5" fill="none" stroke="#0f172a" strokeWidth="1" />
              <rect x="31" y="23" width="2" height="1" fill="#0f172a" />
            </>
          ) : variant === 'backpack' ? (
            <>
              {/* Retro Gameboy Backpack */}
              <rect x="18" y="38" width="5" height="10" fill={color} />
              <rect x="19" y="39" width="3" height="3" fill="#22c55e" />
              <rect x="20" y="44" width="2" height="2" fill="#ef4444" />
            </>
          ) : null}
        </svg>
      );

    case 'furniture':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {variant === 'bed' ? (
            <>
              {/* Cozy Bed */}
              <rect x="10" y="18" width="44" height="38" fill={color} rx="2" />
              <rect x="12" y="20" width="40" height="12" fill="#ffffff" />
              {/* Pillow */}
              <rect x="16" y="22" width="32" height="8" fill="#f1f5f9" />
              {/* Blanket */}
              <rect x="12" y="30" width="40" height="24" fill={secondaryColor} />
              <rect x="12" y="28" width="40" height="4" fill="#bae6fd" />
            </>
          ) : variant === 'sofa' ? (
            <>
              {/* Plush Sofa */}
              <rect x="8" y="22" width="48" height="30" fill={secondaryColor} />
              <rect x="12" y="26" width="40" height="16" fill={color} />
              {/* Armrests */}
              <rect x="8" y="28" width="6" height="18" fill={color} />
              <rect x="50" y="28" width="6" height="18" fill={color} />
              {/* Cushion Line */}
              <rect x="31" y="26" width="2" height="16" fill={secondaryColor} />
              {/* Feet */}
              <rect x="12" y="52" width="4" height="4" fill="#78350f" />
              <rect x="48" y="52" width="4" height="4" fill="#78350f" />
            </>
          ) : variant === 'tv' ? (
            <>
              {/* Retro CRT TV */}
              <rect x="12" y="16" width="40" height="32" fill="#334155" />
              <rect x="16" y="20" width="26" height="24" fill="#0284c7" />
              {/* Scanlines / Glow */}
              <rect x="18" y="24" width="22" height="3" fill="#7dd3fc" />
              <rect x="18" y="32" width="16" height="3" fill="#7dd3fc" />
              {/* Knobs */}
              <rect x="45" y="24" width="4" height="4" fill="#94a3b8" />
              <rect x="45" y="32" width="4" height="4" fill="#94a3b8" />
              {/* Antenna */}
              <line x1="32" y1="16" x2="24" y2="6" stroke="#94a3b8" strokeWidth="2" />
              <line x1="32" y1="16" x2="40" y2="6" stroke="#94a3b8" strokeWidth="2" />
              {/* Stand */}
              <rect x="22" y="48" width="20" height="6" fill="#1e293b" />
            </>
          ) : variant === 'arcade' ? (
            <>
              {/* Mini Arcade Cabinet */}
              <rect x="14" y="10" width="36" height="48" fill={color} />
              {/* Marquee Header */}
              <rect x="16" y="12" width="32" height="8" fill="#facc15" />
              <rect x="18" y="14" width="28" height="4" fill="#ef4444" />
              {/* Beveled Screen */}
              <rect x="18" y="22" width="28" height="18" fill="#0f172a" />
              <rect x="22" y="26" width="12" height="8" fill="#22c55e" />
              <rect x="36" y="26" width="6" height="8" fill="#f43f5e" />
              {/* Control Panel with Joystick and buttons */}
              <rect x="16" y="42" width="32" height="6" fill="#1e293b" />
              <rect x="22" y="43" width="2" height="4" fill="#ffffff" />
              <rect x="21" y="42" width="4" height="2" fill="#ef4444" />
              <rect x="32" y="44" width="2" height="2" fill="#3b82f6" />
              <rect x="36" y="44" width="2" height="2" fill="#facc15" />
              {/* Coin Slot */}
              <rect x="28" y="51" width="8" height="4" fill="#000000" />
            </>
          ) : variant === 'table' ? (
            <>
              {/* Wooden Table */}
              <rect x="12" y="26" width="40" height="12" fill={color} />
              <rect x="10" y="24" width="44" height="4" fill="#a16207" />
              {/* Table Legs */}
              <rect x="14" y="38" width="4" height="16" fill={color} />
              <rect x="46" y="38" width="4" height="16" fill={color} />
              {/* Teacup & Steam */}
              <rect x="30" y="18" width="6" height="6" fill="#ffffff" />
              <rect x="36" y="20" width="2" height="2" fill="#cbd5e1" />
              <rect x="32" y="13" width="2" height="3" fill="#e2e8f0" opacity="0.7" />
            </>
          ) : variant === 'plushie' ? (
            <>
              {/* Cute Bunny Plushie */}
              <ellipse cx="32" cy="38" rx="12" ry="12" fill="#ffffff" />
              {/* Ears */}
              <ellipse cx="26" cy="18" rx="4" ry="10" fill="#ffffff" />
              <ellipse cx="38" cy="18" rx="4" ry="10" fill="#ffffff" />
              <ellipse cx="26" cy="18" rx="2" ry="7" fill="#fbcfe8" />
              <ellipse cx="38" cy="18" rx="2" ry="7" fill="#fbcfe8" />
              {/* Eyes & Nose */}
              <rect x="28" y="34" width="2" height="3" fill="#181425" />
              <rect x="34" y="34" width="2" height="3" fill="#181425" />
              <polygon points="32,38 30,37 34,37" fill="#f43f5e" />
            </>
          ) : variant === 'plant' ? (
            <>
              {/* Terracotta Pot */}
              <rect x="20" y="36" width="24" height="20" fill="#ea580c" />
              <rect x="18" y="34" width="28" height="4" fill="#c2410c" />
              {/* Cactus Stem */}
              <rect x="28" y="16" width="8" height="18" fill="#16a34a" />
              <rect x="22" y="22" width="6" height="6" fill="#16a34a" />
              <rect x="22" y="18" width="4" height="4" fill="#16a34a" />
              <rect x="36" y="24" width="6" height="6" fill="#16a34a" />
              <rect x="38" y="20" width="4" height="4" fill="#16a34a" />
              {/* Blossom Flower */}
              <rect x="30" y="12" width="4" height="4" fill="#f43f5e" />
            </>
          ) : (
            <>
              {/* Decorative Rug */}
              <rect x="6" y="14" width="52" height="36" fill={color} />
              <rect x="10" y="18" width="44" height="28" fill={secondaryColor} />
              <rect x="24" y="24" width="16" height="16" fill="#fde047" transform="rotate(45 32 32)" />
              {/* Fringe */}
              <rect x="4" y="16" width="2" height="32" fill="#ffffff" opacity="0.7" />
              <rect x="58" y="16" width="2" height="32" fill="#ffffff" opacity="0.7" />
            </>
          )}
        </svg>
      );

    case 'building':
      if (buildingType === 'boutique') {
        return (
          <svg viewBox="0 0 128 128" className="w-full h-full" shapeRendering="crispEdges">
            {/* Boutique Building Walls */}
            <rect x="16" y="36" width="96" height="84" fill="#fed7aa" stroke="#7c2d12" strokeWidth="4" />
            {/* Decorative Roof / Upper trim */}
            <rect x="12" y="28" width="104" height="10" fill="#ea580c" />
            {/* Striped Awning */}
            <rect x="16" y="38" width="96" height="16" fill="#ec4899" />
            <rect x="28" y="38" width="12" height="16" fill="#ffffff" />
            <rect x="52" y="38" width="12" height="16" fill="#ffffff" />
            <rect x="76" y="38" width="12" height="16" fill="#ffffff" />
            <rect x="100" y="38" width="12" height="16" fill="#ffffff" />
            {/* Shop Sign */}
            <rect x="36" y="12" width="56" height="18" fill="#be185d" stroke="#fbcfe8" strokeWidth="2" />
            <text x="64" y="25" textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
              BOUTIQUE
            </text>
            {/* Left Show Window with Dress Mannequin */}
            <rect x="22" y="60" width="30" height="38" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
            <rect x="33" y="66" width="8" height="6" fill="#f43f5e" />
            <polygon points="37,72 28,90 46,90" fill="#f43f5e" />
            {/* Entrance Door */}
            <rect x="64" y="64" width="36" height="56" fill="#854d0e" stroke="#451a03" strokeWidth="3" />
            <rect x="68" y="68" width="12" height="24" fill="#fed7aa" />
            <rect x="84" y="68" width="12" height="24" fill="#fed7aa" />
            <circle cx="94" cy="98" r="3" fill="#facc15" />
            <text x="82" y="112" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
              服飾店
            </text>
          </svg>
        );
      } else if (buildingType === 'arcade') {
        return (
          <svg viewBox="0 0 128 128" className="w-full h-full" shapeRendering="crispEdges">
            {/* Arcade Building Base */}
            <rect x="16" y="34" width="96" height="86" fill="#1e1b4b" stroke="#312e81" strokeWidth="4" />
            {/* Neon Roof Cornice */}
            <rect x="12" y="24" width="104" height="12" fill="#7c3aed" />
            {/* Glowing Neon Sign */}
            <rect x="28" y="8" width="72" height="22" fill="#0f172a" stroke="#ec4899" strokeWidth="3" />
            <text x="64" y="23" textAnchor="middle" fill="#06b6d4" fontSize="11" fontFamily="monospace" fontWeight="bold">
              ★ ARCADE ★
            </text>
            {/* Neon Pixel Lights */}
            <rect x="20" y="42" width="6" height="70" fill="#ec4899" />
            <rect x="102" y="42" width="6" height="70" fill="#06b6d4" />
            {/* Pixel Show Displays */}
            <rect x="30" y="46" width="22" height="26" fill="#000000" stroke="#facc15" strokeWidth="2" />
            <rect x="36" y="52" width="10" height="10" fill="#22c55e" />
            <rect x="76" y="46" width="22" height="26" fill="#000000" stroke="#facc15" strokeWidth="2" />
            <rect x="82" y="52" width="10" height="10" fill="#f43f5e" />
            {/* Arcade Center Entrance */}
            <rect x="46" y="72" width="36" height="48" fill="#3b0764" stroke="#a855f7" strokeWidth="3" />
            <rect x="50" y="76" width="12" height="36" fill="#06b6d4" opacity="0.8" />
            <rect x="66" y="76" width="12" height="36" fill="#ec4899" opacity="0.8" />
            <text x="64" y="114" textAnchor="middle" fill="#fef08a" fontSize="8" fontFamily="monospace">
              遊樂場
            </text>
          </svg>
        );
      } else {
        // Player Cozy Home
        return (
          <svg viewBox="0 0 128 128" className="w-full h-full" shapeRendering="crispEdges">
            {/* Chimney */}
            <rect x="86" y="14" width="12" height="24" fill="#b91c1c" stroke="#450a0a" strokeWidth="2" />
            <ellipse cx="92" cy="10" rx="4" ry="2" fill="#cbd5e1" opacity="0.8" />
            <ellipse cx="94" cy="5" rx="6" ry="3" fill="#cbd5e1" opacity="0.5" />
            {/* Slanted Tile Roof */}
            <polygon points="64,12 12,50 116,50" fill="#dc2626" stroke="#7f1d1d" strokeWidth="4" />
            {/* Attic Window */}
            <circle cx="64" cy="38" r="6" fill="#fef08a" stroke="#7f1d1d" strokeWidth="2" />
            {/* Cottage Wood Walls */}
            <rect x="24" y="50" width="80" height="70" fill="#fef3c7" stroke="#92400e" strokeWidth="4" />
            {/* Front Window with flowerbox */}
            <rect x="32" y="66" width="20" height="20" fill="#93c5fd" stroke="#78350f" strokeWidth="2" />
            <line x1="42" y1="66" x2="42" y2="86" stroke="#78350f" strokeWidth="2" />
            <line x1="32" y1="76" x2="52" y2="76" stroke="#78350f" strokeWidth="2" />
            <rect x="30" y="86" width="24" height="4" fill="#b45309" />
            <rect x="34" y="84" width="4" height="3" fill="#f43f5e" />
            <rect x="42" y="84" width="4" height="3" fill="#facc15" />
            {/* Cozy Front Door */}
            <rect x="66" y="68" width="30" height="52" fill="#92400e" stroke="#451a03" strokeWidth="3" />
            <circle cx="90" cy="96" r="3" fill="#facc15" />
            <text x="81" y="114" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">
              我的家
            </text>
          </svg>
        );
      }

    case 'tree':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {/* Tree Shadow */}
          <ellipse cx="32" cy="58" rx="16" ry="4" fill="rgba(0,0,0,0.25)" />
          {/* Wood Trunk */}
          <rect x="28" y="38" width="8" height="20" fill="#78350f" />
          <rect x="26" y="48" width="3" height="10" fill="#5c2d15" />
          <rect x="35" y="48" width="3" height="10" fill="#5c2d15" />
          {/* Lush Green Foliage (Layered Leaves) */}
          <rect x="18" y="20" width="28" height="24" fill="#15803d" />
          <rect x="14" y="24" width="36" height="16" fill="#16a34a" />
          <rect x="22" y="14" width="20" height="14" fill="#22c55e" />
          <rect x="26" y="8" width="12" height="10" fill="#4ade80" />
          {/* Apple / Berry spots */}
          <rect x="20" y="26" width="3" height="3" fill="#ef4444" />
          <rect x="40" y="22" width="3" height="3" fill="#ef4444" />
          <rect x="32" y="18" width="3" height="3" fill="#ef4444" />
        </svg>
      );

    case 'fountain':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          {/* Stone Basin */}
          <ellipse cx="32" cy="46" rx="26" ry="12" fill="#64748b" />
          <ellipse cx="32" cy="44" rx="22" ry="9" fill="#0284c7" />
          {/* Center Pillar */}
          <rect x="28" y="26" width="8" height="20" fill="#94a3b8" />
          <ellipse cx="32" cy="26" rx="12" ry="5" fill="#64748b" />
          <ellipse cx="32" cy="25" rx="10" ry="3.5" fill="#38bdf8" />
          {/* Water Spout & Droplets */}
          <rect x="31" y="14" width="2" height="12" fill="#bae6fd" />
          <rect x="26" y="18" width="2" height="2" fill="#e0f2fe" />
          <rect x="36" y="18" width="2" height="2" fill="#e0f2fe" />
          <rect x="22" y="32" width="2" height="2" fill="#e0f2fe" />
          <rect x="40" y="32" width="2" height="2" fill="#e0f2fe" />
        </svg>
      );

    case 'water':
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full" shapeRendering="crispEdges">
          <rect width="32" height="32" fill="#2563eb" />
          <rect x="2" y="6" width="8" height="2" fill="#60a5fa" opacity="0.6" />
          <rect x="18" y="12" width="10" height="2" fill="#60a5fa" opacity="0.7" />
          <rect x="6" y="22" width="12" height="2" fill="#60a5fa" opacity="0.5" />
          <rect x="22" y="26" width="6" height="2" fill="#93c5fd" opacity="0.6" />
        </svg>
      );

    case 'sand':
      return (
        <svg viewBox="0 0 32 32" className="w-full h-full" shapeRendering="crispEdges">
          <rect width="32" height="32" fill="#fde68a" />
          <rect x="8" y="8" width="2" height="2" fill="#f59e0b" opacity="0.4" />
          <rect x="22" y="18" width="2" height="2" fill="#f59e0b" opacity="0.4" />
          <rect x="14" y="26" width="2" height="2" fill="#d97706" opacity="0.3" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full" shapeRendering="crispEdges">
          <rect x="8" y="8" width="48" height="48" fill={color} stroke={secondaryColor} strokeWidth="4" />
          <text x="32" y="38" textAnchor="middle" fill="#ffffff" fontSize="12" fontFamily="monospace">
            PIXEL
          </text>
        </svg>
      );
  }
}
