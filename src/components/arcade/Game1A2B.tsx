import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArcadeRoom, Game1A2BState, GuessRecord, UserProfile } from '../../types/game';
import { sound } from '../../services/audio';
import { dbService } from '../../services/dbService';
import { Trophy, RefreshCw, Delete, Check, HelpCircle } from 'lucide-react';

interface Game1A2BProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
  onUpdateRoom: (updates: Partial<ArcadeRoom>) => Promise<void>;
  onRewardCoins: (amount: number) => Promise<void>;
}

export function calculateAB(secret: string, guess: string): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) {
      a++;
    } else if (secret.includes(guess[i])) {
      b++;
    }
  }
  return { a, b };
}

export function generateRandomSecret(): string {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const shuffled = digits.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4).join('');
}

export const Game1A2B: React.FC<Game1A2BProps> = ({
  room,
  currentUser,
  onUpdateRoom,
  onRewardCoins,
}) => {
  const isHost = room.hostUid === currentUser.uid;
  const isAiMode = room.mode === 'ai';

  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const state1a2b: Game1A2BState = room.state1a2b || {
    hostGuesses: [],
    guestGuesses: [],
  };

  const mySecret = isHost ? state1a2b.hostSecret : state1a2b.guestSecret;
  const opponentSecret = isHost ? state1a2b.guestSecret : state1a2b.hostSecret;

  const isSetupPhase = !mySecret || (!isAiMode && !opponentSecret);
  const myGuesses = isHost ? state1a2b.hostGuesses : state1a2b.guestGuesses;
  const opponentGuesses = isHost ? state1a2b.guestGuesses : state1a2b.hostGuesses;

  const isMyTurn = room.status === 'playing' && room.currentTurn === currentUser.uid;

  // Handle secret setting in setup phase
  const handleSetSecret = async () => {
    if (inputCode.length !== 4) {
      setErrorMessage('請輸入 4 位不重複數字！');
      sound.playBump();
      return;
    }
    const uniqueDigits = new Set(inputCode.split(''));
    if (uniqueDigits.size !== 4) {
      setErrorMessage('4 位數字不可重複！');
      sound.playBump();
      return;
    }

    setErrorMessage(null);
    sound.playClick();

    if (isAiMode) {
      const aiSecret = generateRandomSecret();
      const updatedState: Game1A2BState = {
        hostSecret: inputCode,
        guestSecret: aiSecret,
        hostGuesses: [],
        guestGuesses: [],
      };
      await onUpdateRoom({
        status: 'playing',
        currentTurn: currentUser.uid,
        state1a2b: updatedState,
      });
    } else {
      const updatedState: Game1A2BState = {
        ...state1a2b,
        [isHost ? 'hostSecret' : 'guestSecret']: inputCode,
      };
      const bothReady = isHost ? Boolean(state1a2b.guestSecret) : Boolean(state1a2b.hostSecret);
      await onUpdateRoom({
        status: bothReady ? 'playing' : 'setup',
        currentTurn: bothReady ? room.hostUid : undefined,
        state1a2b: updatedState,
      });
    }
    setInputCode('');
  };

  // Handle submit guess
  const handleSubmitGuess = async () => {
    if (inputCode.length !== 4) {
      setErrorMessage('請輸入 4 位不重複數字！');
      sound.playBump();
      return;
    }
    const unique = new Set(inputCode.split(''));
    if (unique.size !== 4) {
      setErrorMessage('猜測的數字不可重複！');
      sound.playBump();
      return;
    }

    setErrorMessage(null);
    const targetSecret = opponentSecret || '1234';
    const { a, b } = calculateAB(targetSecret, inputCode);

    sound.playClick();

    const newRecord: GuessRecord = {
      guess: inputCode,
      a,
      b,
      timestamp: Date.now(),
    };

    const nextMyGuesses = [...myGuesses, newRecord];
    const isWin = a === 4;

    if (isWin) {
      sound.playWin();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      await onRewardCoins(100);

      const updatedState: Game1A2BState = {
        ...state1a2b,
        [isHost ? 'hostGuesses' : 'guestGuesses']: nextMyGuesses,
      };

      await onUpdateRoom({
        status: 'finished',
        winner: currentUser.uid,
        state1a2b: updatedState,
      });
      setInputCode('');
      return;
    }

    // Switch turn to opponent or trigger AI turn
    if (isAiMode) {
      // AI turn
      const updatedState: Game1A2BState = {
        ...state1a2b,
        hostGuesses: nextMyGuesses,
      };

      // AI calculates guess
      const aiGuess = generateRandomSecret();
      const aiAB = calculateAB(mySecret || '1234', aiGuess);
      const aiRecord: GuessRecord = {
        guess: aiGuess,
        a: aiAB.a,
        b: aiAB.b,
        timestamp: Date.now(),
      };

      const nextAiGuesses = [...(updatedState.guestGuesses || []), aiRecord];
      const isAiWin = aiAB.a === 4;

      if (isAiWin) {
        sound.playBump();
        await onUpdateRoom({
          status: 'finished',
          winner: 'npc_bot',
          state1a2b: {
            ...updatedState,
            guestGuesses: nextAiGuesses,
          },
        });
      } else {
        await onUpdateRoom({
          currentTurn: currentUser.uid,
          state1a2b: {
            ...updatedState,
            guestGuesses: nextAiGuesses,
          },
        });
      }
    } else {
      const nextTurn = isHost ? room.guestUid : room.hostUid;
      const updatedState: Game1A2BState = {
        ...state1a2b,
        [isHost ? 'hostGuesses' : 'guestGuesses']: nextMyGuesses,
      };

      await onUpdateRoom({
        currentTurn: nextTurn,
        state1a2b: updatedState,
      });
    }

    setInputCode('');
  };

  const handleKeypadPress = (num: string) => {
    if (inputCode.length < 4 && !inputCode.includes(num)) {
      setInputCode((prev) => prev + num);
      sound.playClick();
    }
  };

  const handleBackspace = () => {
    setInputCode((prev) => prev.slice(0, -1));
    sound.playClick();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs bg-white font-sans">
      {/* Top Game Status Bar (Clean Light Style matching 1a2b.terry0215.com) */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
            1A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-extrabold text-sm">1A2B 猜數字</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                房號: #{room.roomId}
              </span>
            </div>
            <p className="text-[11px] text-indigo-600 font-medium">
              {isSetupPhase ? '請先設定 4 位不重複秘密密碼' : '請輸入 4 個不重複的數字'}
            </p>
          </div>
        </div>

        <div>
          {room.status === 'finished' ? (
            <span className="font-bold text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Trophy className="w-4 h-4 text-amber-500" />
              {room.winner === currentUser.uid ? '🎉 你贏了！獲得 100 金幣' : '對方率先猜中密碼！'}
            </span>
          ) : isSetupPhase ? (
            <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 animate-pulse">
              🔒 密碼設定中
            </span>
          ) : (
            <span
              className={`font-bold px-3 py-1 rounded-full text-xs ${
                isMyTurn
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {isMyTurn ? '👉 輪到你猜測！' : '⏳ 等待對手猜測...'}
            </span>
          )}
        </div>
      </div>

      {/* Main Dual Column Game Log Area (Clean White & Slate Grid) */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 bg-slate-50/70">
        {/* Left Column: My Guesses */}
        <div className="bg-white p-3 border border-slate-200 rounded-2xl flex flex-col shadow-xs">
          <div className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
            <span className="text-indigo-600 flex items-center gap-1">
              <span>🎯</span> 你猜對方的紀錄
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
              你的秘密: {mySecret ? '****' : '未設定'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-48">
            {myGuesses.length === 0 ? (
              <div className="text-slate-400 text-center py-8 text-xs">尚未有猜測紀錄</div>
            ) : (
              myGuesses.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[10px] text-slate-400 font-bold">#{i + 1}</span>
                    <div className="flex gap-1">
                      {rec.guess.split('').map((ch, idx) => (
                        <span
                          key={idx}
                          className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shadow-2xs"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                      rec.a === 4
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {rec.a}A{rec.b}B
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Opponent Guesses */}
        <div className="bg-white p-3 border border-slate-200 rounded-2xl flex flex-col shadow-xs">
          <div className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
            <span className="text-slate-700 flex items-center gap-1">
              <span>⚔️</span> {isAiMode ? '電腦 AI 猜你' : `${room.guestName || '對手'} 猜你`}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
              {room.status === 'finished' ? `對方密碼: ${opponentSecret}` : '對手密碼: ****'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-48">
            {opponentGuesses.length === 0 ? (
              <div className="text-slate-400 text-center py-8 text-xs">對手尚未猜測</div>
            ) : (
              opponentGuesses.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 bg-slate-50/80 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[10px] text-slate-400 font-bold">#{i + 1}</span>
                    <div className="flex gap-1">
                      {rec.guess.split('').map((ch, idx) => (
                        <span
                          key={idx}
                          className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs shadow-2xs"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="font-mono font-bold px-2 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-600 border border-slate-200">
                    {rec.a}A{rec.b}B
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Input Code Display & Modern Keypad (Exact match to 1a2b.terry0215.com screenshot!) */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-col items-center gap-2.5">
        {/* Error warning if any */}
        {errorMessage && (
          <div className="text-center text-rose-500 font-bold text-xs animate-bounce-gentle">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* 4 Circular Display Bubbles */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map((pos) => {
            const digit = inputCode[pos];
            const isCurrent = inputCode.length === pos;
            return (
              <div
                key={pos}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black transition-all shadow-xs ${
                  digit
                    ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700 scale-105'
                    : isCurrent
                    ? 'bg-white border-2 border-dashed border-indigo-500 animate-pulse'
                    : 'bg-slate-50 border-2 border-slate-200 text-slate-300'
                }`}
              >
                {digit || ''}
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          點擊下方圓圈輸入數字 (不可重複)
        </div>

        {/* Modern 3-Column Round Keypad (Matching 1a2b.terry0215.com layout) */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs w-full pb-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => {
            const isUsed = inputCode.includes(digit);
            return (
              <button
                key={digit}
                onClick={() => handleKeypadPress(digit)}
                disabled={isUsed || (!isSetupPhase && !isMyTurn)}
                className={`w-12 h-12 mx-auto rounded-full font-bold text-base border flex items-center justify-center shadow-xs transition-all ${
                  isUsed
                    ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 active:scale-95 text-slate-800 border-slate-200 hover:border-indigo-300 shadow-sm'
                }`}
              >
                {digit}
              </button>
            );
          })}

          {/* Bottom Row: Backspace, 0, Submit */}
          <button
            onClick={handleBackspace}
            className="w-12 h-12 mx-auto rounded-full bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs transition-all"
            title="倒退刪除"
          >
            <Delete className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleKeypadPress('0')}
            disabled={inputCode.includes('0') || (!isSetupPhase && !isMyTurn)}
            className={`w-12 h-12 mx-auto rounded-full font-bold text-base border flex items-center justify-center shadow-xs transition-all ${
              inputCode.includes('0')
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 active:scale-95 text-slate-800 border-slate-200 hover:border-indigo-300 shadow-sm'
            }`}
          >
            0
          </button>

          {isSetupPhase ? (
            <button
              onClick={handleSetSecret}
              disabled={inputCode.length !== 4}
              className="w-12 h-12 mx-auto rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 active:scale-95 text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-all font-bold text-xs"
              title="設定密碼"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={handleSubmitGuess}
              disabled={!isMyTurn || inputCode.length !== 4 || room.status === 'finished'}
              className="w-12 h-12 mx-auto rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 active:scale-95 text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-all font-bold text-xs"
              title="送出猜測"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
