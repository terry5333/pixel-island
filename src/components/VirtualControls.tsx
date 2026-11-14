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
      {/* ================= FLOATING CONTEXT PROMPT (Clean Light Modern Style) ================= */}
      {contextPrompt && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce-gentle select-none font-sans">
          <button
            onClick={() => {
              sound.playDoor();
              if (onContextAction) onContextAction();
              else onInteract();
            }}
            className="px-5 py-2.5 bg-white/95 hover:bg-slate-50 text-slate-900 font-black text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 border-2 border-indigo-600 shadow-2xl cursor-pointer active:scale-95 transition-all"
          >
            <span className="text-base">🏮</span>
            <span className="tracking-wide">{contextPrompt}</span>
            <span className="text-[10px] bg-indigo-600 text-white px-2.5 py-0.5 rounded-full ml-1 font-mono font-bold shadow-xs">
              [ SPACE / 點我 ]
            </span>
          </button>
        </div>
      )}

      {/* ================= QUICK EMOJI CAPSULE (Clean Light Style) ================= */}
      <div className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-lg select-none">
        {EMOJI_LIST.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSendEmoji(emoji)}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-indigo-600 border border-slate-200 flex items-center justify-center text-xs transition-transform active:scale-90 cursor-pointer"
            title={`快捷鍵 ${idx + 1}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* ================= MOBILE TRANSLUCENT D-PAD (Clean Light Style) ================= */}
      <div className="fixed bottom-4 left-3 z-30 sm:hidden select-none touch-none opacity-90 hover:opacity-100 transition-opacity">
        <div className="relative w-28 h-28 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200 p-1 flex items-center justify-center shadow-xl">
          {/* UP */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(0, -1); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(0, -1)}
            onMouseUp={handleTouchStop}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-100 active:bg-indigo-600 rounded-t-lg border border-slate-200 flex items-center justify-center text-xs text-slate-700 active:text-white font-bold cursor-pointer"
          >
            ▲
          </button>
          {/* DOWN */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(0, 1); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(0, 1)}
            onMouseUp={handleTouchStop}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-100 active:bg-indigo-600 rounded-b-lg border border-slate-200 flex items-center justify-center text-xs text-slate-700 active:text-white font-bold cursor-pointer"
          >
            ▼
          </button>
          {/* LEFT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(-1, 0); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(-1, 0)}
            onMouseUp={handleTouchStop}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 active:bg-indigo-600 rounded-l-lg border border-slate-200 flex items-center justify-center text-xs text-slate-700 active:text-white font-bold cursor-pointer"
          >
            ◀
          </button>
          {/* RIGHT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchDir(1, 0); }}
            onTouchEnd={handleTouchStop}
            onMouseDown={() => handleTouchDir(1, 0)}
            onMouseUp={handleTouchStop}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-100 active:bg-indigo-600 rounded-r-lg border border-slate-200 flex items-center justify-center text-xs text-slate-700 active:text-white font-bold cursor-pointer"
          >
            ▶
          </button>
          {/* Center Hub */}
          <div className="w-6 h-6 rounded-lg bg-slate-200/60 border border-slate-300" />
        </div>
      </div>

      {/* ================= MOBILE ACTION BUTTON ================= */}
      <div className="fixed bottom-5 right-3 z-30 sm:hidden select-none touch-none opacity-90 hover:opacity-100 transition-opacity font-sans">
        <button
          onClick={() => {
            sound.playClick();
            onInteract();
          }}
          className="w-14 h-14 rounded-2xl bg-indigo-600 active:scale-95 border-2 border-white shadow-xl flex flex-col items-center justify-center text-white font-bold cursor-pointer"
        >
          <span className="text-base leading-none">✨</span>
          <span className="text-[10px] mt-0.5 tracking-wider">互動</span>
        </button>
      </div>
    </>
  );
};
