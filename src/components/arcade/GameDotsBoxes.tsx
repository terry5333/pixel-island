import React from 'react';
import { ArcadeRoom, UserProfile } from '../../types/game';
import { Grid, Sparkles, Trophy } from 'lucide-react';

interface GameDotsBoxesProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
}

export const GameDotsBoxes: React.FC<GameDotsBoxesProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#1a102f] text-xs">
      <div className="w-16 h-16 rounded-2xl bg-fuchsia-950/80 border-2 border-fuchsia-500/60 flex items-center justify-center text-fuchsia-400 mb-3 shadow-pixel animate-pulse">
        <Grid className="w-8 h-8" />
      </div>

      <h3 className="font-arcade text-base text-fuchsia-400 mb-2">
        點線棋 (DOTS AND BOXES) - 5x5 領地佔領戰
      </h3>

      <p className="text-slate-300 max-w-md leading-relaxed mb-4">
        雙方輪流點擊相鄰兩點之間的虛線將其連起，畫下第 4 條邊封閉方格的玩家將獲得該格領地與連續回合獎勵，
        全數畫完後佔領格數最多者獲勝！
      </p>

      <div className="p-4 bg-slate-900/90 border-2 border-dashed border-fuchsia-700/60 rounded-xl max-w-sm w-full mb-4">
        <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold mb-2">
          <Sparkles className="w-4 h-4" />
          <span>核心架構與分頁接口已就緒</span>
        </div>
        <p className="text-[11px] text-slate-400">
          此遊戲模組已完成底層通訊架構，第一階段優先交付 1A2B 與三子無限 OOXX，本點陣棋盤將於下一階段無縫啟用！
        </p>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-fuchsia-300/80 bg-fuchsia-950/40 px-3 py-1.5 rounded-full border border-fuchsia-800">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span>雙人對戰房間已就緒，可隨時切換至 1A2B 或 OOXX 開始暢玩</span>
      </div>
    </div>
  );
};
