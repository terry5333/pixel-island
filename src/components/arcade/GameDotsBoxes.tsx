import React, { useState, useEffect } from 'react';
import { ArcadeRoom, UserProfile } from '../../types/game';
import { dbService } from '../../services/dbService';
import { sound } from '../../services/audio';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Sparkles, Box, User, Bot } from 'lucide-react';

interface GameDotsBoxesProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
}

const DOTS_COUNT = 5; // 5x5 dots -> 4x4 = 16 boxes
const BOXES_COUNT = 16;
const TOTAL_EDGES = 40; // 20 horizontal + 20 vertical

export const GameDotsBoxes: React.FC<GameDotsBoxesProps> = ({ room, currentUser }) => {
  const isHost = currentUser.uid === room.hostUid;
  const isAiMode = room.mode === 'ai' || room.guestUid === 'npc_bot';
  const myUid = currentUser.uid;
  const opponentUid = isHost ? room.guestUid : room.hostUid;

  const gameState = room.stateDotsBoxes || {
    horizontalEdges: Array(20).fill(false),
    verticalEdges: Array(20).fill(false),
    boxes: Array(16).fill(null),
    scores: { [room.hostUid]: 0, [room.guestUid || 'guest']: 0 },
  };

  const isMyTurn = room.currentTurn === myUid;
  const isFinished = gameState.boxes.every((b) => b !== null);

  const myScore = gameState.scores[myUid] || 0;
  const opponentScore = gameState.scores[opponentUid || 'npc_bot'] || 0;

  // Check which boxes are completed by a move
  const checkCompletedBoxes = (
    hEdges: boolean[],
    vEdges: boolean[],
    currentBoxes: (string | null)[],
    claimingUid: string
  ) => {
    const newBoxes = [...currentBoxes];
    let completedCount = 0;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const boxIdx = r * 4 + c;
        if (newBoxes[boxIdx] === null) {
          const topEdge = hEdges[r * 4 + c];
          const bottomEdge = hEdges[(r + 1) * 4 + c];
          const leftEdge = vEdges[r * 5 + c];
          const rightEdge = vEdges[r * 5 + c + 1];

          if (topEdge && bottomEdge && leftEdge && rightEdge) {
            newBoxes[boxIdx] = claimingUid;
            completedCount++;
          }
        }
      }
    }

    return { newBoxes, completedCount };
  };

  // Handle clicking an edge
  const handleEdgeClick = async (type: 'h' | 'v', index: number) => {
    if (!isMyTurn || room.winner || isFinished) return;

    if (type === 'h' && gameState.horizontalEdges[index]) return;
    if (type === 'v' && gameState.verticalEdges[index]) return;

    sound.playClick();

    const newHEdges = [...gameState.horizontalEdges];
    const newVEdges = [...gameState.verticalEdges];

    if (type === 'h') newHEdges[index] = true;
    else newVEdges[index] = true;

    const { newBoxes, completedCount } = checkCompletedBoxes(newHEdges, newVEdges, gameState.boxes, myUid);

    const newScores = { ...gameState.scores };
    newScores[myUid] = (newScores[myUid] || 0) + completedCount;

    if (completedCount > 0) {
      sound.playBuy();
    }

    // Rule: If you complete a box, you get another turn! Otherwise pass turn to opponent.
    const keepTurn = completedCount > 0;
    const nextTurn = keepTurn ? myUid : (isAiMode ? 'npc_bot' : opponentUid);

    const allClaimed = newBoxes.every((b) => b !== null);
    let winner: string | 'draw' | undefined = undefined;

    if (allClaimed) {
      const myFinalScore = newScores[myUid] || 0;
      const oppFinalScore = newScores[opponentUid || 'npc_bot'] || 0;
      if (myFinalScore > oppFinalScore) {
        winner = myUid;
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        sound.playBuy();
        await dbService.rewardCoins(myUid, 100);
      } else if (oppFinalScore > myFinalScore) {
        winner = opponentUid || 'npc_bot';
      } else {
        winner = 'draw';
      }
    }

    await dbService.updateArcadeRoom(room.roomId, {
      stateDotsBoxes: {
        horizontalEdges: newHEdges,
        verticalEdges: newVEdges,
        boxes: newBoxes,
        scores: newScores,
      },
      currentTurn: nextTurn,
      status: allClaimed ? 'finished' : 'playing',
      winner,
    });
  };

  // AI Move Loop
  useEffect(() => {
    if (!isAiMode || room.winner || isFinished || room.currentTurn !== 'npc_bot') return;

    const aiTimer = setTimeout(async () => {
      const hEdges = [...gameState.horizontalEdges];
      const vEdges = [...gameState.verticalEdges];
      const currentBoxes = [...gameState.boxes];
      const aiUid = 'npc_bot';

      // 1. Try to find any edge that completes a box immediately
      let chosenType: 'h' | 'v' | null = null;
      let chosenIndex = -1;

      // Check horizontal candidates
      for (let i = 0; i < 20; i++) {
        if (!hEdges[i]) {
          const testH = [...hEdges];
          testH[i] = true;
          const { completedCount } = checkCompletedBoxes(testH, vEdges, currentBoxes, aiUid);
          if (completedCount > 0) {
            chosenType = 'h';
            chosenIndex = i;
            break;
          }
        }
      }

      // Check vertical candidates if not found
      if (!chosenType) {
        for (let i = 0; i < 20; i++) {
          if (!vEdges[i]) {
            const testV = [...vEdges];
            testV[i] = true;
            const { completedCount } = checkCompletedBoxes(hEdges, testV, currentBoxes, aiUid);
            if (completedCount > 0) {
              chosenType = 'v';
              chosenIndex = i;
              break;
            }
          }
        }
      }

      // 2. Fallback to random unclaimed edge
      if (!chosenType) {
        const availableMoves: { type: 'h' | 'v'; index: number }[] = [];
        for (let i = 0; i < 20; i++) {
          if (!hEdges[i]) availableMoves.push({ type: 'h', index: i });
          if (!vEdges[i]) availableMoves.push({ type: 'v', index: i });
        }
        if (availableMoves.length > 0) {
          const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          chosenType = randomMove.type;
          chosenIndex = randomMove.index;
        }
      }

      if (chosenType && chosenIndex !== -1) {
        if (chosenType === 'h') hEdges[chosenIndex] = true;
        else vEdges[chosenIndex] = true;

        const { newBoxes, completedCount } = checkCompletedBoxes(hEdges, vEdges, currentBoxes, aiUid);
        const newScores = { ...gameState.scores };
        newScores[aiUid] = (newScores[aiUid] || 0) + completedCount;

        const keepTurn = completedCount > 0;
        const nextTurn = keepTurn ? 'npc_bot' : room.hostUid;

        const allClaimed = newBoxes.every((b) => b !== null);
        let winner: string | 'draw' | undefined = undefined;

        if (allClaimed) {
          const hostFinalScore = newScores[room.hostUid] || 0;
          const aiFinalScore = newScores[aiUid] || 0;
          if (hostFinalScore > aiFinalScore) {
            winner = room.hostUid;
          } else if (aiFinalScore > hostFinalScore) {
            winner = aiUid;
          } else {
            winner = 'draw';
          }
        }

        await dbService.updateArcadeRoom(room.roomId, {
          stateDotsBoxes: {
            horizontalEdges: hEdges,
            verticalEdges: vEdges,
            boxes: newBoxes,
            scores: newScores,
          },
          currentTurn: nextTurn,
          status: allClaimed ? 'finished' : 'playing',
          winner,
        });
      }
    }, 700);

    return () => clearTimeout(aiTimer);
  }, [isAiMode, room.currentTurn, room.winner, isFinished]);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 sm:p-4 bg-[#0d1322] text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-pixel-sm mb-3">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-amber-400" />
          <span className="font-arcade text-xs sm:text-sm text-amber-300">
            點線棋 (Dots & Boxes)
          </span>
        </div>

        {/* Turn Status */}
        <div className="text-xs font-bold">
          {room.winner ? (
            <span className="text-amber-300 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              {room.winner === myUid ? '🎉 恭喜獲勝 (+100金幣)！' : '比賽結束！'}
            </span>
          ) : isMyTurn ? (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full animate-pulse">
              🎯 你的連線回合
            </span>
          ) : (
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-full">
              ⏳ 對手思考中...
            </span>
          )}
        </div>
      </div>

      {/* Scoreboard Cards */}
      <div className="flex items-center justify-center gap-4 w-full max-w-md mb-2">
        {/* My Score */}
        <div
          className={`flex-1 p-2.5 rounded-xl border flex items-center justify-between transition-all ${
            isMyTurn
              ? 'bg-emerald-950/50 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-slate-900/60 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              我
            </div>
            <span className="text-xs text-slate-200 truncate">{currentUser.displayName}</span>
          </div>
          <span className="text-xl font-arcade text-emerald-400">{myScore}</span>
        </div>

        {/* VS badge */}
        <div className="text-xs font-arcade text-slate-500">VS</div>

        {/* Opponent Score */}
        <div
          className={`flex-1 p-2.5 rounded-xl border flex items-center justify-between transition-all ${
            !isMyTurn && !room.winner
              ? 'bg-rose-950/50 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'bg-slate-900/60 border-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs">
              {isAiMode ? '🤖' : '敵'}
            </div>
            <span className="text-xs text-slate-200 truncate">
              {room.guestName || (isAiMode ? '街機小霸王 🤖' : '對手')}
            </span>
          </div>
          <span className="text-xl font-arcade text-rose-400">{opponentScore}</span>
        </div>
      </div>

      {/* Main 5x5 Dots & 4x4 Boxes Grid Board */}
      <div className="relative p-6 bg-slate-950/80 border-2 border-slate-800 rounded-2xl shadow-pixel-lg my-auto">
        <div className="relative" style={{ width: 4 * 60, height: 4 * 60 }}>
          {/* Claimed Boxes */}
          {Array.from({ length: BOXES_COUNT }).map((_, idx) => {
            const r = Math.floor(idx / 4);
            const c = idx % 4;
            const ownerUid = gameState.boxes[idx];
            const isMyBox = ownerUid === myUid;

            return (
              <div
                key={`box_${idx}`}
                className={`absolute transition-all duration-300 flex items-center justify-center rounded-sm ${
                  ownerUid
                    ? isMyBox
                      ? 'bg-emerald-500/30 border border-emerald-400/60 animate-bounce-gentle'
                      : 'bg-rose-500/30 border border-rose-400/60'
                    : 'bg-transparent'
                }`}
                style={{
                  left: c * 60 + 8,
                  top: r * 60 + 8,
                  width: 44,
                  height: 44,
                }}
              >
                {ownerUid && (
                  <span
                    className={`font-arcade text-xs font-bold ${
                      isMyBox ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {isMyBox ? '★' : '◆'}
                  </span>
                )}
              </div>
            );
          })}

          {/* Horizontal Edges (5 rows x 4 cols = 20) */}
          {Array.from({ length: 20 }).map((_, idx) => {
            const r = Math.floor(idx / 4);
            const c = idx % 4;
            const isClaimed = gameState.horizontalEdges[idx];

            return (
              <button
                key={`h_edge_${idx}`}
                disabled={isClaimed || !isMyTurn || !!room.winner}
                onClick={() => handleEdgeClick('h', idx)}
                className={`absolute transition-all rounded-full ${
                  isClaimed
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : isMyTurn
                    ? 'bg-slate-700/60 hover:bg-emerald-400/80 hover:shadow-[0_0_6px_rgba(52,211,153,0.8)] cursor-pointer'
                    : 'bg-slate-800/40'
                }`}
                style={{
                  left: c * 60 + 8,
                  top: r * 60 - 3,
                  width: 44,
                  height: 6,
                }}
              />
            );
          })}

          {/* Vertical Edges (4 rows x 5 cols = 20) */}
          {Array.from({ length: 20 }).map((_, idx) => {
            const r = Math.floor(idx / 5);
            const c = idx % 5;
            const isClaimed = gameState.verticalEdges[idx];

            return (
              <button
                key={`v_edge_${idx}`}
                disabled={isClaimed || !isMyTurn || !!room.winner}
                onClick={() => handleEdgeClick('v', idx)}
                className={`absolute transition-all rounded-full ${
                  isClaimed
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : isMyTurn
                    ? 'bg-slate-700/60 hover:bg-emerald-400/80 hover:shadow-[0_0_6px_rgba(52,211,153,0.8)] cursor-pointer'
                    : 'bg-slate-800/40'
                }`}
                style={{
                  left: c * 60 - 3,
                  top: r * 60 + 8,
                  width: 6,
                  height: 44,
                }}
              />
            );
          })}

          {/* Dots (5x5 = 25 dots) */}
          {Array.from({ length: 25 }).map((_, idx) => {
            const r = Math.floor(idx / 5);
            const c = idx % 5;

            return (
              <div
                key={`dot_${idx}`}
                className="absolute w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-slate-900 pointer-events-none shadow-sm z-20"
                style={{
                  left: c * 60 - 4,
                  top: r * 60 - 4,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Rules Notice */}
      <div className="text-[11px] text-slate-400 text-center mt-2">
        <span>💡 規則：輪流連起兩點間的線條，完成封閉 1×1 方格即可佔領該格並<b>獲得連續行動獎勵</b>！</span>
      </div>
    </div>
  );
};
export default GameDotsBoxes;