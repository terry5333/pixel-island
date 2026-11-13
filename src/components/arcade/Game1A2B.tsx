import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ArcadeRoom, Game1A2BState, GuessRecord, UserProfile } from '../../types/game';
import { sound } from '../../services/audio';
import { dbService } from '../../services/dbService';
import { Trophy, RefreshCw, Delete } from 'lucide-react';

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

    const newRecord: GuessRecord = {
      guess: inputCode,
      a,
      b,
      timestamp: Date.now(),
    };

    sound.playClick();

    const nextHostGuesses = isHost ? [...state1a2b.hostGuesses, newRecord] : state1a2b.hostGuesses;
    const nextGuestGuesses = !isHost ? [...state1a2b.guestGuesses, newRecord] : state1a2b.guestGuesses;

    // Check if I won
    if (a === 4) {
      sound.playWin();
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      await onRewardCoins(100);
      await onUpdateRoom({
        status: 'finished',
        winner: currentUser.uid,
        state1a2b: {
          ...state1a2b,
          hostGuesses: nextHostGuesses,
          guestGuesses: nextGuestGuesses,
        },
      });
      setInputCode('');
      return;
    }

    // AI Turn or pass to guest
    if (isAiMode) {
      // AI makes a guess
      const aiGuess = generateRandomSecret();
      const aiResult = calculateAB(state1a2b.hostSecret || '1234', aiGuess);
      const aiRecord: GuessRecord = {
        guess: aiGuess,
        a: aiResult.a,
        b: aiResult.b,
        timestamp: Date.now(),
      };

      const finalGuestGuesses = [...nextGuestGuesses, aiRecord];

      if (aiResult.a === 4) {
        sound.playLose();
        await onUpdateRoom({
          status: 'finished',
          winner: 'ai_bot',
          state1a2b: {
            ...state1a2b,
            hostGuesses: nextHostGuesses,
            guestGuesses: finalGuestGuesses,
          },
        });
      } else {
        await onUpdateRoom({
          currentTurn: currentUser.uid,
          state1a2b: {
            ...state1a2b,
            hostGuesses: nextHostGuesses,
            guestGuesses: finalGuestGuesses,
          },
        });
      }
    } else {
      // Switch turns in PvP
      const nextTurnUid = isHost ? room.guestUid : room.hostUid;
      await onUpdateRoom({
        currentTurn: nextTurnUid,
        state1a2b: {
          ...state1a2b,
          hostGuesses: nextHostGuesses,
          guestGuesses: nextGuestGuesses,
        },
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
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Top Game Status Bar */}
      <div className="p-2.5 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">1A2B 數字密碼大對決</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
            房號: #{room.roomId}
          </span>
        </div>
        <div>
          {room.status === 'finished' ? (
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {room.winner === currentUser.uid ? '🎉 你贏了！獲得 100 金幣' : '對方率先猜中密碼！'}
            </span>
          ) : isSetupPhase ? (
            <span className="text-cyan-300 animate-pulse">🔒 密碼設定階段</span>
          ) : (
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                isMyTurn
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isMyTurn ? '👉 輪到你猜測！' : '⏳ 等待對手猜測...'}
            </span>
          )}
        </div>
      </div>

      {/* Main Dual Column Game Log Area */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 bg-[#111022]">
        {/* Left Column: My Guesses */}
        <div className="pixel-card p-2.5 bg-slate-950/80 border-2 border-slate-800 rounded flex flex-col">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span className="text-emerald-400">你猜對方的紀錄</span>
            <span className="text-[10px] text-slate-400">你的秘密: {mySecret ? '****' : '未設定'}</span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 max-h-48">
            {myGuesses.length === 0 ? (
              <div className="text-slate-500 text-center py-6 text-[11px]">尚未有猜測紀錄</div>
            ) : (
              myGuesses.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-slate-800"
                >
                  <span className="font-mono text-amber-300 tracking-widest font-bold">
                    #{i + 1} {rec.guess}
                  </span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      rec.a === 4
                        ? 'bg-amber-400 text-black font-extrabold'
                        : 'bg-slate-800 text-cyan-300'
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
        <div className="pixel-card p-2.5 bg-slate-950/80 border-2 border-slate-800 rounded flex flex-col">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span className="text-rose-400">
              {isAiMode ? '電腦 AI 猜你' : `${room.guestName || '對手'} 猜你`}
            </span>
            <span className="text-[10px] text-slate-400">
              {room.status === 'finished' ? `對方密碼: ${opponentSecret}` : '對手密碼: ****'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1 max-h-48">
            {opponentGuesses.length === 0 ? (
              <div className="text-slate-500 text-center py-6 text-[11px]">對手尚未猜測</div>
            ) : (
              opponentGuesses.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-1.5 bg-slate-900 rounded border border-slate-800"
                >
                  <span className="font-mono text-rose-300 tracking-widest font-bold">
                    #{i + 1} {rec.guess}
                  </span>
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                    {rec.a}A{rec.b}B
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Input Code Display & Retro Keypad */}
      <div className="p-3 bg-slate-950 border-t-2 border-slate-800 flex flex-col gap-2">
        {/* Error warning if any */}
        {errorMessage && (
          <div className="text-center text-rose-400 font-bold text-[11px] animate-bounce-gentle">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Secret Setup Instructions */}
        {isSetupPhase ? (
          <div className="text-center text-amber-300 text-xs font-bold">
            請輸入 4 位不重複數字作為你的秘密數字：
          </div>
        ) : null}

        {/* Display Bar */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-48 h-10 bg-slate-900 border-2 border-slate-700 rounded flex items-center justify-center text-lg font-mono tracking-widest font-bold text-amber-300">
            {inputCode || <span className="text-slate-600 text-sm font-normal">_ _ _ _</span>}
          </div>

          {isSetupPhase ? (
            <button
              onClick={handleSetSecret}
              disabled={inputCode.length !== 4}
              className="pixel-btn px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs rounded"
            >
              設定密碼
            </button>
          ) : (
            <button
              onClick={handleSubmitGuess}
              disabled={!isMyTurn || inputCode.length !== 4 || room.status === 'finished'}
              className="pixel-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded"
            >
              送出猜測
            </button>
          )}

          <button
            onClick={handleBackspace}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"
            title="倒退刪除"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Retro 0-9 Keypad Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-w-lg mx-auto w-full pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => {
            const isUsed = inputCode.includes(digit);
            return (
              <button
                key={digit}
                onClick={() => handleKeypadPress(digit)}
                disabled={isUsed || (!isSetupPhase && !isMyTurn)}
                className={`py-2 rounded font-mono font-bold text-sm border transition-all ${
                  isUsed
                    ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 active:scale-95'
                }`}
              >
                {digit}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
