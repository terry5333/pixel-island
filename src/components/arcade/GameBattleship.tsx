import React, { useState, useEffect } from 'react';
import { ArcadeRoom, UserProfile, BattleshipShip, BattleshipCoordinate } from '../../types/game';
import { dbService } from '../../services/dbService';
import { sound } from '../../services/audio';
import confetti from 'canvas-confetti';
import { Anchor, Trophy, Target, RefreshCw } from 'lucide-react';

interface GameBattleshipProps {
  room: ArcadeRoom;
  currentUser: UserProfile;
}

const GRID_SIZE = 8;
const FLEET_TEMPLATE = [
  { id: 'carrier', name: '航空母艦 (4格)', length: 4 },
  { id: 'battleship', name: '無畏戰列艦 (3格)', length: 3 },
  { id: 'cruiser', name: '神盾巡洋艦 (3格)', length: 3 },
  { id: 'destroyer', name: '突擊驅逐艦 (2格)', length: 2 },
];
const TOTAL_SHIP_CELLS = 12;

function generateRandomFleet(): BattleshipShip[] {
  const ships: BattleshipShip[] = [];
  const occupied = new Set<string>();

  for (const t of FLEET_TEMPLATE) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const horizontal = Math.random() > 0.5;
      const x = horizontal
        ? Math.floor(Math.random() * (GRID_SIZE - t.length + 1))
        : Math.floor(Math.random() * GRID_SIZE);
      const y = horizontal
        ? Math.floor(Math.random() * GRID_SIZE)
        : Math.floor(Math.random() * (GRID_SIZE - t.length + 1));

      const coords: BattleshipCoordinate[] = [];
      let overlap = false;
      for (let i = 0; i < t.length; i++) {
        const cx = horizontal ? x + i : x;
        const cy = horizontal ? y : y + i;
        if (occupied.has(`${cx}_${cy}`)) {
          overlap = true;
          break;
        }
        coords.push({ x: cx, y: cy });
      }

      if (!overlap) {
        coords.forEach((c) => occupied.add(`${c.x}_${c.y}`));
        ships.push({
          id: t.id,
          name: t.name,
          length: t.length,
          coords,
          hits: 0,
          sunk: false,
        });
        placed = true;
      }
    }
  }
  return ships;
}

export const GameBattleship: React.FC<GameBattleshipProps> = ({ room, currentUser }) => {
  const isHost = currentUser.uid === room.hostUid;
  const isAiMode = room.mode === 'ai' || room.guestUid === 'npc_bot';
  const myUid = currentUser.uid;
  const opponentUid = isHost ? room.guestUid : room.hostUid;

  const [myPlacedShips, setMyPlacedShips] = useState<BattleshipShip[]>(() => generateRandomFleet());
  const [hasConfirmedFleet, setHasConfirmedFleet] = useState(false);
  const [recentLog, setRecentLog] = useState<string>('佈署艦隊完成後，請點擊「確認艦隊出征呈報」！');

  const gameState = room.stateBattleship || {
    hostShips: [],
    guestShips: [],
    hostReady: false,
    guestReady: false,
    hostShots: [],
    guestShots: [],
  };

  const myShots = isHost ? gameState.hostShots : gameState.guestShots;
  const opponentShots = isHost ? gameState.guestShots : gameState.hostShots;
  const myConfirmedShips = isHost ? gameState.hostShips : gameState.guestShips;
  const opponentConfirmedShips = isHost ? gameState.guestShips : gameState.hostShips;

  const isBothReady = gameState.hostReady && gameState.guestReady;
  const isMyTurn = room.currentTurn === myUid;

  useEffect(() => {
    if (isAiMode && isHost && !gameState.guestReady) {
      const aiFleet = generateRandomFleet();
      dbService.updateArcadeRoom(room.roomId, {
        stateBattleship: {
          ...gameState,
          guestShips: aiFleet,
          guestReady: true,
        },
      });
    }
  }, [isAiMode, isHost, gameState.guestReady]);

  const handleRandomize = () => {
    if (hasConfirmedFleet) return;
    sound.playClick();
    setMyPlacedShips(generateRandomFleet());
  };

  const handleConfirmFleet = async () => {
    sound.playTaiko();
    setHasConfirmedFleet(true);
    const updated = { ...gameState };
    if (isHost) {
      updated.hostShips = myPlacedShips;
      updated.hostReady = true;
    } else {
      updated.guestShips = myPlacedShips;
      updated.guestReady = true;
    }
    await dbService.updateArcadeRoom(room.roomId, {
      stateBattleship: updated,
      currentTurn: room.hostUid,
    });
  };

  const checkShotHit = (x: number, y: number, ships: BattleshipShip[]) => {
    for (const ship of ships) {
      for (const c of ship.coords) {
        if (c.x === x && c.y === y) {
          return { hit: true, ship };
        }
      }
    }
    return { hit: false, ship: null };
  };

  const handleFireAt = async (x: number, y: number) => {
    if (!isBothReady || !isMyTurn || room.winner) return;
    if (myShots.some((s) => s.x === x && s.y === y)) return;

    const { hit, ship } = checkShotHit(x, y, opponentConfirmedShips);

    if (hit) {
      sound.playTaiko();
      setRecentLog(`💥 砲火命中敵艦！座標 (${x + 1}, ${y + 1})`);
    } else {
      sound.playBump();
      setRecentLog(`💦 砲彈落海激起水花... 座標 (${x + 1}, ${y + 1})`);
    }

    const newShot = { x, y, hit };
    const newMyShots = [...myShots, newShot];

    let opponentFleet = opponentConfirmedShips;
    if (hit && ship) {
      opponentFleet = opponentConfirmedShips.map((s) => {
        if (s.id === ship.id) {
          const newHits = s.hits + 1;
          const isSunk = newHits >= s.length;
          if (isSunk) {
            setRecentLog(`🚨 捷報！敵方【${s.name}】已被擊沉！`);
          }
          return { ...s, hits: newHits, sunk: isSunk };
        }
        return s;
      });
    }

    const totalHits = newMyShots.filter((s) => s.hit).length;
    const isVictorious = totalHits >= TOTAL_SHIP_CELLS;

    const updatedState = { ...gameState };
    if (isHost) {
      updatedState.hostShots = newMyShots;
      updatedState.guestShips = opponentFleet;
    } else {
      updatedState.guestShots = newMyShots;
      updatedState.hostShips = opponentFleet;
    }

    const updates: Partial<ArcadeRoom> = {
      stateBattleship: updatedState,
      currentTurn: isAiMode ? 'npc_bot' : opponentUid,
    };

    if (isVictorious) {
      updates.winner = myUid;
      updates.status = 'finished';
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      sound.playWin();
      await dbService.rewardCoins(myUid, 100);
    }

    await dbService.updateArcadeRoom(room.roomId, updates);
  };

  // AI simulation
  useEffect(() => {
    if (!isAiMode || !isBothReady || room.winner || room.currentTurn !== 'npc_bot') return;

    const aiTimer = setTimeout(async () => {
      const aiShots = gameState.guestShots || [];
      const shotSet = new Set(aiShots.map((s) => `${s.x}_${s.y}`));

      let targetX = -1;
      let targetY = -1;
      const recentHits = aiShots.filter((s) => s.hit);

      for (const h of recentHits) {
        const neighbors = [
          { x: h.x + 1, y: h.y },
          { x: h.x - 1, y: h.y },
          { x: h.x, y: h.y + 1 },
          { x: h.x, y: h.y - 1 },
        ].filter(
          (n) => n.x >= 0 && n.x < GRID_SIZE && n.y >= 0 && n.y < GRID_SIZE && !shotSet.has(`${n.x}_${n.y}`)
        );

        if (neighbors.length > 0) {
          const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
          targetX = chosen.x;
          targetY = chosen.y;
          break;
        }
      }

      if (targetX === -1) {
        const available: BattleshipCoordinate[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            if (!shotSet.has(`${x}_${y}`)) {
              available.push({ x, y });
            }
          }
        }
        if (available.length > 0) {
          const randomCell = available[Math.floor(Math.random() * available.length)];
          targetX = randomCell.x;
          targetY = randomCell.y;
        }
      }

      if (targetX !== -1 && targetY !== -1) {
        const { hit, ship } = checkShotHit(targetX, targetY, gameState.hostShips);
        const newAiShots = [...aiShots, { x: targetX, y: targetY, hit }];

        let updatedHostFleet = gameState.hostShips;
        if (hit && ship) {
          updatedHostFleet = gameState.hostShips.map((s) => {
            if (s.id === ship.id) {
              const newHits = s.hits + 1;
              return { ...s, hits: newHits, sunk: newHits >= s.length };
            }
            return s;
          });
        }

        const aiTotalHits = newAiShots.filter((s) => s.hit).length;
        const aiWins = aiTotalHits >= TOTAL_SHIP_CELLS;

        const updatedState = {
          ...gameState,
          guestShots: newAiShots,
          hostShips: updatedHostFleet,
        };

        const updates: Partial<ArcadeRoom> = {
          stateBattleship: updatedState,
          currentTurn: room.hostUid,
        };

        if (aiWins) {
          updates.winner = 'npc_bot';
          updates.status = 'finished';
        }

        await dbService.updateArcadeRoom(room.roomId, updates);
      }
    }, 900);

    return () => clearTimeout(aiTimer);
  }, [isAiMode, isBothReady, room.currentTurn, room.winner]);

  const totalHitsOnOpponent = myShots.filter((s) => s.hit).length;
  const totalHitsOnMe = opponentShots.filter((s) => s.hit).length;
  const isWinner = room.status === 'finished' && room.winner === myUid;
  const isLoser = room.status === 'finished' && room.winner && room.winner !== myUid;

  return (
    <div className="flex flex-col h-full bg-[#F7F3E9] text-[#2D1E18] font-serif select-none">
      {/* 1. Header Masthead with Double Border & Noto Serif Typography */}
      <div className="p-3 sm:p-4 bg-[#FFFDF9] border-b-4 border-double border-[#5D4037] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_2px_4px_rgba(93,64,55,0.06)]">
        <div>
          <div className="text-[10px] sm:text-xs text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
            - NAVAL STRATEGIC GRID SIMULATION -
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-[#2D1E18] flex items-center gap-2">
            <span>帝國海戰棋 戰術試驗</span>
            <span className="text-xs px-2 py-0.5 border border-[#5D4037] bg-[#F7F3E9] text-[#5D4037] font-semibold tracking-normal">
              8×8 海象公文圖
            </span>
          </h2>
        </div>

        {/* Phase Capsule */}
        <div className="text-xs font-bold">
          {room.winner ? (
            <span className="text-[#C62828] font-black flex items-center gap-1">
              <Trophy className="w-4 h-4 text-[#C62828]" />
              {room.winner === myUid ? '海戰大捷！全殲敵軍（金幣 +100）' : '我軍艦隊全數沈沒，戰術失利'}
            </span>
          ) : !isBothReady ? (
            <span className="px-3 py-1 bg-[#F7F3E9] border-2 border-dashed border-[#5D4037] text-[#5D4037]">
              佈署艦隊公文呈報階段
            </span>
          ) : isMyTurn ? (
            <span className="px-3 py-1 bg-[#FFFDF9] border-2 border-[#C62828] text-[#C62828] shadow-[3px_3px_0px_#C62828] animate-pulse">
              輪到我方砲擊！請指派目標海域
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#F7F3E9] border-2 border-dashed border-[#5D4037] text-[#5D4037]">
              敵方觀測瞄準中，請嚴密防守...
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
              <span className="text-[10px] border-b border-[#C62828] pb-0.5">海軍省公認</span>
              <span className="text-base sm:text-lg">{isWinner ? '大 捷' : isLoser ? '沈 沒' : '停 戰'}</span>
            </div>
          </div>
        )}

        {/* Status Log Bar */}
        <div className="w-full max-w-3xl mb-3 px-4 py-2 border-2 border-dashed border-[#5D4037] bg-[#FFFDF9] text-xs sm:text-sm text-center font-bold text-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
          {recentLog}
        </div>

        {/* Side-by-Side Nav-Charts */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full max-w-4xl">
          {/* Target Sea (Enemy) */}
          <div className="flex flex-col items-center bg-[#FFFDF9] border-4 border-[#5D4037] p-3 shadow-[6px_6px_0px_#5D4037]">
            <div className="flex items-center justify-between w-full mb-2 pb-1 border-b-2 border-dashed border-[#5D4037] text-xs font-bold">
              <span className="text-[#C62828] flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> 敵方未知海圖（點擊砲擊）
              </span>
              <span className="text-[#5D4037] font-mono">
                命中彈數：{totalHitsOnOpponent} / 12
              </span>
            </div>

            {/* 8x8 Sea Grid */}
            <div className="grid grid-cols-8 gap-1 p-2 bg-[#F7F3E9] border-2 border-[#5D4037]">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);
                const shot = myShots.find((s) => s.x === x && s.y === y);

                return (
                  <button
                    key={`target_${x}_${y}`}
                    disabled={!isBothReady || !isMyTurn || !!shot || !!room.winner}
                    onClick={() => handleFireAt(x, y)}
                    className={`w-7 h-7 sm:w-9 sm:h-9 border border-[#5D4037] flex items-center justify-center transition-all ${
                      shot
                        ? shot.hit
                          ? 'bg-[#C62828] text-white font-black'
                          : 'bg-[#D7CCC8] text-[#5D4037]'
                        : isBothReady && isMyTurn
                        ? 'bg-[#FFFDF9] hover:bg-amber-100 cursor-crosshair active:scale-95'
                        : 'bg-[#FFFDF9] opacity-75'
                    }`}
                  >
                    {shot ? (
                      shot.hit ? (
                        <span className="text-xs">💥</span>
                      ) : (
                        <span className="text-[10px]">💦</span>
                      )
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Defense Sea (My Fleet) */}
          <div className="flex flex-col items-center bg-[#FFFDF9] border-4 border-[#5D4037] p-3 shadow-[6px_6px_0px_#5D4037]">
            <div className="flex items-center justify-between w-full mb-2 pb-1 border-b-2 border-dashed border-[#5D4037] text-xs font-bold">
              <span className="text-[#1A237E] flex items-center gap-1">
                🛡️ 我方防守海域佈署
              </span>
              <span className="text-[#C62828] font-mono">
                受損彈數：{totalHitsOnMe} / 12
              </span>
            </div>

            {/* 8x8 Defense Grid */}
            <div className="grid grid-cols-8 gap-1 p-2 bg-[#F7F3E9] border-2 border-[#5D4037]">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);

                const displayShips = hasConfirmedFleet ? myConfirmedShips : myPlacedShips;
                const hasShip = displayShips.some((s) => s.coords.some((c) => c.x === x && c.y === y));
                const enemyShot = opponentShots.find((s) => s.x === x && s.y === y);

                return (
                  <div
                    key={`my_${x}_${y}`}
                    className={`w-7 h-7 sm:w-9 sm:h-9 border border-[#5D4037] flex items-center justify-center ${
                      enemyShot
                        ? enemyShot.hit
                          ? 'bg-[#C62828] text-white'
                          : 'bg-[#D7CCC8] text-[#5D4037]'
                        : hasShip
                        ? 'bg-[#1A237E] text-white'
                        : 'bg-[#FFFDF9]'
                    }`}
                  >
                    {enemyShot ? (
                      enemyShot.hit ? (
                        <span className="text-xs">💥</span>
                      ) : (
                        <span className="text-[10px]">💦</span>
                      )
                    ) : hasShip ? (
                      <span className="text-[10px]">🚢</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fleet Deployment Controls */}
        {!hasConfirmedFleet && (
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleRandomize}
              className="px-4 py-2 bg-[#FFFDF9] text-[#5D4037] text-xs font-bold border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>隨機重新佈署</span>
            </button>

            <button
              onClick={handleConfirmFleet}
              className="px-6 py-2 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFDF9] text-xs sm:text-sm font-black tracking-widest border-2 border-[#2D1E18] shadow-[4px_4px_0px_#2D1E18] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center gap-1.5 cursor-pointer"
            >
              <Anchor className="w-4 h-4" />
              <span>確認艦隊出征呈報！</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default GameBattleship;
