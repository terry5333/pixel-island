import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../services/audio';
import { Coins, Sparkles, Trophy, HelpCircle } from 'lucide-react';

interface GameSlotMachineProps {
  currentUid: string;
  userCoins: number;
  onRewardCoins: (amount: number) => Promise<void>;
  onDeductCoins: (amount: number) => Promise<void>;
}

const SYMBOLS = [
  { id: 'seven', label: '7', color: '#ef4444', payout3: 50, payout2: 2 },
  { id: 'bar', label: 'BAR', color: '#3b82f6', payout3: 30, payout2: 2 },
  { id: 'diamond', label: '💎', color: '#06b6d4', payout3: 20, payout2: 2 },
  { id: 'star', label: '⭐', color: '#facc15', payout3: 15, payout2: 1.5 },
  { id: 'bell', label: '🔔', color: '#eab308', payout3: 10, payout2: 1.5 },
  { id: 'cherry', label: '🍒', color: '#f43f5e', payout3: 5, payout2: 1 },
];

export const GameSlotMachine: React.FC<GameSlotMachineProps> = ({
  currentUid,
  userCoins,
  onRewardCoins,
  onDeductCoins,
}) => {
  const [betAmount, setBetAmount] = useState<number>(20);
  const [reel1, setReel1] = useState(0); // Index in SYMBOLS
  const [reel2, setReel2] = useState(0);
  const [reel3, setReel3] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [beaconFlash, setBeaconFlash] = useState(false);

  const spinIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const handlePullLever = async () => {
    if (isSpinning) return;
    if (userCoins < betAmount) {
      sound.playBump();
      setWinMessage('金幣不足，請調整投注金幣！');
      return;
    }

    // Deduct bet
    await onDeductCoins(betAmount);
    sound.playClick();
    setWinMessage(null);
    setBeaconFlash(false);
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 300);

    setIsSpinning(true);

    // Rapid reel cycle animation
    let counter = 0;
    spinIntervalRef.current = window.setInterval(() => {
      counter++;
      setReel1((prev) => (prev + 1) % SYMBOLS.length);
      setReel2((prev) => (prev + 2) % SYMBOLS.length);
      setReel3((prev) => (prev + 3) % SYMBOLS.length);
      if (counter % 2 === 0) sound.playSlotSpin();
    }, 70);

    // Stop Reel 1 after 1.2s
    setTimeout(() => {
      const final1 = Math.floor(Math.random() * SYMBOLS.length);
      setReel1(final1);
      sound.playClick();
    }, 1200);

    // Stop Reel 2 after 1.8s
    setTimeout(() => {
      const final2 = Math.random() < 0.35 ? reel1 : Math.floor(Math.random() * SYMBOLS.length);
      setReel2(final2);
      sound.playClick();
    }, 1800);

    // Stop Reel 3 after 2.4s and calculate win
    setTimeout(async () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);

      // Controlled odds: 25% chance of matching reel1 for a big payout!
      let final3: number;
      if (Math.random() < 0.28) {
        final3 = reel1;
      } else {
        final3 = Math.floor(Math.random() * SYMBOLS.length);
      }
      setReel3(final3);
      setIsSpinning(false);

      const sym1 = SYMBOLS[reel1];
      const sym2 = SYMBOLS[reel2];
      const sym3 = SYMBOLS[final3];

      if (sym1.id === sym2.id && sym2.id === sym3.id) {
        // JACKPOT!
        const win = betAmount * sym1.payout3;
        sound.playSlotJackpot();
        setBeaconFlash(true);
        setWinMessage(`🎉 大獎 JACKPOT！三連【${sym1.label}】贏得 ${win} 金幣！`);
        await onRewardCoins(win);
      } else if (sym1.id === sym2.id || sym2.id === sym3.id || sym1.id === sym3.id) {
        // Pair match
        const matchedSym = sym1.id === sym2.id ? sym1 : sym3;
        const win = Math.floor(betAmount * matchedSym.payout2);
        sound.playCoin();
        setBeaconFlash(true);
        setWinMessage(`✨ 恭喜中獎！雙連【${matchedSym.label}】贏得 ${win} 金幣！`);
        await onRewardCoins(win);
      } else {
        sound.playBump();
        setWinMessage('再接再厲！拉動搖桿拚大獎！');
      }
    }, 2400);
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      {/* ================= 16-BIT RETRO SLOT MACHINE CABINET (Ref: media_1794590271141_fa50a12a.jpg) ================= */}
      <div className="relative w-80 sm:w-96 flex flex-col items-center">
        {/* Top Flashing Red Siren / Beacon */}
        <div className="relative flex flex-col items-center z-10 -mb-2">
          <div
            className={`w-12 h-10 rounded-t-xl border-3 border-slate-950 transition-all duration-150 ${
              beaconFlash
                ? 'bg-rose-500 shadow-[0_0_25px_#f43f5e] scale-110'
                : 'bg-rose-900 shadow-sm'
            }`}
          >
            <div className="w-full h-2 bg-white/40 rounded-t-lg" />
            <div className="w-2 h-4 bg-white/60 mx-auto mt-1 rounded-full" />
          </div>
          <div className="w-16 h-2 bg-slate-900 border-2 border-slate-950" />
        </div>

        {/* Main Cabinet Housing (Showa Lacquer Wood & Brass Frame) */}
        <div className="w-full bg-[#241108] border-4 border-[#8b4513] rounded-2xl shadow-2xl p-4 flex flex-col items-center relative overflow-hidden font-serif">
          {/* Header Marquee Sign */}
          <div className="w-full py-2 bg-[#150a04] rounded-xl border-2 border-amber-400/80 mb-3 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 animate-pulse" />
            <span className="text-sm sm:text-base text-amber-400 font-bold tracking-wider flex items-center gap-2 drop-shadow-md">
              <span>★</span> 銭屋特製 777 昭和スロット <span>★</span>
            </span>
          </div>

          {/* Reel Display Bezel Window */}
          <div className="w-full bg-slate-900 border-4 border-slate-950 rounded-xl p-3 flex flex-col items-center shadow-inner relative">
            {/* Top Reel Frame Inset */}
            <div className="w-full h-2 bg-slate-950 rounded-t mb-1 opacity-70" />

            {/* The 3 Mechanical Reels */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {[reel1, reel2, reel3].map((rIdx, idx) => {
                const sym = SYMBOLS[rIdx];
                return (
                  <div
                    key={idx}
                    className="h-28 sm:h-32 bg-white rounded-lg border-3 border-slate-950 flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
                  >
                    {/* Shadow at top and bottom of cylindrical reel */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-400/80 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-400/80 to-transparent pointer-events-none" />

                    {/* Red Center Payline Guide */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-rose-500/40 pointer-events-none" />

                    {/* Symbol Display */}
                    <div
                      className={`text-3xl sm:text-4xl font-black transition-transform duration-75 select-none ${
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

            {/* Bottom Reel Frame Inset */}
            <div className="w-full h-2 bg-slate-950 rounded-b mt-1 opacity-70" />
          </div>

          {/* Interactive Mechanical Pull Lever (Mounted on the right side) */}
          <div
            onClick={handlePullLever}
            className="absolute -right-3 top-28 sm:top-32 cursor-pointer z-30 group"
            title="拉動搖桿開始下注！"
          >
            {/* Lever Base */}
            <div className="w-5 h-12 bg-slate-950 rounded-r-lg border-2 border-slate-800 flex items-center justify-center">
              {/* Lever Shaft */}
              <div
                className={`w-3 bg-slate-300 border-2 border-slate-950 rounded origin-bottom transition-transform duration-200 ${
                  leverPulled ? 'h-10 rotate-45' : 'h-18 group-hover:-rotate-6'
                }`}
              >
                {/* Red Ball Handle */}
                <div className="w-7 h-7 -top-4 -left-2 absolute bg-rose-600 rounded-full border-2 border-slate-950 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-white/60 -top-0.5 left-1 absolute" />
                </div>
              </div>
            </div>
          </div>

          {/* Result & Feedback Message */}
          <div className="w-full mt-3 min-h-[32px] flex items-center justify-center">
            {winMessage && (
              <div className="text-xs sm:text-sm font-bold text-amber-300 text-center animate-fade-in bg-slate-950/80 px-3 py-1 rounded-full border border-amber-400/40 shadow">
                {winMessage}
              </div>
            )}
          </div>

          {/* Bottom Coin Hopper Payout Tray */}
          <div className="w-full mt-2 bg-[#150a04] border-2 border-[#8b4513] rounded-xl p-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#fed7aa]">
              <span>錢包：</span>
              <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                {userCoins.toLocaleString()}
              </span>
            </div>

            {/* Bet Selector */}
            <div className="flex items-center gap-1">
              {[10, 20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    sound.playClick();
                    setBetAmount(amt);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    betAmount === amt
                      ? 'bg-[#991b1b] text-[#fef08a] border-[#f59e0b] shadow'
                      : 'bg-[#2a140a] text-[#fed7aa] border-[#78350f] hover:bg-[#381a0d]'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Spin Action Button (For Mobile convenience) */}
          <button
            onClick={handlePullLever}
            disabled={isSpinning}
            className={`w-full mt-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${
              isSpinning
                ? 'bg-[#2a140a] text-[#78350f] border-[#78350f] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#d97706] hover:to-[#f59e0b] text-[#fef08a] border-[#fde047] shadow-amber-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSpinning ? '轉動中...' : `拉動搖桿 / 下注 (${betAmount} 金幣)`}</span>
          </button>
        </div>
      </div>

      {/* Paytable Guide Capsule */}
      <div className="mt-4 w-full max-w-sm p-3 bg-[#1c0d06] border-2 border-[#8b4513] rounded-xl text-[11px] text-[#fed7aa] font-serif">
        <div className="font-bold text-amber-400 mb-1.5 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>中獎賠率表：</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div>7 7 7：<span className="text-amber-300 font-bold">50 倍</span></div>
          <div>BAR BAR BAR：<span className="text-amber-300 font-bold">30 倍</span></div>
          <div>💎 💎 💎：<span className="text-cyan-300 font-bold">20 倍</span></div>
          <div>⭐ ⭐ ⭐：<span className="text-yellow-300 font-bold">15 倍</span></div>
          <div>🔔 🔔 🔔：<span className="text-yellow-300 font-bold">10 倍</span></div>
          <div>任意兩顆相同：<span className="text-emerald-300 font-bold">1 ~ 2 倍</span></div>
        </div>
      </div>
    </div>
  );
};
