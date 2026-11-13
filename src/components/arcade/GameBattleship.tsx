import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArcadeRoom, UserProfile, BattleshipShip, BattleshipCoordinate } from '../../types/game';
import { dbService } from '../../services/dbService';
import { sound } from '../../services/audio';
import confetti from 'canvas-confetti';
import { Anchor, ShieldAlert, Sparkles, RefreshCw, Trophy, Target, Waves, AlertTriangle } from 'lucide-react';

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

// Helper to generate a random valid fleet
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

  // Local placement stage before locking in
  const [myPlacedShips, setMyPlacedShips] = useState<BattleshipShip[]>(() => generateRandomFleet());
  const [hasConfirmedFleet, setHasConfirmedFleet] = useState(false);
  const [recentLog, setRecentLog] = useState<string>('佈署艦隊完成後，點擊「確認艦隊出征」！');

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

  // Auto-ready AI in single player/NPC mode
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

  // Handle Fleet Randomize
  const handleRandomize = () => {
    if (hasConfirmedFleet) return;
    sound.playClick();
    setMyPlacedShips(generateRandomFleet());
  };

  // Confirm fleet deployment
  const handleConfirmFleet = async () => {
    sound.playBuy();
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

  // Check if a coordinate hits opponent fleet
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

  // Handle Player Firing at enemy sea
  const handleFireAt = async (x: number, y: number) => {
    if (!isBothReady || !isMyTurn || room.winner) return;

    // Check if already fired at this cell
    if (myShots.some((s) => s.x === x && s.y === y)) return;

    const { hit, ship } = checkShotHit(x, y, opponentConfirmedShips);

    if (hit) {
      sound.playEmoji();
      setRecentLog(`💥 命中敵軍！(${x + 1}, ${y + 1})`);
    } else {
      sound.playBump();
      setRecentLog(`💦 落入大海水花飛濺... (${x + 1}, ${y + 1})`);
    }

    const newShot = { x, y, hit };
    const newMyShots = [...myShots, newShot];

    // Check if this shot sank the whole ship
    let opponentFleet = opponentConfirmedShips;
    if (hit && ship) {
      opponentFleet = opponentConfirmedShips.map((s) => {
        if (s.id === ship.id) {
          const newHits = s.hits + 1;
          const isSunk = newHits >= s.length;
          if (isSunk) {
            setRecentLog(`🚨 敵方【${s.name}】已被擊沉！`);
          }
          return { ...s, hits: newHits, sunk: isSunk };
        }
        return s;
      });
    }

    // Check Win Condition (12 total hits)
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
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      sound.playBuy();
      await dbService.rewardCoins(myUid, 100);
    }

    await dbService.updateArcadeRoom(room.roomId, updates);
  };

  // AI Automatic Shot Simulation
  useEffect(() => {
    if (!isAiMode || !isBothReady || room.winner || room.currentTurn !== 'npc_bot') return;

    const aiTimer = setTimeout(async () => {
      const aiShots = gameState.guestShots || [];
      const shotSet = new Set(aiShots.map((s) => `${s.x}_${s.y}`));

      // AI hunting strategy: check if recent hit has unhit neighbors
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

      // If no hunt candidate, choose random unfired cell
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

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-2 sm:p-4 bg-[#0a1128] text-white select-none overflow-y-auto">
      {/* Top Status Header */}
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-pixel-sm mb-3">
        <div className="flex items-center gap-2">
          <Anchor className="w-5 h-5 text-cyan-400" />
          <span className="font-arcade text-xs sm:text-sm text-cyan-300">
            海戰棋 (8×8 海域對決)
          </span>
        </div>

        {/* Phase / Turn Capsule */}
        <div className="text-[11px] font-bold">
          {room.winner ? (
            <span className="text-amber-300 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              {room.winner === myUid ? '🎉 你獲得了勝利 (+100金幣)！' : '💀 敵方擊沉了你的所有艦隊'}
            </span>
          ) : !isBothReady ? (
            <span className="text-amber-400 flex items-center gap-1">
              <Waves className="w-3.5 h-3.5 animate-pulse" />
              佈署艦隊階段
            </span>
          ) : isMyTurn ? (
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full animate-pulse">
              🎯 你的砲擊回合
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/50 rounded-full">
              ⏳ 對手瞄準中...
            </span>
          )}
        </div>
      </div>

      {/* Main Boards Area */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full max-w-4xl">
        {/* Board 1: Enemy Target Grid (Interactive during Battle) */}
        <div className="flex flex-col items-center bg-slate-900/80 border border-cyan-800/80 rounded-xl p-3 shadow-pixel">
          <div className="flex items-center justify-between w-full mb-2 px-1 text-xs">
            <span className="text-cyan-300 font-bold flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> 敵方未知海域 (點擊砲擊)
            </span>
            <span className="text-[11px] text-cyan-400/80 font-mono">
              命中: {totalHitsOnOpponent} / 12
            </span>
          </div>

          {/* 8x8 Sea Grid */}
          <div className="grid grid-cols-8 gap-1 bg-[#031326] p-1.5 border border-cyan-700/60 rounded-lg">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);
              const shot = myShots.find((s) => s.x === x && s.y === y);

              return (
                <button
                  key={`target_${x}_${y}`}
                  disabled={!isBothReady || !isMyTurn || !!shot || !!room.winner}
                  onClick={() => handleFireAt(x, y)}
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded flex items-center justify-center transition-all ${
                    shot
                      ? shot.hit
                        ? 'bg-rose-600 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                        : 'bg-slate-700/80 border border-slate-600 text-slate-400'
                      : isBothReady && isMyTurn
                      ? 'bg-cyan-950/80 hover:bg-cyan-800/80 border border-cyan-800/50 cursor-crosshair'
                      : 'bg-cyan-950/40 border border-cyan-900/30'
                  }`}
                >
                  {shot ? (
                    shot.hit ? (
                      <span className="text-sm animate-bounce-gentle">💥</span>
                    ) : (
                      <span className="text-xs">💦</span>
                    )
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Board 2: My Fleet Grid (Defense Overview) */}
        <div className="flex flex-col items-center bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 shadow-pixel">
          <div className="flex items-center justify-between w-full mb-2 px-1 text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              🛡️ 我方艦隊佈置
            </span>
            <span className="text-[11px] text-rose-400 font-mono">
              遭擊中: {totalHitsOnMe} / 12
            </span>
          </div>

          {/* 8x8 Defense Grid */}
          <div className="grid grid-cols-8 gap-1 bg-[#061826] p-1.5 border border-slate-700/60 rounded-lg">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);

              // Check if current cell has my ship
              const displayShips = hasConfirmedFleet ? myConfirmedShips : myPlacedShips;
              const hasShip = displayShips.some((s) => s.coords.some((c) => c.x === x && c.y === y));
              const enemyShot = opponentShots.find((s) => s.x === x && s.y === y);

              return (
                <div
                  key={`my_${x}_${y}`}
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded flex items-center justify-center border ${
                    enemyShot
                      ? enemyShot.hit
                        ? 'bg-rose-700 border-rose-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                      : hasShip
                      ? 'bg-emerald-600/80 border-emerald-400/80 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-950/50 border-slate-800/40'
                  }`}
                >
                  {enemyShot ? (
                    enemyShot.hit ? (
                      <span className="text-xs">💥</span>
                    ) : (
                      <span className="text-[10px]">💦</span>
                    )
                  ) : hasShip ? (
                    <span className="text-[10px] text-emerald-200 font-bold">🚢</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Command Center */}
      <div className="w-full max-w-2xl mt-3 flex flex-col items-center gap-2">
        {/* Battle Log Bar */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-center text-xs text-slate-300">
          <span>{recentLog}</span>
        </div>

        {/* Action Controls for Deployment Phase */}
        {!hasConfirmedFleet && (
          <div className="flex items-center gap-2 w-full justify-center">
            <button
              onClick={handleRandomize}
              className="pixel-btn px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-600 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>隨機重新佈陣</span>
            </button>

            <button
              onClick={handleConfirmFleet}
              className="pixel-btn px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg border-2 border-emerald-600 shadow-pixel flex items-center gap-1.5"
            >
              <Anchor className="w-4 h-4" />
              <span>確認艦隊出征！</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default GameBattleship;