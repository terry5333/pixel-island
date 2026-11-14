import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/audio';
import { Coins, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameSlotMachineProps {
  currentUid: string;
  userCoins: number;
  onRewardCoins: (amount: number) => Promise<void>;
  onDeductCoins: (amount: number) => Promise<void>;
}

const SYMBOLS = [
  { id: 'seven', label: '7', color: '#C62828', payout3: 50, payout2: 2 },
  { id: 'bar', label: 'BAR', color: '#1A237E', payout3: 30, payout2: 2 },
  { id: 'diamond', label: '💎', color: '#00695C', payout3: 20, payout2: 2 },
  { id: 'star', label: '⭐', color: '#F57F17', payout3: 15, payout2: 1.5 },
  { id: 'bell', label: '🔔', color: '#E65100', payout3: 10, payout2: 1.5 },
  { id: 'cherry', label: '🍒', color: '#AD1457', payout3: 5, payout2: 1 },
];

export const GameSlotMachine: React.FC<GameSlotMachineProps> = ({
  userCoins,
  onRewardCoins,
  onDeductCoins,
}) => {
  const [betAmount, setBetAmount] = useState<number>(20);
  const [reel1, setReel1] = useState(0);
  const [reel2, setReel2] = useState(0);
  const [reel3, setReel3] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [jackpotWon, setJackpotWon] = useState(false);

  const spinIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const handlePullLever = async () => {
    if (isSpinning) return;
    if (userCoins < betAmount || userCoins <= 0) {
      sound.playBump();
      setWinMessage('所持金幣不足，請調整投注額！');
      return;
    }

    const safeDeduct = Math.min(userCoins, betAmount);
    await onDeductCoins(safeDeduct);
    sound.playClick();
    setWinMessage(null);
    setJackpotWon(false);
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 300);

    setIsSpinning(true);

    const startTime = Date.now();
    spinIntervalRef.current = window.setInterval(() => {
      setReel1(Math.floor(Math.random() * SYMBOLS.length));
      setReel2(Math.floor(Math.random() * SYMBOLS.length));
      setReel3(Math.floor(Math.random() * SYMBOLS.length));
    }, 70);

    setTimeout(async () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      setIsSpinning(false);

      // Determine outcomes with realistic retro slot weights
      const roll = Math.random();
      let r1 = Math.floor(Math.random() * SYMBOLS.length);
      let r2 = Math.floor(Math.random() * SYMBOLS.length);
      let r3 = Math.floor(Math.random() * SYMBOLS.length);

      if (roll < 0.08) {
        // 8% Jackpot 777!
        r1 = 0; r2 = 0; r3 = 0;
      } else if (roll < 0.28) {
        // 20% Triple Match
        const matchIdx = Math.floor(Math.random() * SYMBOLS.length);
        r1 = matchIdx; r2 = matchIdx; r3 = matchIdx;
      } else if (roll < 0.55) {
        // 27% Double Match
        const matchIdx = Math.floor(Math.random() * SYMBOLS.length);
        r1 = matchIdx; r2 = matchIdx;
        r3 = (matchIdx + 1 + Math.floor(Math.random() * (SYMBOLS.length - 1))) % SYMBOLS.length;
      }

      setReel1(r1);
      setReel2(r2);
      setReel3(r3);

      const sym1 = SYMBOLS[r1];
      const sym2 = SYMBOLS[r2];
      const sym3 = SYMBOLS[r3];

      if (r1 === r2 && r2 === r3) {
        // Triple Match!
        const win = betAmount * sym1.payout3;
        await onRewardCoins(win);
        sound.playWin();
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        setJackpotWon(true);
        setWinMessage(`🎉 大當標！三連【${sym1.label}】！榮獲 ${win} 金幣！`);
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        // Double Match
        const matchedSym = r1 === r2 ? sym1 : r2 === r3 ? sym2 : sym1;
        const win = Math.floor(betAmount * matchedSym.payout2);
        await onRewardCoins(win);
        sound.playBuy();
        setWinMessage(`✨ 雙連命中！獲贈 ${win} 金幣！`);
      } else {
        sound.playBump();
        setWinMessage('再接再厲！拉動搖桿拚大獎！');
      }
    }, 2200);
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-5 select-none w-full bg-[#F7F3E9] text-[#2D1E18] font-serif">
      {/* 1. Header Masthead with Double Border & Noto Serif Typography */}
      <div className="w-full max-w-lg mb-4 text-center">
        <div className="text-[10px] sm:text-xs text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
          - SHOWA RETRO MECHANICAL SLOT MACHINE -
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-[#2D1E18] border-b-4 border-double border-[#5D4037] pb-2">
          777 昭和機械式拉霸機
        </h2>
      </div>

      {/* Main Machine Housing */}
      <div className="relative w-80 sm:w-96 flex flex-col items-center bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] p-5">
        {/* Vermilion Stamp on Jackpot */}
        {jackpotWon && (
          <div className="absolute top-2 right-2 pointer-events-none z-30">
            <div
              className="w-22 h-22 rounded-full border-4 border-double border-[#C62828] flex flex-col items-center justify-center text-[#C62828] font-black tracking-widest animate-stamp"
              style={{ transform: 'rotate(-12deg)' }}
            >
              <span className="text-[9px] border-b border-[#C62828] pb-0.5">昭和遊技所</span>
              <span className="text-base">大 當 標</span>
            </div>
          </div>
        )}

        {/* Machine Marquee */}
        <div className="w-full py-2 bg-[#F7F3E9] border-2 border-[#5D4037] mb-4 text-center shadow-[3px_3px_0px_#5D4037]">
          <span className="text-xs sm:text-sm font-black tracking-[0.2em] text-[#5D4037]">
            ★ 昭和拾年・機械遊技特獎機 ★
          </span>
        </div>

        {/* The 3 Mechanical Reels */}
        <div className="grid grid-cols-3 gap-3 w-full p-3 bg-[#F7F3E9] border-2 border-dashed border-[#5D4037]">
          {[reel1, reel2, reel3].map((rIdx, idx) => {
            const sym = SYMBOLS[rIdx];
            return (
              <div
                key={idx}
                className="h-28 sm:h-32 bg-[#FFFDF9] border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex flex-col items-center justify-center relative overflow-hidden"
              >
                {/* Center Payline Guide */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-[#C62828]/30 pointer-events-none" />

                {/* Symbol Display */}
                <div
                  className={`text-4xl sm:text-5xl font-black transition-transform duration-75 select-none tracking-tight ${
                    isSpinning ? 'blur-xs scale-90' : 'scale-100'
                  }`}
                  style={{ color: sym.color }}
                >
                  {sym.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Mechanical Pull Lever */}
        <div
          onClick={handlePullLever}
          className="absolute -right-5 top-28 sm:top-32 cursor-pointer z-30 group"
          title="拉動搖桿開始下注！"
        >
          <div className="w-6 h-14 bg-[#5D4037] border-2 border-[#2D1E18] flex items-center justify-center shadow-[3px_3px_0px_#2D1E18]">
            <div
              className={`w-3.5 bg-[#D7CCC8] border-2 border-[#5D4037] origin-bottom transition-transform duration-200 ${
                leverPulled ? 'h-10 rotate-45' : 'h-20 group-hover:-rotate-6'
              }`}
            >
              <div className="w-8 h-8 -top-5 -left-2.5 absolute bg-[#C62828] rounded-full border-2 border-[#2D1E18] shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-2.5 h-2.5 rounded-full bg-white/60 -top-0.5 left-1 absolute" />
              </div>
            </div>
          </div>
        </div>

        {/* Win / Result Notice */}
        <div className="w-full mt-3 min-h-[32px] flex items-center justify-center">
          {winMessage && (
            <div className="text-xs sm:text-sm font-black text-[#C62828] text-center border-2 border-dashed border-[#C62828] bg-red-50 px-3 py-1">
              {winMessage}
            </div>
          )}
        </div>

        {/* Coin Balance & Bet Selectors */}
        <div className="w-full mt-3 border-t-2 border-double border-[#5D4037] pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#8D6E63]">受驗生所持金幣：</span>
            <span className="font-black text-[#2D1E18] font-mono flex items-center gap-1 text-sm">
              <Coins className="w-4 h-4 text-[#C62828]" />
              {Math.max(0, userCoins).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8D6E63] font-bold">投入代幣：</span>
            <div className="flex items-center gap-1.5">
              {[10, 20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    sound.playClick();
                    setBetAmount(amt);
                  }}
                  className={`px-2.5 py-1 text-xs font-black border-2 transition-all cursor-pointer ${
                    betAmount === amt
                      ? 'bg-[#5D4037] text-[#FFFDF9] border-[#2D1E18] shadow-[2px_2px_0px_#2D1E18]'
                      : 'bg-[#FFFDF9] text-[#5D4037] border-[#5D4037] hover:bg-[#EFEBE4]'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Physical Press Button */}
        <button
          onClick={handlePullLever}
          disabled={isSpinning || userCoins < betAmount}
          className={`w-full mt-4 py-3 font-black text-xs sm:text-sm tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isSpinning || userCoins < betAmount
              ? 'bg-[#EFEBE4] text-[#A1887F] cursor-not-allowed'
              : 'bg-[#C62828] hover:bg-[#B71C1C] text-[#FFFDF9]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSpinning ? '滾輪旋轉中...' : `拉動搖桿・投注 (${betAmount} 金幣)`}</span>
        </button>
      </div>

      {/* Paytable Guide Card */}
      <div className="mt-4 w-full max-w-sm p-4 bg-[#FFFDF9] border-2 border-dashed border-[#5D4037] shadow-[4px_4px_0px_#5D4037] text-xs">
        <div className="font-black text-[#2D1E18] mb-2 flex items-center gap-1.5 border-b-2 border-double border-[#5D4037] pb-1">
          <Trophy className="w-4 h-4 text-[#C62828]" />
          <span>昭和特賞中獎倍率規約：</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[#5D4037] font-bold">
          <div className="flex justify-between"><span>7 7 7：</span><span className="text-[#C62828] font-black">50 倍</span></div>
          <div className="flex justify-between"><span>BAR×3：</span><span className="text-[#1A237E] font-black">30 倍</span></div>
          <div className="flex justify-between"><span>💎×3：</span><span className="text-[#00695C] font-black">20 倍</span></div>
          <div className="flex justify-between"><span>⭐×3：</span><span className="text-[#F57F17] font-black">15 倍</span></div>
          <div className="flex justify-between"><span>🔔×3：</span><span className="text-[#E65100] font-black">10 倍</span></div>
          <div className="flex justify-between"><span>任意雙連：</span><span className="text-[#2E7D32] font-black">1~2 倍</span></div>
        </div>
      </div>
    </div>
  );
};
