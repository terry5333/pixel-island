import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArcadeRoom, GameOOXXState, MoveRecord, UserProfile } from '../../types/game';
import { sound } from '../../services/audio';
import { Trophy, RefreshCw, Sparkles } from 'lucide-react';

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

    // In infinite mode: if player already has 3 pieces on board, remove oldest!
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

    // Check draw (in classic mode only, when all 9 cells filled)
    if (mode === 'classic' && nextBoard.every((c) => c !== null)) {
      sound.playLose();
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

    // AI Turn or Switch player
    if (isAiMode) {
      // Find empty cells
      const emptyIndices = nextBoard
        .map((val, idx) => (val === null ? idx : null))
        .filter((val): val is number => val !== null);

      if (emptyIndices.length > 0) {
        // AI chooses move (blocks player or takes win or random)
        let aiTarget = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

        // Try to win or block
        for (const combo of WINNING_COMBOS) {
          const pieces = combo.map((i) => nextBoard[i]);
          const myCount = pieces.filter((p) => p === currentUser.uid).length;
          const nullCount = pieces.filter((p) => p === null).length;
          if (myCount === 2 && nullCount === 1) {
            aiTarget = combo.find((i) => nextBoard[i] === null)!;
            break;
          }
        }

        const aiUid = 'ai_bot';
        const aiHistory = nextHistory.filter((m) => m.uid === aiUid);

        if (mode === 'infinite' && aiHistory.length >= 3) {
          const oldestAiMove = aiHistory[0];
          nextBoard[oldestAiMove.index] = null;
          nextHistory = nextHistory.filter((m) => !(m.uid === aiUid && m.index === oldestAiMove.index));
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

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      {/* Top Status & Mode Toggle */}
      <div className="p-2.5 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">OOXX 井字棋對決</span>
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => toggleMode('infinite')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                mode === 'infinite'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              三子無限模式 🔥
            </button>
            <button
              onClick={() => toggleMode('classic')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                mode === 'classic'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              經典模式
            </button>
          </div>
        </div>

        <div>
          {room.status === 'finished' ? (
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {room.winner === currentUser.uid
                ? '🎉 你獲勝了！獲得 50 金幣'
                : room.winner === 'draw'
                ? '平手！'
                : '對方連成一線獲勝！'}
            </span>
          ) : (
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                isMyTurn
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isMyTurn ? '👉 輪到你下棋！' : '⏳ 等待對手下棋...'}
            </span>
          )}
        </div>
      </div>

      {/* Rules Notice for Infinite Mode */}
      {mode === 'infinite' && (
        <div className="px-3 py-1.5 bg-purple-950/40 border-b border-purple-900/60 text-purple-200 text-[10px] text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>
            【三子無限模式】：每位玩家最多同時保留 3 顆棋，下第 4 顆時最早的第 1 顆會半透明消失！
          </span>
        </div>
      )}

      {/* Game Board Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#111022]">
        <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-950 border-4 border-slate-800 rounded-xl shadow-pixel-lg">
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
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex flex-col items-center justify-center font-arcade text-3xl transition-all border-2 ${
                  isWinningCell
                    ? 'bg-amber-500/30 border-amber-400 scale-105'
                    : cellUid === null
                    ? 'bg-slate-900 border-slate-700 hover:border-slate-500 active:scale-95'
                    : 'bg-slate-900/90 border-slate-800'
                } ${isOldest ? 'opacity-40 animate-pulse' : ''}`}
              >
                {cellUid ? (
                  isHostPiece ? (
                    <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                      O
                    </span>
                  ) : (
                    <span className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                      X
                    </span>
                  )
                ) : null}

                {/* Vanishing indicator */}
                {isOldest && (
                  <span className="absolute bottom-1 text-[8px] font-pixel text-amber-300 font-bold tracking-tighter">
                    即將消失
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Players Indicator */}
        <div className="flex items-center gap-8 mt-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-400 flex items-center justify-center text-xs font-arcade">
              O
            </span>
            <span className="text-slate-200">
              {room.hostName} {isHost ? '(你)' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500 text-rose-500 flex items-center justify-center text-xs font-arcade">
              X
            </span>
            <span className="text-slate-200">
              {room.guestName || (isAiMode ? '電腦 AI' : '對手')} {!isHost && !isAiMode ? '(你)' : ''}
            </span>
          </div>
        </div>

        {/* Play Again button */}
        {room.status === 'finished' && (
          <div className="mt-4">
            <button
              onClick={handleRestart}
              className="pixel-btn px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> 再來一局
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
