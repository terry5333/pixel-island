import React, { useEffect } from 'react';
import { ArcadeRoom, UserProfile } from '../../types/game';
import { dbService } from '../../services/dbService';
import { sound } from '../../services/audio';
import confetti from 'canvas-confetti';
import { Trophy, Box } from 'lucide-react';

interface GameDotsBoxesProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
}

const BOXES_COUNT = 16;

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
      sound.playWin();
    }

    const keepTurn = completedCount > 0;
    const nextTurn = keepTurn ? myUid : (isAiMode ? 'npc_bot' : opponentUid);

    const allClaimed = newBoxes.every((b) => b !== null);
    let winner: string | 'draw' | undefined = undefined;

    if (allClaimed) {
      const myFinalScore = newScores[myUid] || 0;
      const oppFinalScore = newScores[opponentUid || 'npc_bot'] || 0;
      if (myFinalScore > oppFinalScore) {
        winner = myUid;
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        sound.playWin();
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

  // AI loop
  useEffect(() => {
    if (!isAiMode || room.winner || isFinished || room.currentTurn !== 'npc_bot') return;

    const aiTimer = setTimeout(async () => {
      const hEdges = [...gameState.horizontalEdges];
      const vEdges = [...gameState.verticalEdges];
      const currentBoxes = [...gameState.boxes];
      const aiUid = 'npc_bot';

      let chosenType: 'h' | 'v' | null = null;
      let chosenIndex = -1;

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

  const isWinner = room.status === 'finished' && room.winner === myUid;
  const isLoser = room.status === 'finished' && room.winner && room.winner !== myUid;

  return (
    <div className="flex flex-col h-full bg-[#F7F3E9] text-[#2D1E18] font-serif select-none">
      {/* 1. Header Masthead with Double Border & Noto Serif Typography */}
      <div className="p-3 sm:p-4 bg-[#FFFDF9] border-b-4 border-double border-[#5D4037] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_4px_rgba(93,64,55,0.06)]">
        <div>
          <div className="text-[10px] sm:text-xs text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
            - TERRITORY GRID EXPANSION PROTOCOL -
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-[#2D1E18] flex items-center gap-2">
            <span>方格點線棋 領地測繪試驗</span>
            <span className="text-xs px-2 py-0.5 border border-[#5D4037] bg-[#F7F3E9] text-[#5D4037] font-semibold tracking-normal">
              5×5 點陣公文圖
            </span>
          </h2>
        </div>

        {/* Turn Status */}
        <div className="text-xs font-bold">
          {room.winner ? (
            <span className="text-[#C62828] font-black flex items-center gap-1">
              <Trophy className="w-4 h-4 text-[#C62828]" />
              {room.winner === myUid ? '領地擴張大成！測繪合格（金幣 +100）' : '試驗終結，對手佔得更多領地'}
            </span>
          ) : isMyTurn ? (
            <span className="px-3 py-1 bg-[#FFFDF9] border-2 border-[#C62828] text-[#C62828] shadow-[3px_3px_0px_#C62828] animate-pulse">
              輪到我方劃線！完成封閉方格得連續行動
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#F7F3E9] border-2 border-dashed border-[#5D4037] text-[#5D4037]">
              對手繪線思索中，請靜候...
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 relative overflow-y-auto">
        {/* Victory Seal Stamp */}
        {room.status === 'finished' && (
          <div className="absolute top-2 right-4 pointer-events-none z-20">
            <div
              className={`w-24 h-24 rounded-full border-4 border-double border-[#C62828] flex flex-col items-center justify-center text-[#C62828] font-black tracking-widest ${
                isWinner ? 'animate-stamp' : 'opacity-85'
              }`}
              style={{ transform: 'rotate(-10deg)' }}
            >
              <span className="text-[10px] border-b border-[#C62828] pb-0.5">地圖測繪局</span>
              <span className="text-base sm:text-lg">{isWinner ? '合 格' : isLoser ? '完 局' : '平 局'}</span>
            </div>
          </div>
        )}

        {/* Score Dossier with Double Border */}
        <div className="flex items-center justify-center gap-4 w-full max-w-md mb-4">
          <div className={`flex-1 p-2.5 bg-[#FFFDF9] border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex items-center justify-between ${isMyTurn ? 'ring-2 ring-[#C62828]' : ''}`}>
            <div>
              <div className="text-[10px] text-[#8D6E63] font-bold">我方佔領格數</div>
              <div className="text-xs font-black text-[#2D1E18] truncate">{currentUser.displayName}</div>
            </div>
            <div className="text-3xl font-black text-[#C62828] tracking-tight">{myScore}</div>
          </div>

          <div className="text-sm font-black text-[#5D4037]">對</div>

          <div className={`flex-1 p-2.5 bg-[#FFFDF9] border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex items-center justify-between ${!isMyTurn && !room.winner ? 'ring-2 ring-[#1A237E]' : ''}`}>
            <div>
              <div className="text-[10px] text-[#8D6E63] font-bold">對手佔領格數</div>
              <div className="text-xs font-black text-[#2D1E18] truncate">{room.guestName || (isAiMode ? '測繪官 AI' : '對手')}</div>
            </div>
            <div className="text-3xl font-black text-[#1A237E] tracking-tight">{opponentScore}</div>
          </div>
        </div>

        {/* 5x5 Dots & 4x4 Boxes Grid Board */}
        <div className="relative p-6 sm:p-8 bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] my-auto">
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
                  className={`absolute transition-all duration-300 flex items-center justify-center border-2 border-dashed ${
                    ownerUid
                      ? isMyBox
                        ? 'bg-red-50 border-[#C62828]'
                        : 'bg-blue-50 border-[#1A237E]'
                      : 'border-transparent'
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
                      className={`text-lg font-black tracking-tight ${
                        isMyBox ? 'text-[#C62828]' : 'text-[#1A237E]'
                      }`}
                    >
                      {isMyBox ? '領' : '地'}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Horizontal Edges */}
            {Array.from({ length: 20 }).map((_, idx) => {
              const r = Math.floor(idx / 4);
              const c = idx % 4;
              const isClaimed = gameState.horizontalEdges[idx];

              return (
                <button
                  key={`h_edge_${idx}`}
                  disabled={isClaimed || !isMyTurn || !!room.winner}
                  onClick={() => handleEdgeClick('h', idx)}
                  className={`absolute transition-all rounded-xs ${
                    isClaimed
                      ? 'bg-[#5D4037] shadow-[2px_2px_0px_#2D1E18]'
                      : isMyTurn
                      ? 'bg-[#D7CCC8] hover:bg-[#A1887F] cursor-pointer'
                      : 'bg-[#EFEBE4]'
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

            {/* Vertical Edges */}
            {Array.from({ length: 20 }).map((_, idx) => {
              const r = Math.floor(idx / 5);
              const c = idx % 5;
              const isClaimed = gameState.verticalEdges[idx];

              return (
                <button
                  key={`v_edge_${idx}`}
                  disabled={isClaimed || !isMyTurn || !!room.winner}
                  onClick={() => handleEdgeClick('v', idx)}
                  className={`absolute transition-all rounded-xs ${
                    isClaimed
                      ? 'bg-[#5D4037] shadow-[2px_2px_0px_#2D1E18]'
                      : isMyTurn
                      ? 'bg-[#D7CCC8] hover:bg-[#A1887F] cursor-pointer'
                      : 'bg-[#EFEBE4]'
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

            {/* Dots */}
            {Array.from({ length: 25 }).map((_, idx) => {
              const r = Math.floor(idx / 5);
              const c = idx % 5;

              return (
                <div
                  key={`dot_${idx}`}
                  className="absolute w-3.5 h-3.5 rounded-full bg-[#5D4037] border-2 border-[#2D1E18] pointer-events-none shadow-sm z-20"
                  style={{
                    left: c * 60 - 4,
                    top: r * 60 - 4,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Rule note */}
        <div className="mt-4 px-4 py-1.5 border-2 border-dashed border-[#5D4037] bg-[#FFFDF9] text-xs text-[#5D4037] text-center">
          💡 測繪法規：輪流連接兩點間線條，完成封閉方格者即刻佔領該領地，並得連續行動一次。
        </div>
      </div>
    </div>
  );
};
export default GameDotsBoxes;
