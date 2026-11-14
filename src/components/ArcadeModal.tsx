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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="pixel-card w-full max-w-3xl bg-[#1c0d06] border-4 border-[#8b4513] rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[88vh] max-h-[660px] font-serif text-[#fef08a]">
        {/* Japanese Showa Lacquer Header */}
        <div className="px-4 py-3 bg-[#150a04] border-b-2 border-[#8b4513] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏮</span>
            <div>
              <h2 className="text-xs sm:text-base font-bold text-[#fef08a] tracking-wider flex items-center gap-1.5">
                {isSoloSlots ? '銭屋 777 復古拉霸娛樂城 🎰' : '銭屋遊台・祭典對弈館 (ARCADE) 🕹️'}
              </h2>
              <p className="text-[10px] text-[#fed7aa]">昭和傳統遊台・好友即時連線對戰</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSoloSlots && (
              <button
                onClick={() => {
                  sound.playClick();
                  setIsSoloSlots(false);
                }}
                className="px-2.5 py-1 bg-[#33180c] hover:bg-[#451e0e] text-[#fed7aa] text-xs rounded-lg flex items-center gap-1 border border-[#8b4513] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" /> 返回大廳
              </button>
            )}
            {activeRoomId && (
              <button
                onClick={handleLeaveRoom}
                className="px-2.5 py-1 bg-[#33180c] hover:bg-[#451e0e] text-[#fed7aa] text-xs rounded-lg flex items-center gap-1 border border-[#8b4513] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-rose-400" /> 退出房間
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#33180c] rounded-lg text-[#fed7aa] hover:text-white cursor-pointer transition-colors"
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
              <div className="w-16 h-16 rounded-2xl bg-[#2d140a] border-2 border-[#b45309] flex items-center justify-center text-[#fef08a] shadow-[0_0_15px_rgba(180,83,9,0.5)]">
                <Gamepad2 className="w-9 h-9 text-amber-400" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-[#fef08a] mb-1 tracking-wide">
                  隨時隨地，即刻開戰！
                </h3>
                <p className="text-xs text-[#fed7aa]">
                  一鍵建立專屬房間，可邀請好友連線對決或在房內加入電腦 NPC！
                </p>
              </div>

              {/* Primary Action: CREATE ROOM FIRST */}
              <button
                onClick={() => {
                  sound.playTaiko();
                  handleCreateRoom();
                }}
                className="w-full py-3 bg-[#991b1b] hover:bg-[#b91c1c] text-[#fef08a] font-bold text-sm rounded-xl border-2 border-[#f59e0b] shadow-lg flex items-center justify-center gap-2 cursor-pointer tracking-wider active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>⚡ 建立對戰房間 (獲得4碼房號)</span>
              </button>

              {/* Solo 777 Slot Machine Quick Play */}
              <button
                onClick={() => {
                  sound.playTaiko();
                  setIsSoloSlots(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#b45309] hover:from-[#d97706] hover:to-[#f59e0b] text-[#fef08a] font-bold text-xs sm:text-sm rounded-xl border-2 border-[#fde047] shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all tracking-wide"
              >
                <span>🎰</span>
                <span>777 復古拉霸機 (個人即刻暢玩)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#991b1b] text-[#fef08a] border border-[#fde047] font-extrabold">熱門</span>
              </button>

              {/* Join with 4-Digit Code */}
              <div className="w-full flex items-center gap-2 pt-2 border-t border-[#8b4513]/60">
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="輸入 4 碼房號..."
                  className="flex-1 bg-[#150a04] border border-[#8b4513] rounded-xl px-3 py-2 text-center text-sm tracking-widest text-[#fef08a] placeholder:text-[#fed7aa]/40 focus:outline-hidden focus:border-[#f59e0b] uppercase font-mono font-bold"
                />
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={!joinCodeInput.trim()}
                  className="px-5 py-2 bg-[#3a1d0d] hover:bg-[#4a2411] disabled:opacity-50 text-[#fef08a] font-bold text-xs rounded-xl border border-[#b45309] cursor-pointer"
                >
                  加入房間
                </button>
              </div>

              {errorMessage && (
                <p className="text-rose-400 text-xs text-center font-bold">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Public Rooms List */}
            {publicRooms.length > 0 && (
              <div className="w-full max-w-lg mt-4 bg-[#150a04] border border-[#8b4513] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-[#fed7aa] mb-2 font-bold">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>等待加入的公開遊台</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {publicRooms.map((r) => (
                    <div
                      key={r.roomId}
                      onClick={() => handleJoinRoom(r.roomId)}
                      className="p-2.5 bg-[#2a140a] hover:bg-[#3a1c0d] border border-[#78350f] rounded-lg flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="text-xs text-[#fef08a] font-bold">{r.hostName} 的房間</div>
                        <div className="text-[10px] text-amber-400 font-mono">#{r.roomId}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-[#1a3818] text-[#86efac] border border-[#22c55e] rounded-full">
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
            <div className="w-full max-w-xl bg-[#150a04] border-2 border-[#8b4513] rounded-xl p-3 flex items-center justify-between shadow-md mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#fed7aa]">房間木籤代碼:</span>
                <span className="text-base text-[#fbbf24] font-mono font-bold tracking-wider">
                  #{room.roomId}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-[#33180c] hover:bg-[#451e0e] text-[#fed7aa] text-xs rounded-lg border border-[#8b4513] flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>複製房號</span>
                  </>
                )}
              </button>
            </div>

            {/* Game Selector Chips (Select Game Inside Room) */}
            <div className="w-full max-w-xl mb-4">
              <div className="text-[11px] text-[#fed7aa] mb-2 font-bold flex items-center gap-1">
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
                          ? 'bg-[#852a12] border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-[#2a140a] border-[#78350f] hover:border-[#b45309]'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-lg">{g.icon}</span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#fef08a]' : 'text-[#fed7aa]'}`}>
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
              <div className="flex-1 bg-[#150a04] border-2 border-[#b45309] rounded-2xl p-4 flex flex-col items-center text-center shadow-md">
                <div className="w-12 h-12 rounded-full bg-[#3a1d0d] border border-amber-400 flex items-center justify-center text-2xl mb-2">
                  👑
                </div>
                <div className="text-sm font-bold text-[#fef08a] truncate max-w-[120px]">
                  {room.hostName}
                </div>
                <span className="text-[10px] text-amber-400 mt-1 font-bold">房主</span>
              </div>

              {/* VS Badge */}
              <div className="text-lg font-bold text-amber-500/80">VS</div>

              {/* Guest / NPC Card */}
              <div className="flex-1 bg-[#150a04] border-2 border-[#8b4513] rounded-2xl p-4 flex flex-col items-center text-center shadow-md min-h-[140px] justify-center">
                {hasGuest ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#3a1d0d] border border-rose-400 flex items-center justify-center text-2xl mb-2">
                      {room.guestUid === 'npc_bot' ? '🤖' : '⚔️'}
                    </div>
                    <div className="text-sm font-bold text-[#fef08a] truncate max-w-[120px]">
                      {room.guestName}
                    </div>
                    {room.guestUid === 'npc_bot' && isHost ? (
                      <button
                        onClick={handleRemoveNpc}
                        className="text-[10px] text-rose-400 hover:text-rose-300 mt-1.5 flex items-center gap-0.5 underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> 移除 NPC
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 mt-1 font-bold">🟢 已連線</span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-[#fed7aa]/70">等待玩家加入...</span>
                    {isHost && (
                      <button
                        onClick={handleAddNpc}
                        className="px-3 py-1.5 bg-[#3a1d0d] hover:bg-[#4a2411] text-[#fef08a] text-xs font-bold rounded-lg border border-[#b45309] shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5 text-amber-400" />
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
                  className="w-full py-3 bg-[#991b1b] hover:bg-[#b91c1c] disabled:opacity-40 text-[#fef08a] font-bold text-sm rounded-xl border-2 border-[#f59e0b] shadow-lg flex items-center justify-center gap-2 tracking-wider cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{hasGuest ? '🚀 開始對戰！' : '等待對手或加入 NPC 後即可開始'}</span>
                </button>
              ) : (
                <div className="text-center text-xs text-[#fbbf24] font-bold py-3 bg-[#150a04] rounded-xl border border-[#8b4513]">
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
      </div>
    </div>
  );
};
export default ArcadeModal;