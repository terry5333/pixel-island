import React, { useEffect, useRef } from 'react';
import { sound } from '../services/audio';

interface VirtualControlsProps {
  onMove: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onMoveDelta?: (vx: number, vy: number, dt: number) => void;
  onInteract: () => void;
  onSendEmoji: (emoji: string) => void;
  contextPrompt?: string | null;
  onContextAction?: () => void;
}

export const EMOJI_LIST = ['❤️', '😂', '🎉', '💬', '⚡'];

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onMove,
  onMoveDelta,
  onInteract,
  onSendEmoji,
  contextPrompt,
  onContextAction,
}) => {
  const activeKeysRef = useRef<Set<string>>(new Set());
  const touchDirRef = useRef<{ vx: number; vy: number } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // 60 FPS Sub-pixel continuous game movement loop
  useEffect(() => {
    let running = true;

    const gameLoop = (currentTime: number) => {
      if (!running) return;
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = currentTime;

      const keys = activeKeysRef.current;
      let vx = 0;
      let vy = 0;

      if (keys.has('KeyW') || keys.has('ArrowUp')) vy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) vy += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) vx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) vx += 1;

      // Also merge active mobile touch D-Pad
      if (touchDirRef.current) {
        vx += touchDirRef.current.vx;
        vy += touchDirRef.current.vy;
      }

      if (vx !== 0 || vy !== 0) {
        // Normalize diagonal speed
        if (vx !== 0 && vy !== 0) {
          vx *= 0.7071;
          vy *= 0.7071;
        }

        if (onMoveDelta) {
          onMoveDelta(vx, vy, dt);
        } else {
          if (vy < 0) onMove('up');
          else if (vy > 0) onMove('down');
          else if (vx < 0) onMove('left');
          else if (vx > 0) onMove('right');
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.repeat) return;

      // Hotkeys for Emojis
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        onSendEmoji(EMOJI_LIST[Number(e.key) - 1]);
        return;
      }

      // Hotkeys for Interaction
      if ([' ', 'Enter', 'e', 'E'].includes(e.key)) {
        e.preventDefault();
        onInteract();
        return;
      }

      // Movement Keys
      const isMoveKey = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
      if (isMoveKey) {
        e.preventDefault();
        activeKeysRef.current.add(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove, onMoveDelta, onInteract, onSendEmoji]);

  // Touch / Mobile D-Pad controls
  const handleTouchDir = (vx: number, vy: number) => {
    touchDirRef.current = { vx, vy };
  };

  const handleTouchStop = () => {
    touchDirRef.current = null;
  };

  return (
    <>
      {/* ================= FLOATING CONTEXT PROMPT (和風懸浮木札提示) ================= */}
      {contextPrompt && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce-gentle select-none font-serif">
          <button
            onClick={() => {
              sound.playDoor();
              if (onContextAction) onContextAction();
              else onInteract();
            }}
            className="px-5 py-2.5 bg-[#24130a]/95 hover:bg-[#381c0e] text-[#fef08a] font-black text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 border-2 border-[#b45309] shadow-[0_4px_24px_rgba(0,0,0,0.9)] cursor-pointer active:scale-95 transition-all"
          >
            <span className="text-base">🏮</span>
            <span className="tracking-wide drop-shadow">{contextPrompt}</span>
            <span className="text-[10px] bg-[#991b1b] text-[#fef08a] px-2 py-0.5 rounded-full ml-1 font-mono font-bold border border-[#f59e0b]">
              [ SPACE / 點我 ]
            </span>
          </button>
        </div>
      )}

      {/* ================= QUICK EMOJI CAPSULE (和風表情條) ================= */}
      <div className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-[#24130a]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-[#8b4513] shadow-[0_4px_16px_rgba(0,0,0,0.8)] select-none">
        {EMOJI_LIST.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSendEmoji(emoji)}
            className="w-7 h-7 rounded-xl bg-[#3a1d10] hover:bg-[#4d2716] active:bg-[#b91c1c] border border-[#6b3518] flex items-center justify-center text-xs transition-transform active:scale-90 cursor-pointer"
            title={`快捷鍵 ${idx + 1}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* ================= MOBILE TRANSLUCENT D-PAD (和風十字鍵) ================= */}
      <div className="fixed bottom-4 left-3 z-30 sm:hidden select-none touch-none opacity-90 hover:opacity-100 transition-opacity">
        <div className="relative w-28 h-28 bg-[#24130a]/80 backdrop-blur-md rounded-2xl border-2 border-[#8b4513] p-1 flex items-center justify-center shadow-2xl">
          {/* UP */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(0, -1); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(0, -1)}
            onMouseUp={handleTouchStop}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#3a1d10] active:bg-[#991b1b] rounded-t-lg border border-[#8b4513] flex items-center justify-center text-xs text-[#fef08a] font-bold cursor-pointer"
          >
            ▲
          </button>
          {/* DOWN */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(0, 1); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(0, 1)}
            onMouseUp={handleTouchStop}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#3a1d10] active:bg-[#991b1b] rounded-b-lg border border-[#8b4513] flex items-center justify-center text-xs text-[#fef08a] font-bold cursor-pointer"
          >
            ▼
          </button>
          {/* LEFT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(-1, 0); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(-1, 0)}
            onMouseUp={handleTouchStop}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#3a1d10] active:bg-[#991b1b] rounded-l-lg border border-[#8b4513] flex items-center justify-center text-xs text-[#fef08a] font-bold cursor-pointer"
          >
            ◀
          </button>
          {/* RIGHT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(1, 0); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(1, 0)}
            onMouseUp={handleTouchStop}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#3a1d10] active:bg-[#991b1b] rounded-r-lg border border-[#8b4513] flex items-center justify-center text-xs text-[#fef08a] font-bold cursor-pointer"
          >
            ▶
          </button>
          {/* Center Hub */}
          <div className="w-6 h-6 rounded-lg bg-[#201109] border border-[#a16207]" />
        </div>
      </div>

      {/* ================= MOBILE TRANSLUCENT ACTION BUTTON (和風朱漆互動鈕) ================= */}
      <div className="fixed bottom-5 right-3 z-30 sm:hidden select-none touch-none opacity-90 hover:opacity-100 transition-opacity font-serif">
        <button
          onClick={() => {
            sound.playClick();
            onInteract();
          }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b91c1c] to-[#7f1d1d] active:scale-95 border-2 border-[#fef08a] shadow-[0_4px_16px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-[#fef08a] font-black cursor-pointer"
        >
          <span className="text-base drop-shadow">調</span>
          <span className="text-[9px] -mt-1 font-bold tracking-widest">互動</span>
        </button>
      </div>
    </>
  );
};
