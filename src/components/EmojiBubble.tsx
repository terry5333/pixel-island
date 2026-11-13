import React from 'react';

interface EmojiBubbleProps {
  emoji: string;
}

export const EmojiBubble: React.FC<EmojiBubbleProps> = ({ emoji }) => {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 animate-bubble-pop pointer-events-none">
      <div className="relative bg-white text-black px-2 py-0.5 rounded-md border-2 border-black shadow-pixel-sm text-base flex items-center justify-center min-w-[32px] min-h-[30px]">
        <span>{emoji}</span>
        {/* Little downward pixel pointer triangle */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-black" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-3 border-x-transparent border-t-4 border-t-white" />
      </div>
    </div>
  );
};
