import React from 'react';
import { ArcadeRoom, UserProfile } from '../../types/game';
import { Anchor, ShieldAlert, Sparkles } from 'lucide-react';

interface GameBattleshipProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
}

export const GameBattleship: React.FC<GameBattleshipProps> = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-[#0d1b2a] text-xs">
      <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border-2 border-cyan-500/60 flex items-center justify-center text-cyan-400 mb-3 shadow-pixel animate-pulse">
        <Anchor className="w-8 h-8" />
      </div>

      <h3 className="font-arcade text-base text-cyan-400 mb-2">
        海戰棋 (BATTLESHIP) - 8x8 海域爭霸
      </h3>

      <p className="text-slate-300 max-w-md leading-relaxed mb-4">
        第一階段雙方佈署 4 艘不同長度的軍艦（長度 2, 3, 3, 4，支援旋轉方向），
        第二階段輪流向對手未知海域發射砲彈，先擊沉敵方全數艦隊者獲勝！
      </p>

      <div className="p-4 bg-slate-900/90 border-2 border-dashed border-cyan-700/60 rounded-xl max-w-sm w-full mb-4">
        <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold mb-2">
          <Sparkles className="w-4 h-4" />
          <span>核心架構與分頁接口已就緒</span>
        </div>
        <p className="text-[11px] text-slate-400">
          此遊戲模組已完成底層通訊架構，第一階段優先交付 1A2B 與三子無限 OOXX，本海域棋盤將於下一階段無縫啟用！
        </p>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-cyan-300/80 bg-cyan-950/40 px-3 py-1.5 rounded-full border border-cyan-800">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>雙人對戰房間已就緒，可隨時切換至 1A2B 或 OOXX 開始暢玩</span>
      </div>
    </div>
  );
};
