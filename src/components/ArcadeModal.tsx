import React, { useState, useEffect } from 'react';
import { ArcadeRoom, GameType, UserProfile, IslandPresence } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import { Game1A2B } from './arcade/Game1A2B';
import { GameOOXX } from './arcade/GameOOXX';
import { GameBattleship } from './arcade/GameBattleship';
import { GameDotsBoxes } from './arcade/GameDotsBoxes';
import { GameSlotMachine } from './arcade/GameSlotMachine';
import { 
  X, 
  Play, 
  Users, 
  Bot, 
  Key, 
  Plus, 
  ArrowLeft, 
  Gamepad2, 
  Copy, 
  Check, 
  Anchor, 
  Box, 
  Sparkles, 
  UserPlus, 
  Trash2 
} from 'lucide-react';

interface ArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialGameType?: GameType;
  initialSoloSlots?: boolean;
  challengedPlayer?: IslandPresence | null;
  onClearChallenge?: () => void;
}

const GAME_DEFINITIONS: { id: GameType; name: string; icon: string; desc: string }[] = [
  { id: '1a2b', name: '雙人 1A2B', icon: '🔢', desc: '4位不重複數字推理對決' },
  { id: 'ooxx', name: '無限 OOXX', icon: '⭕❌', desc: '場上最多3子，下第4子消第1子' },
  { id: 'battleship', name: '海戰棋 (8×8)', icon: '🚢', desc: '佈署4艘艦隊，輪流砲擊擊沉敵軍' },
  { id: 'dots_boxes', name: '點線棋', icon: '📦', desc: '5×5點陣連線佔地，封閉格子多者勝' },
  { id: 'slots', name: '777 拉霸機', icon: '🎰', desc: '拉動機械搖桿，拚 50 倍 Jackpot 大獎！' },
];

export const ArcadeModal: React.FC<ArcadeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialGameType,
  initialSoloSlots,
  challengedPlayer,
  onClearChallenge,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<ArcadeRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<ArcadeRoom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSoloSlots, setIsSoloSlots] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialSoloSlots || initialGameType === 'slots') {
        setIsSoloSlots(true);
      } else {
        setIsSoloSlots(false);
      }
    }
  }, [isOpen, initialSoloSlots, initialGameType]);

  // Subscribe to active room changes
  useEffect(() => {
    if (!activeRoomId) {
      setRoom(null);
      return;
    }
    const unsubscribe = dbService.subscribeArcadeRoom(activeRoomId, (updatedRoom) => {
      setRoom(updatedRoom);
    });
    return () => unsubscribe();
  }, [activeRoomId]);

  // Load public rooms in lobby
  useEffect(() => {
    if (isOpen && !activeRoomId) {
      dbService.getPublicArcadeRooms().then(setPublicRooms);
    }
  }, [isOpen, activeRoomId]);

  // Auto handle incoming direct challenge
  useEffect(() => {
    if (challengedPlayer && isOpen && !activeRoomId) {
      handleCreateRoom(challengedPlayer);
    }
  }, [challengedPlayer, isOpen]);

  if (!isOpen) return null;

  // 1. Create Room FIRST (flow update: create room immediately, select game inside)
  const handleCreateRoom = async (targetPlayer?: IslandPresence) => {
    sound.playClick();
    const payload: Parameters<typeof dbService.createArcadeRoom>[0] = {
      gameType: '1a2b',
      mode: 'pvp',
      status: 'waiting',
      hostUid: currentUser.uid,
      hostName: currentUser.displayName,
      currentTurn: currentUser.uid,
      isPublic: !targetPlayer,
    };

    if (targetPlayer) {
      payload.guestUid = targetPlayer.uid;
      payload.guestName = targetPlayer.displayName;
    }

    const roomId = await dbService.createArcadeRoom(payload);
    setActiveRoomId(roomId);
    if (onClearChallenge) onClearChallenge();
  };

  // 2. Select / Change Game Inside Room
  const handleChangeGame = async (gameType: GameType) => {
    if (!activeRoomId || !room) return;
    sound.playClick();

    const updates: Partial<ArcadeRoom> = {
      gameType,
    };

    if (gameType === '1a2b') {
      updates.state1a2b = { hostGuesses: [], guestGuesses: [] };
    } else if (gameType === 'ooxx') {
      updates.stateOoxx = { mode: 'infinite', board: Array(9).fill(null), pieceHistory: [] };
    } else if (gameType === 'battleship') {
      updates.stateBattleship = {
        hostShips: [],
        guestShips: [],
        hostReady: false,
        guestReady: false,
        hostShots: [],
        guestShots: [],
      };
    } else if (gameType === 'dots_boxes') {
      updates.stateDotsBoxes = {
        horizontalEdges: Array(20).fill(false),
        verticalEdges: Array(20).fill(false),
        boxes: Array(16).fill(null),
        scores: { [room.hostUid]: 0, [room.guestUid || 'guest']: 0 },
      };
    }

    await dbService.updateArcadeRoom(activeRoomId, updates);
  };

  // 3. Add NPC Bot inside Room
  const handleAddNpc = async () => {
    if (!activeRoomId || !room) return;
    sound.playBuy();

    const updates: Partial<ArcadeRoom> = {
      mode: 'ai',
      guestUid: 'npc_bot',
      guestName: '街機小霸王 🤖',
    };

    await dbService.updateArcadeRoom(activeRoomId, updates);
  };

  // Remove NPC Bot
  const handleRemoveNpc = async () => {
    if (!activeRoomId || !room) return;
    sound.playBump();

    const updates: Partial<ArcadeRoom> = {
      mode: 'pvp',
      guestUid: undefined,
      guestName: undefined,
      status: 'waiting',
    };

    await dbService.updateArcadeRoom(activeRoomId, updates);
  };

  // 4. Start Match
  const handleStartMatch = async () => {
    if (!activeRoomId || !room) return;
    sound.playDoor();

    const updates: Partial<ArcadeRoom> = {
      status: 'playing',
      currentTurn: room.hostUid,
    };

    if (room.gameType === '1a2b') {
      updates.state1a2b = { hostGuesses: [], guestGuesses: [] };
    } else if (room.gameType === 'ooxx') {
      updates.stateOoxx = { mode: 'infinite', board: Array(9).fill(null), pieceHistory: [] };
    }

    await dbService.updateArcadeRoom(activeRoomId, updates);
  };

  // Join Room by 4-digit code
  const handleJoinRoom = async (codeToJoin?: string) => {
    const code = (codeToJoin || joinCodeInput).trim();
    if (!code) return;

    sound.playClick();
    const targetRoom = await dbService.getArcadeRoom(code);
    if (!targetRoom) {
      setErrorMessage('找不到該房號的遊戲房間！');
      sound.playBump();
      return;
    }
    if (targetRoom.status === 'playing' && targetRoom.hostUid !== currentUser.uid && targetRoom.guestUid !== currentUser.uid) {
      setErrorMessage('該房間已開始對戰或已滿員！');
      sound.playBump();
      return;
    }

    setErrorMessage(null);
    if (targetRoom.hostUid !== currentUser.uid && !targetRoom.guestUid) {
      await dbService.updateArcadeRoom(code, {
        guestUid: currentUser.uid,
        guestName: currentUser.displayName,
      });
    }

    setActiveRoomId(code);
    setJoinCodeInput('');
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
    setRoom(null);
    sound.playClick();
  };

  const handleCopyCode = () => {
    if (!activeRoomId) return;
    navigator.clipboard.writeText(activeRoomId);
    setCopiedCode(true);
    sound.playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isHost = room?.hostUid === currentUser.uid;
  const hasGuest = !!room?.guestUid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="pixel-card w-full max-w-3xl bg-[#0f172a] border-4 border-slate-900 rounded-2xl shadow-pixel-lg overflow-hidden flex flex-col h-[88vh] max-h-[660px]">
        {/* Sleek Minimalist Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕹️</span>
            <div>
              <h2 className="font-arcade text-xs sm:text-sm text-cyan-400">
                銭屋 ARCADE CENTER
              </h2>
              <p className="text-[10px] text-slate-400">8-Bit 雙人即時對戰遊樂場</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSoloSlots && (
              <button
                onClick={() => setIsSoloSlots(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 返回大廳
              </button>
            )}
            {activeRoomId && (
              <button
                onClick={handleLeaveRoom}
                className="pixel-btn px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1 border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 退出房間
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= VIEW 0: SOLO 777 SLOT MACHINE ================= */}
        {isSoloSlots ? (
          <div className="flex-1 p-3 overflow-y-auto flex items-center justify-center">
            <GameSlotMachine
              currentUid={currentUser.uid}
              userCoins={currentUser.coins}
              onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
              onDeductCoins={(amt) => dbService.rewardCoins(currentUser.uid, -amt)}
            />
          </div>
        ) : !activeRoomId ? (
          /* ================= VIEW 1: LOBBY (CREATE ROOM / JOIN) ================= */
          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto">
            <div className="w-full max-w-md flex flex-col items-center gap-4 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border-2 border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-pixel animate-bounce-gentle">
                <Gamepad2 className="w-9 h-9" />
              </div>

              <div className="text-center">
                <h3 className="font-arcade text-base text-white mb-1">
                  隨時隨地，即刻開戰！
                </h3>
                <p className="text-xs text-slate-400">
                  一鍵建立專屬房間，可邀請好友連線對決或在房內加入電腦 NPC！
                </p>
              </div>

              {/* Primary Action: CREATE ROOM FIRST */}
              <button
                onClick={() => handleCreateRoom()}
                className="pixel-btn w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm rounded-xl border-2 border-cyan-400 shadow-pixel-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>⚡ 建立對戰房間 (獲得4碼房號)</span>
              </button>

              {/* Solo 777 Slot Machine Quick Play */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsSoloSlots(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl border-2 border-purple-400/80 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
              >
                <span>🎰</span>
                <span>777 復古拉霸機 (個人即刻暢玩)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold">HOT</span>
              </button>

              {/* Join with 4-Digit Code */}
              <div className="w-full flex items-center gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="輸入 4 碼房號..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-arcade tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-400 uppercase"
                />
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={!joinCodeInput.trim()}
                  className="pixel-btn px-5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-400 font-bold text-xs rounded-xl border border-slate-600"
                >
                  加入房間
                </button>
              </div>

              {errorMessage && (
                <p className="text-rose-400 text-xs text-center font-bold animate-shake">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Public Rooms List */}
            {publicRooms.length > 0 && (
              <div className="w-full max-w-lg mt-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>等待加入的公開房間</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {publicRooms.map((r) => (
                    <div
                      key={r.roomId}
                      onClick={() => handleJoinRoom(r.roomId)}
                      className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="text-xs text-white font-bold">{r.hostName} 的房間</div>
                        <div className="text-[10px] text-cyan-400 font-arcade">#{r.roomId}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                        加入
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* ================= VIEW 2: INSIDE ROOM (WAITING / PRE-GAME) ================= */}
        {room && room.status !== 'playing' && room.status !== 'finished' && (
          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto">
            {/* Top Room Code Banner */}
            <div className="w-full max-w-xl bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-pixel-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">房間代碼:</span>
                <span className="font-arcade text-base text-cyan-400 tracking-wider">
                  #{room.roomId}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>複製房號</span>
                  </>
                )}
              </button>
            </div>

            {/* Game Selector Chips (Select Game Inside Room) */}
            <div className="w-full max-w-xl mb-4">
              <div className="text-[11px] text-slate-400 mb-2 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>選擇對戰遊戲 (房主可切換)：</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GAME_DEFINITIONS.map((g) => {
                  const isSelected = room.gameType === g.id;
                  return (
                    <button
                      key={g.id}
                      disabled={!isHost}
                      onClick={() => handleChangeGame(g.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-lg">{g.icon}</span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {g.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Players Battle Pods (Host VS Guest / NPC) */}
            <div className="flex items-center justify-center gap-4 w-full max-w-xl my-auto">
              {/* Host Card */}
              <div className="flex-1 bg-slate-950/80 border-2 border-cyan-500/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-pixel">
                <div className="w-12 h-12 rounded-full bg-cyan-900/60 border border-cyan-400 flex items-center justify-center text-2xl mb-2">
                  👑
                </div>
                <div className="text-sm font-bold text-white truncate max-w-[120px]">
                  {room.hostName}
                </div>
                <span className="text-[10px] text-cyan-400 mt-1 font-bold">房主</span>
              </div>

              {/* VS Badge */}
              <div className="font-arcade text-lg text-slate-600">VS</div>

              {/* Guest / NPC Card */}
              <div className="flex-1 bg-slate-950/80 border-2 border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center shadow-pixel min-h-[140px] justify-center">
                {hasGuest ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-purple-900/60 border border-purple-400 flex items-center justify-center text-2xl mb-2">
                      {room.guestUid === 'npc_bot' ? '🤖' : '⚔️'}
                    </div>
                    <div className="text-sm font-bold text-white truncate max-w-[120px]">
                      {room.guestName}
                    </div>
                    {room.guestUid === 'npc_bot' && isHost ? (
                      <button
                        onClick={handleRemoveNpc}
                        className="text-[10px] text-rose-400 hover:text-rose-300 mt-1.5 flex items-center gap-0.5 underline"
                      >
                        <Trash2 className="w-3 h-3" /> 移除 NPC
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 mt-1 font-bold">🟢 已連線</span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-slate-400">等待玩家加入...</span>
                    {isHost && (
                      <button
                        onClick={handleAddNpc}
                        className="pixel-btn px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg border border-purple-400 shadow-pixel flex items-center gap-1.5"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>加入電腦 NPC 🤖</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Launch Match Button */}
            <div className="w-full max-w-xl mt-4">
              {isHost ? (
                <button
                  disabled={!hasGuest}
                  onClick={handleStartMatch}
                  className="pixel-btn w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-bold text-sm rounded-xl border-2 border-emerald-400 shadow-pixel-lg flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{hasGuest ? '🚀 開始對戰！' : '等待對手或加入 NPC 後即可開始'}</span>
                </button>
              ) : (
                <div className="text-center text-xs text-amber-300 font-bold py-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  ⏳ 等待房主按下開始對戰...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: ACTIVE PLAYING GAME VIEW ================= */}
        {room && (room.status === 'playing' || room.status === 'finished') && (
          <div className="flex-1 overflow-hidden">
            {room.gameType === '1a2b' && (
              <Game1A2B
                room={room}
                currentUser={currentUser}
                onUpdateRoom={(u) => dbService.updateArcadeRoom(room.roomId, u)}
                onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
              />
            )}
            {room.gameType === 'ooxx' && (
              <GameOOXX
                room={room}
                currentUser={currentUser}
                onUpdateRoom={(u) => dbService.updateArcadeRoom(room.roomId, u)}
                onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
              />
            )}
            {room.gameType === 'battleship' && (
              <GameBattleship
                room={room}
                currentUser={currentUser}
              />
            )}
            {room.gameType === 'dots_boxes' && (
              <GameDotsBoxes
                room={room}
                currentUser={currentUser}
              />
            )}
            {room.gameType === 'slots' && (
              <div className="h-full overflow-y-auto flex items-center justify-center p-2">
                <GameSlotMachine
                  currentUid={currentUser.uid}
                  userCoins={currentUser.coins}
                  onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
                  onDeductCoins={(amt) => dbService.rewardCoins(currentUser.uid, -amt)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ArcadeModal;