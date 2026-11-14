import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArcadeRoom, GameOOXXState, UserProfile } from '../../types/game';
import { sound } from '../../services/audio';
import { Trophy, RefreshCw, Sparkles, Award } from 'lucide-react';

interface GameOOXXProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
  onUpdateRoom: (updates: Partial<ArcadeRoom>) => Promise<void>;
  onRewardCoins: (amount: number) => Promise<void>;
}

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

export function checkWinner(board: (string | null)[]): { winner: string | null; line: number[] | null } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

export const GameOOXX: React.FC<GameOOXXProps> = ({
  room,
  currentUser,
  onUpdateRoom,
  onRewardCoins,
}) => {
  const isHost = room.hostUid === currentUser.uid;
  const isAiMode = room.mode === 'ai';

  const defaultState: GameOOXXState = {
    mode: 'infinite',
    board: Array(9).fill(null),
    pieceHistory: [],
  };

  const stateOoxx: GameOOXXState = room.stateOoxx || defaultState;
  const board = stateOoxx.board;
  const mode = stateOoxx.mode;
  const pieceHistory = stateOoxx.pieceHistory;

  const isMyTurn = room.status === 'playing' && room.currentTurn === currentUser.uid;

  // Identify oldest piece for each player in infinite mode
  const hostHistory = pieceHistory.filter((m) => m.uid === room.hostUid);
  const guestHistory = pieceHistory.filter((m) => m.uid === (room.guestUid || 'ai_bot'));

  const hostOldestIndex = hostHistory.length >= 3 ? hostHistory[0].index : null;
  const guestOldestIndex = guestHistory.length >= 3 ? guestHistory[0].index : null;

  const handleCellClick = async (index: number) => {
    if (!isMyTurn || room.status !== 'playing') return;
    if (board[index] !== null) {
      sound.playBump();
      return;
    }

    sound.playClick();

    // Create next board
    let nextBoard = [...board];
    let nextHistory = [...pieceHistory];

    const currentUid = currentUser.uid;
    const playerHistory = currentUid === room.hostUid ? hostHistory : guestHistory;

    // In infinite mode: if player already has 3 pieces on board, remove oldest
    if (mode === 'infinite' && playerHistory.length >= 3) {
      const oldestMove = playerHistory[0];
      nextBoard[oldestMove.index] = null;
      nextHistory = nextHistory.filter((m) => !(m.uid === currentUid && m.index === oldestMove.index));
    }

    // Place new piece
    nextBoard[index] = currentUid;
    nextHistory.push({ uid: currentUid, index });

    // Check winner
    const winResult = checkWinner(nextBoard);
    if (winResult.winner) {
      sound.playWin();
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
      await onRewardCoins(50);
      await onUpdateRoom({
        status: 'finished',
        winner: currentUid,
        stateOoxx: {
          ...stateOoxx,
          board: nextBoard,
          pieceHistory: nextHistory,
          winningLine: winResult.line || undefined,
        },
      });
      return;
    }

    // In classic mode, check draw
    if (mode === 'classic' && nextBoard.every((cell) => cell !== null)) {
      sound.playBump();
      await onUpdateRoom({
        status: 'finished',
        winner: 'draw',
        stateOoxx: {
          ...stateOoxx,
          board: nextBoard,
          pieceHistory: nextHistory,
        },
      });
      return;
    }

    // AI Opponent auto-reply
    if (isAiMode) {
      const aiUid = 'ai_bot';
      const availableIndices = nextBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (availableIndices.length > 0) {
        let aiTarget = availableIndices[0];

        // 1. Check if AI can win
        for (const idx of availableIndices) {
          const testBoard = [...nextBoard];
          let testHist = [...nextHistory];
          const aiHist = testHist.filter((m) => m.uid === aiUid);
          if (mode === 'infinite' && aiHist.length >= 3) {
            testBoard[aiHist[0].index] = null;
          }
          testBoard[idx] = aiUid;
          if (checkWinner(testBoard).winner === aiUid) {
            aiTarget = idx;
            break;
          }
        }

        // 2. Block player win
        if (aiTarget === availableIndices[0]) {
          for (const idx of availableIndices) {
            const testBoard = [...nextBoard];
            let testHist = [...nextHistory];
            const pHist = testHist.filter((m) => m.uid === currentUid);
            if (mode === 'infinite' && pHist.length >= 3) {
              testBoard[pHist[0].index] = null;
            }
            testBoard[idx] = currentUid;
            if (checkWinner(testBoard).winner === currentUid) {
              aiTarget = idx;
              break;
            }
          }
        }

        // Apply AI move
        const aiHistory = nextHistory.filter((m) => m.uid === aiUid);
        if (mode === 'infinite' && aiHistory.length >= 3) {
          const oldestMove = aiHistory[0];
          nextBoard[oldestMove.index] = null;
          nextHistory = nextHistory.filter((m) => !(m.uid === aiUid && m.index === oldestMove.index));
        }

        nextBoard[aiTarget] = aiUid;
        nextHistory.push({ uid: aiUid, index: aiTarget });

        const aiWinResult = checkWinner(nextBoard);
        if (aiWinResult.winner) {
          sound.playLose();
          await onUpdateRoom({
            status: 'finished',
            winner: aiUid,
            stateOoxx: {
              ...stateOoxx,
              board: nextBoard,
              pieceHistory: nextHistory,
              winningLine: aiWinResult.line || undefined,
            },
          });
          return;
        }

        await onUpdateRoom({
          currentTurn: currentUser.uid,
          stateOoxx: {
            ...stateOoxx,
            board: nextBoard,
            pieceHistory: nextHistory,
          },
        });
      }
    } else {
      // PvP Turn Switch
      const nextTurnUid = isHost ? room.guestUid : room.hostUid;
      await onUpdateRoom({
        currentTurn: nextTurnUid,
        stateOoxx: {
          ...stateOoxx,
          board: nextBoard,
          pieceHistory: nextHistory,
        },
      });
    }
  };

  const handleRestart = async () => {
    await onUpdateRoom({
      status: 'playing',
      winner: undefined,
      currentTurn: room.hostUid,
      stateOoxx: {
        mode,
        board: Array(9).fill(null),
        pieceHistory: [],
      },
    });
    sound.playClick();
  };

  const toggleMode = async (newMode: 'infinite' | 'classic') => {
    await onUpdateRoom({
      status: 'playing',
      winner: undefined,
      currentTurn: room.hostUid,
      stateOoxx: {
        mode: newMode,
        board: Array(9).fill(null),
        pieceHistory: [],
      },
    });
    sound.playClick();
  };

  const isWinner = room.status === 'finished' && room.winner === currentUser.uid;
  const isLoser = room.status === 'finished' && room.winner && room.winner !== currentUser.uid && room.winner !== 'draw';

  return (
    <div className="flex flex-col h-full bg-[#F7F3E9] text-[#2D1E18] font-serif select-none">
      {/* 1. Header Masthead with Double Border & Noto Serif Typography */}
      <div className="p-3 sm:p-4 bg-[#FFFDF9] border-b-4 border-double border-[#5D4037] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_4px_rgba(93,64,55,0.06)]">
        <div>
          <div className="text-[10px] sm:text-xs text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
            - INFINITE TIC-TAC-TOE TACTICAL EXAM -
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-[#2D1E18] flex items-center gap-2">
            <span>無限 OOXX 棋藝試驗</span>
            <span className="text-xs px-2 py-0.5 border border-[#5D4037] bg-[#F7F3E9] text-[#5D4037] font-semibold tracking-normal">
              昭和試驗規約
            </span>
          </h2>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-[#F7F3E9] border-2 border-[#5D4037] rounded-sm shadow-[3px_3px_0px_#5D4037]">
            <button
              onClick={() => toggleMode('infinite')}
              className={`px-3 py-1 text-xs font-bold transition-all ${
                mode === 'infinite'
                  ? 'bg-[#5D4037] text-[#FFFDF9] shadow-[1px_1px_0px_#2D1E18]'
                  : 'text-[#5D4037] hover:bg-[#EFEBE4]'
              }`}
            >
              三子無限動態棋 🔥
            </button>
            <button
              onClick={() => toggleMode('classic')}
              className={`px-3 py-1 text-xs font-bold transition-all ${
                mode === 'classic'
                  ? 'bg-[#5D4037] text-[#FFFDF9] shadow-[1px_1px_0px_#2D1E18]'
                  : 'text-[#5D4037] hover:bg-[#EFEBE4]'
              }`}
            >
              經典三連試驗
            </button>
          </div>
        </div>
      </div>

      {/* Rules Notice with Dashed Border */}
      {mode === 'infinite' && (
        <div className="px-4 py-2 bg-[#FFFDF9] border-b-2 border-dashed border-[#5D4037] text-xs text-[#5D4037] flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#C62828]" />
          <span>
            【無限動態律】：每位受驗生最多保留 3 顆棋子。落第 4 顆時，最早落下的棋子將銷毀消除！
          </span>
        </div>
      )}

      {/* 2. Main Examination Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-y-auto">
        {/* Status Report Bar */}
        <div className="mb-4 w-full max-w-md px-4 py-2 border-2 border-dashed border-[#5D4037] bg-[#FFFDF9] text-center shadow-[4px_4px_0px_#5D4037]">
          {room.status === 'finished' ? (
            <div className="flex items-center justify-center gap-2 text-sm font-black tracking-wide">
              <Trophy className="w-4 h-4 text-[#C62828]" />
              <span className="text-[#C62828]">
                {room.winner === currentUser.uid
                  ? '受驗合格！榮獲棋藝勝利（金幣 +50）'
                  : room.winner === 'draw'
                  ? '雙方平局！均具深厚棋藝'
                  : '對手連成一線！未能合格，請再接再厲'}
              </span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-bold tracking-widest text-[#2D1E18] flex items-center justify-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? 'bg-[#C62828] animate-ping' : 'bg-slate-400'}`} />
              <span>{isMyTurn ? '輪到我方落子，請審慎佈局！' : '等待對方落子應對中...'}</span>
            </div>
          )}
        </div>

        {/* 3x3 Grid Board Card */}
        <div className="relative p-4 sm:p-6 bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] rounded-sm">
          {/* Vermilion Stamp on Finish */}
          {room.status === 'finished' && (
            <div className="absolute top-2 right-2 pointer-events-none z-20">
              <div
                className={`w-20 h-20 rounded-full border-4 border-double border-[#C62828] flex flex-col items-center justify-center text-[#C62828] font-black tracking-widest ${
                  isWinner ? 'animate-stamp' : 'opacity-85'
                }`}
                style={{ transform: 'rotate(-12deg)' }}
              >
                <span className="text-[10px] border-b border-[#C62828] pb-0.5">昭和試驗局</span>
                <span className="text-base sm:text-lg">{isWinner ? '合 格' : isLoser ? '不合格' : '對 局'}</span>
              </div>
            </div>
          )}

          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-3">
            {board.map((cellUid, idx) => {
              const isWinningCell = stateOoxx.winningLine?.includes(idx);
              const isHostPiece = cellUid === room.hostUid;
              const isGuestPiece = cellUid && cellUid !== room.hostUid;

              // In infinite mode, check if this cell is about to vanish
              const isOldest =
                mode === 'infinite' &&
                ((isHostPiece && idx === hostOldestIndex) ||
                  (isGuestPiece && idx === guestOldestIndex));

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={cellUid !== null || !isMyTurn || room.status === 'finished'}
                  className={`relative w-20 h-20 sm:w-26 sm:h-26 border-2 border-[#5D4037] bg-[#F7F3E9] flex flex-col items-center justify-center transition-all ${
                    isWinningCell
                      ? 'bg-amber-100 border-[#C62828] scale-105 shadow-[4px_4px_0px_#C62828]'
                      : cellUid === null
                      ? 'hover:bg-[#EFEBE4] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
                      : 'shadow-[4px_4px_0px_#5D4037]'
                  } ${isOldest ? 'opacity-40 animate-pulse' : ''}`}
                >
                  {cellUid ? (
                    isHostPiece ? (
                      <span className="text-[#C62828] text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm">
                        O
                      </span>
                    ) : (
                      <span className="text-[#1A237E] text-4xl sm:text-5xl font-black tracking-tight drop-shadow-sm">
                        X
                      </span>
                    )
                  ) : null}

                  {/* Vanishing indicator */}
                  {isOldest && (
                    <span className="absolute bottom-1 text-[9px] font-bold text-[#C62828] tracking-tighter bg-white/90 px-1 border border-[#C62828]">
                      即將銷毀
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Players Dossier with double border */}
          <div className="mt-4 pt-3 border-t-2 border-double border-[#5D4037] flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 border border-[#C62828] text-[#C62828] font-black flex items-center justify-center text-xs bg-[#FFFDF9]">
                O
              </span>
              <span className="text-[#2D1E18]">
                {room.hostName} {isHost ? '（本席）' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 border border-[#1A237E] text-[#1A237E] font-black flex items-center justify-center text-xs bg-[#FFFDF9]">
                X
              </span>
              <span className="text-[#2D1E18]">
                {room.guestName || (isAiMode ? '試驗官 AI' : '對弈考生')} {!isHost && !isAiMode ? '（本席）' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Restart Button */}
        {room.status === 'finished' && (
          <div className="mt-5">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-[#FFFDF9] font-black text-xs sm:text-sm tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新呈遞試卷・再對弈一局</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
