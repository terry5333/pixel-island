import React from 'react';
import { UserProfile } from '../types/game';
import { sound } from '../services/audio';
import { GameSlotMachine } from './arcade/GameSlotMachine';
import { X, Sparkles, Coins, Trophy, Dices } from 'lucide-react';

interface CasinoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onRewardCoins: (amount: number) => Promise<void>;
  onDeductCoins: (amount: number) => Promise<void>;
}

export const CasinoModal: React.FC<CasinoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRewardCoins,
  onDeductCoins,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Light-themed Modern Retro Casino Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white drop-shadow-xs">
                  CASINO 777 復古拉霸娛樂城
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-amber-950 font-bold uppercase tracking-wider">
                  Jackpot 50x
                </span>
              </div>
              <p className="text-[11px] text-amber-100 font-medium">拉動機械搖桿，拚中三連 777 贏取巨額彩金！</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Player Coins Capsule */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 rounded-full text-slate-800 font-mono font-bold text-xs shadow-sm">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{Math.max(0, currentUser.coins).toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Casino Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70 flex flex-col items-center">
          <div className="w-full max-w-lg bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-md">
            <GameSlotMachine
              currentUid={currentUser.uid}
              userCoins={Math.max(0, currentUser.coins)}
              onRewardCoins={onRewardCoins}
              onDeductCoins={onDeductCoins}
            />
          </div>

          {/* Bottom Security Fair Play Disclaimer */}
          <div className="mt-4 text-center text-xs text-slate-400 flex items-center gap-2 justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>島嶼娛樂城經官方合規認證・金幣不可為負數・祝您幸運連連！</span>
          </div>
        </div>
      </div>
    </div>
  );
};
