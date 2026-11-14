import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArcadeRoom, Game1A2BState, GuessRecord, UserProfile } from '../../types/game';
import { sound } from '../../services/audio';
import { Delete, Check, ArrowLeft, RotateCcw } from 'lucide-react';

interface Game1A2BProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
  onUpdateRoom: (updates: Partial<ArcadeRoom>) => Promise<void>;
  onRewardCoins: (amount: number) => Promise<void>;
  onBackToLobby?: () => void;
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
  onBackToLobby,
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
  const isFinished = room.status === 'finished';
  const isWinner = room.winner === currentUser.uid;

  // Handle secret setting in setup phase
  const handleSetSecret = async () => {
    if (inputCode.length !== 4) {
      setErrorMessage('請輸入 4 位不重複之數碼！');
      sound.playBump();
      return;
    }
    const uniqueDigits = new Set(inputCode.split(''));
    if (uniqueDigits.size !== 4) {
      setErrorMessage('四位數碼不得有重複！');
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
      setErrorMessage('請輸入 4 位不重複數碼！');
      sound.playBump();
      return;
    }
    const unique = new Set(inputCode.split(''));
    if (unique.size !== 4) {
      setErrorMessage('推想數碼不可重複！');
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
        particleCount: 100,
        spread: 80,
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
      const updatedState: Game1A2BState = {
        ...state1a2b,
        hostGuesses: nextMyGuesses,
      };

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
    <div className="relative w-full max-w-4xl mx-auto bg-[#FFFDF9] border-4 border-double border-[#5D4037] shadow-[6px_6px_0px_#5D4037] rounded-sm p-4 sm:p-6 font-serif text-[#2D1E18] select-none">
      {/* Background Watermark Stamp */}
      <div className="absolute top-6 right-6 pointer-events-none opacity-10 rotate-[-12deg] border-4 border-[#B71C1C] text-[#B71C1C] font-black text-4xl px-4 py-2">
        文部省驗證
      </div>

      {/* ================= 1. SHOWA MASTHEAD & TEST HEADER ================= */}
      <div className="border-b-4 border-double border-[#5D4037] pb-4 mb-4">
        {/* Auxiliary English Subtitle */}
        <div className="text-[11px] font-bold text-[#8D6E63] tracking-[0.25em] text-center uppercase mb-1">
          - INTELLECTUAL NUMERIC CIPHER TEST NO. 1A2B -
        </div>

        {/* Main Title: font-black (900) + tracking-[0.2em] */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToLobby && (
              <button
                onClick={onBackToLobby}
                className="btn-press px-2.5 py-1 bg-[#EFEBE9] hover:bg-[#D7CCC8] border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] rounded-sm text-xs font-bold flex items-center gap-1 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                title="返回遊戲大廳"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回大廳</span>
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-[#2D1E18]">
              第一種數理推想測驗
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-[#EFEBE9] border border-[#5D4037] px-2.5 py-1 shadow-[2px_2px_0px_#5D4037]">
              房號卷宗：#{room.roomId}
            </span>
            <div className="border-2 border-[#B71C1C] text-[#B71C1C] font-black text-[10px] px-2 py-0.5 rotate-[-3deg]">
              極秘
            </div>
          </div>
        </div>

        {/* Status / Instructions banner */}
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#8D6E63] pt-2 text-xs">
          <div className="font-bold text-[#5D4037]">
            受驗生：<span className="text-[#2D1E18] underline underline-offset-4">{currentUser.displayName}</span>
          </div>

          <div>
            {isFinished ? (
              <span className="font-black text-[#B71C1C] flex items-center gap-1.5">
                {isWinner ? '★ 測驗合格！率先破解敵方密碼 ★' : '▲ 對手率先答成解密 ▲'}
              </span>
            ) : isSetupPhase ? (
              <span className="text-[#8D6E63] font-bold animate-pulse">
                ✎ 請受驗生於密碼格內設定 4 位秘密數碼
              </span>
            ) : (
              <span
                className={`font-black px-3 py-1 border ${
                  isMyTurn
                    ? 'bg-[#B71C1C] text-white border-[#5D4037] shadow-[2px_2px_0px_#5D4037] animate-pulse'
                    : 'bg-[#EFEBE9] text-[#5D4037] border-[#8D6E63]'
                }`}
              >
                {isMyTurn ? '👉 輪到您執筆推想！' : '⏳ 等待對方推想作答...'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= 2. EXAM REPORT CARDS (DUAL COLUMN) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Left Card: My Deductions */}
        <div className="border-2 border-[#5D4037] bg-[#FAF8F5] p-3 shadow-[4px_4px_0px_#5D4037] rounded-xs flex flex-col">
          <div className="border-b-2 border-double border-[#5D4037] pb-1.5 mb-2 flex items-center justify-between">
            <span className="font-black text-sm tracking-wider text-[#2D1E18]">
              【我方推想對策紀錄】
            </span>
            <span className="text-[11px] font-mono font-bold text-[#8D6E63]">
              我方底牌：{mySecret ? mySecret : '未密封'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-48 pr-1 space-y-1.5 min-h-[120px]">
            {myGuesses.length === 0 ? (
              <div className="text-center text-[#8D6E63] text-xs py-8 italic border border-dashed border-[#D7CCC8]">
                尚無作答紀錄
              </div>
            ) : (
              myGuesses.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-[#FFFDF9] border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#8D6E63]">第 {i + 1} 回</span>
                    <span className="font-mono text-base font-black tracking-widest text-[#2D1E18]">
                      {rec.guess}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-black text-xs px-2 py-0.5 border ${
                      rec.a === 4
                        ? 'bg-[#B71C1C] text-white border-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                        : 'bg-[#EFEBE9] text-[#2D1E18] border-[#5D4037]'
                    }`}
                  >
                    {rec.a}A {rec.b}B
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Card: Opponent Deductions */}
        <div className="border-2 border-[#5D4037] bg-[#FAF8F5] p-3 shadow-[4px_4px_0px_#5D4037] rounded-xs flex flex-col">
          <div className="border-b-2 border-double border-[#5D4037] pb-1.5 mb-2 flex items-center justify-between">
            <span className="font-black text-sm tracking-wider text-[#2D1E18]">
              【{isAiMode ? '電算機審查員' : room.guestName || '對手'} 之推想】
            </span>
            <span className="text-[11px] font-mono font-bold text-[#8D6E63]">
              {isFinished ? `敵方原碼：${opponentSecret}` : '敵方原碼：[封印]'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-48 pr-1 space-y-1.5 min-h-[120px]">
            {opponentGuesses.length === 0 ? (
              <div className="text-center text-[#8D6E63] text-xs py-8 italic border border-dashed border-[#D7CCC8]">
                敵方尚未推想
              </div>
            ) : (
              opponentGuesses.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-[#FFFDF9] border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#8D6E63]">第 {i + 1} 回</span>
                    <span className="font-mono text-base font-black tracking-widest text-[#5D4037]">
                      {rec.guess}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 bg-[#EFEBE9] text-[#5D4037] border border-[#8D6E63]">
                    {rec.a}A {rec.b}B
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. EXAM QUESTION & ANSWER ZONE ================= */}
      {/* 測驗題目：放大字級 (text-4xl 至 text-5xl) 並收緊字距，確保受驗生在遠距離或緊張狀態下仍能清晰辨識 */}
      <div className="border-4 border-double border-[#5D4037] bg-[#FFFDF9] p-4 sm:p-5 mb-4 text-center relative overflow-hidden">
        {/* Winning Stamp Stamp-in Animation */}
        {isFinished && isWinner && (
          <div className="absolute right-4 top-2 pointer-events-none z-20 animate-stamp">
            <div className="border-4 border-[#B71C1C] text-[#B71C1C] font-black text-2xl sm:text-3xl px-4 py-1.5 rotate-[-8deg] shadow-[3px_3px_0px_#B71C1C] bg-[#FFFDF9]/95">
              合 格
            </div>
          </div>
        )}

        <div className="text-xs font-bold text-[#8D6E63] tracking-[0.15em] mb-1">
          {isSetupPhase ? '- SET YOUR SECRET 4-DIGIT CODE -' : '- CIPHER INPUT SECTION -'}
        </div>

        {/* 4 Digit Slots (Large numbers, dashed borders) */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 my-2">
          {[0, 1, 2, 3].map((pos) => {
            const digit = inputCode[pos];
            const isCurrent = inputCode.length === pos;
            return (
              <div
                key={pos}
                className={`w-14 h-16 sm:w-18 sm:h-20 border-2 flex items-center justify-center text-4xl sm:text-5xl font-black tracking-tight transition-all ${
                  digit
                    ? 'border-[#5D4037] bg-[#EFEBE9] text-[#2D1E18] shadow-[3px_3px_0px_#5D4037]'
                    : isCurrent
                    ? 'border-dashed border-2 border-[#B71C1C] bg-white animate-pulse'
                    : 'border-dashed border-2 border-[#8D6E63] bg-[#FAF8F5] text-[#D7CCC8]'
                }`}
              >
                {digit || ''}
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="text-xs font-bold text-[#B71C1C] mt-2 animate-bounce-gentle">
            ⚠ {errorMessage}
          </div>
        )}
      </div>

      {/* ================= 4. MECHANICAL RETRO KEYPAD ================= */}
      {/* 物理按壓回饋：active:translate-x-1 active:translate-y-1 active:shadow-none */}
      <div className="max-w-md mx-auto pt-2">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => {
            const isUsed = inputCode.includes(digit);
            return (
              <button
                key={digit}
                onClick={() => handleKeypadPress(digit)}
                disabled={isUsed || (!isSetupPhase && !isMyTurn) || isFinished}
                className={`btn-press py-3 sm:py-3.5 border-2 border-[#5D4037] font-mono text-xl sm:text-2xl font-black rounded-xs transition-all ${
                  isUsed || (!isSetupPhase && !isMyTurn) || isFinished
                    ? 'bg-[#EFEBE9] text-[#D7CCC8] border-[#D7CCC8] cursor-not-allowed shadow-none'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF8F5] text-[#2D1E18] shadow-[4px_4px_0px_#5D4037] cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none'
                }`}
              >
                {digit}
              </button>
            );
          })}

          {/* Bottom Row: Backspace, 0, Submit / Confirm */}
          <button
            onClick={handleBackspace}
            disabled={inputCode.length === 0 || isFinished}
            className="btn-press py-3 sm:py-3.5 border-2 border-[#5D4037] bg-[#D7CCC8] hover:bg-[#BCAAA4] disabled:opacity-40 text-[#2D1E18] font-bold shadow-[4px_4px_0px_#5D4037] rounded-xs flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none"
            title="倒退塗銷"
          >
            <Delete className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            onClick={() => handleKeypadPress('0')}
            disabled={inputCode.includes('0') || (!isSetupPhase && !isMyTurn) || isFinished}
            className={`btn-press py-3 sm:py-3.5 border-2 border-[#5D4037] font-mono text-xl sm:text-2xl font-black rounded-xs transition-all ${
              inputCode.includes('0') || (!isSetupPhase && !isMyTurn) || isFinished
                ? 'bg-[#EFEBE9] text-[#D7CCC8] border-[#D7CCC8] cursor-not-allowed shadow-none'
                : 'bg-[#FFFDF9] hover:bg-[#FAF8F5] text-[#2D1E18] shadow-[4px_4px_0px_#5D4037] cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none'
            }`}
          >
            0
          </button>

          {isSetupPhase ? (
            <button
              onClick={handleSetSecret}
              disabled={inputCode.length !== 4}
              className="btn-press py-3 sm:py-3.5 border-2 border-[#5D4037] bg-[#B71C1C] hover:bg-[#C62828] disabled:opacity-40 text-white font-black text-sm shadow-[4px_4px_0px_#5D4037] rounded-xs flex items-center justify-center gap-1 cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none tracking-widest"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>封存密碼</span>
            </button>
          ) : (
            <button
              onClick={handleSubmitGuess}
              disabled={!isMyTurn || inputCode.length !== 4 || isFinished}
              className="btn-press py-3 sm:py-3.5 border-2 border-[#5D4037] bg-[#1A237E] hover:bg-[#283593] disabled:opacity-40 text-white font-black text-sm shadow-[4px_4px_0px_#5D4037] rounded-xs flex items-center justify-center gap-1 cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none tracking-widest"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>送出推想</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
