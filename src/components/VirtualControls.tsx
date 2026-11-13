import React, { useEffect, useRef } from 'react';
import { sound } from '../services/audio';

interface VirtualControlsProps {
  onMove: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onInteract: () => void;
  onSendEmoji: (emoji: string) => void;
  contextPrompt?: string | null;
  onContextAction?: () => void;
}

export const EMOJI_LIST = ['❤️', '😂', '🎉', '💬', '⚡'];

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onMove,
  onInteract,
  onSendEmoji,
  contextPrompt,
  onContextAction,
}) => {
  const activeKeysRef = useRef<Set<string>>(new Set());
  const loopTimerRef = useRef<number | null>(null);
  const touchIntervalRef = useRef<number | null>(null);

  // High-performance continuous game loop for keyboard (0ms latency, zero stutter)
  useEffect(() => {
    const tick = () => {
      const keys = activeKeysRef.current;
      if (keys.has('KeyW') || keys.has('ArrowUp')) onMove('up');
      else if (keys.has('KeyS') || keys.has('ArrowDown')) onMove('down');
      else if (keys.has('KeyA') || keys.has('ArrowLeft')) onMove('left');
      else if (keys.has('KeyD') || keys.has('ArrowRight')) onMove('right');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Ignore OS automatic repeat to maintain buttery smooth game loop
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

      // Movement Keys (WASD & Arrows)
      const isMoveKey = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code);
      if (isMoveKey) {
        e.preventDefault();
        const wasEmpty = activeKeysRef.current.size === 0;
        activeKeysRef.current.add(e.code);

        // Instant step on first key press
        if (wasEmpty) {
          if (e.code === 'KeyW' || e.code === 'ArrowUp') onMove('up');
          else if (e.code === 'KeyS' || e.code === 'ArrowDown') onMove('down');
          else if (e.code === 'KeyA' || e.code === 'ArrowLeft') onMove('left');
          else if (e.code === 'KeyD' || e.code === 'ArrowRight') onMove('right');
        }

        // Start continuous walking interval (130ms per tile for buttery smooth speed)
        if (loopTimerRef.current === null) {
          loopTimerRef.current = window.setInterval(tick, 130);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current.delete(e.code);
      if (activeKeysRef.current.size === 0 && loopTimerRef.current !== null) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (loopTimerRef.current !== null) clearInterval(loopTimerRef.current);
    };
  }, [onMove, onInteract, onSendEmoji]);

  // Touch / Mobile D-Pad Continuous loop
  const startTouchMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    onMove(dir);
    if (touchIntervalRef.current) clearInterval(touchIntervalRef.current);
    touchIntervalRef.current = window.setInterval(() => {
      onMove(dir);
    }, 130);
  };

  const stopTouchMove = () => {
    if (touchIntervalRef.current) {
      clearInterval(touchIntervalRef.current);
      touchIntervalRef.current = null;
    }
  };

  return (
    <>
      {/* ================= ELEGANT FLOATING CONTEXT PROMPT ================= */}
      {contextPrompt && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce-gentle">
          <button
            onClick={() => {
              sound.playDoor();
              if (onContextAction) onContextAction();
              else onInteract();
            }}
            className="pixel-btn px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-full flex items-center gap-2 border-2 border-black shadow-pixel-lg"
          >
            <span>✨</span>
            <span>{contextPrompt}</span>
            <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded-full ml-1">
              [SPACE / 點我]
            </span>
          </button>
        </div>
      )}

      {/* ================= MINIMALIST QUICK EMOJI CAPSULE ================= */}
      <div className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-xs px-2 py-1 rounded-full border border-slate-700/60 shadow-pixel-sm">
        {EMOJI_LIST.map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => onSendEmoji(emoji)}
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-xs transition-transform active:scale-90"
            title={`快捷鍵 ${idx + 1}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* ================= MOBILE TRANSLUCENT D-PAD (BOTTOM-LEFT) ================= */}
      <div className="fixed bottom-4 left-3 z-30 sm:hidden select-none touch-none opacity-85 hover:opacity-100 transition-opacity">
        <div className="relative w-28 h-28 bg-slate-950/40 backdrop-blur-xs rounded-full border border-slate-600/60 p-1 flex items-center justify-center">
          {/* UP */}
          <button
            onTouchStart={(e) => { e.preventDefault(); startTouchMove('up'); }}
            onTouchEnd={stopTouchMove}
            onMouseDown={() => startTouchMove('up')}
            onMouseUp={stopTouchMove}
            className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-800/70 active:bg-amber-500 rounded-t border border-slate-600/80 flex items-center justify-center text-xs text-slate-200"
          >
            ▲
          </button>
          {/* DOWN */}
          <button
            onTouchStart={(e) => { e.preventDefault(); startTouchMove('down'); }}
            onTouchEnd={stopTouchMove}
            onMouseDown={() => startTouchMove('down')}
            onMouseUp={stopTouchMove}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-800/70 active:bg-amber-500 rounded-b border border-slate-600/80 flex items-center justify-center text-xs text-slate-200"
          >
            ▼
          </button>
          {/* LEFT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); startTouchMove('left'); }}
            onTouchEnd={stopTouchMove}
            onMouseDown={() => startTouchMove('left')}
            onMouseUp={stopTouchMove}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800/70 active:bg-amber-500 rounded-l border border-slate-600/80 flex items-center justify-center text-xs text-slate-200"
          >
            ◀
          </button>
          {/* RIGHT */}
          <button
            onTouchStart={(e) => { e.preventDefault(); startTouchMove('right'); }}
            onTouchEnd={stopTouchMove}
            onMouseDown={() => startTouchMove('right')}
            onMouseUp={stopTouchMove}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800/70 active:bg-amber-500 rounded-r border border-slate-600/80 flex items-center justify-center text-xs text-slate-200"
          >
            ▶
          </button>
          {/* Center Hub */}
          <div className="w-6 h-6 rounded-full bg-slate-900/60 border border-slate-700" />
        </div>
      </div>

      {/* ================= MOBILE TRANSLUCENT ACTION BUTTON (BOTTOM-RIGHT) ================= */}
      <div className="fixed bottom-5 right-3 z-30 sm:hidden select-none touch-none opacity-85 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            sound.playClick();
            onInteract();
          }}
          className="w-14 h-14 rounded-full bg-rose-600/80 active:bg-rose-500 border-2 border-rose-400 shadow-pixel flex flex-col items-center justify-center text-white font-bold"
        >
          <span className="text-sm font-arcade">A</span>
          <span className="text-[8px]">互動</span>
        </button>
      </div>
    </>
  );
};
