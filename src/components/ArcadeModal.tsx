import React, { useState, useEffect } from 'react';
import { ArcadeRoom, GameType, UserProfile, IslandPresence } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import { Game1A2B } from './arcade/Game1A2B';
import { GameOOXX } from './arcade/GameOOXX';
import { GameBattleship } from './arcade/GameBattleship';
import { GameDotsBoxes } from './arcade/GameDotsBoxes';
import { 
  X, 
  Play, 
  Users, 
  Bot, 
  Plus, 
  ArrowLeft, 
  Gamepad2, 
  Copy, 
  Check, 
  Sparkles, 
  Trash2,
  Trophy
} from 'lucide-react';

interface ArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialGameType?: GameType;
  challengedPlayer?: IslandPresence | null;
  onClearChallenge?: () => void;
}

// 4 Classic Multiplayer & Puzzle Arcade Games (Slot Machine is strictly in Casino)
const GAME_DEFINITIONS: { id: GameType; name: string; icon: string; desc: string }[] = [
  { id: '1a2b', name: '雙人 1A2B', icon: '🔢', desc: '4位不重複數字邏輯推理' },
  { id: 'ooxx', name: '無限 OOXX', icon: '⭕❌', desc: '場上最多3子，下第4子消第1子' },
  { id: 'battleship', name: '海戰棋 (8×8)', icon: '🚢', desc: '佈署4艘艦隊，輪流砲擊擊沉敵艦' },
  { id: 'dots_boxes', name: '點線棋', icon: '📦', desc: '5×5點陣連線佔地，封閉格子獲勝' },
];

export const ArcadeModal: React.FC<ArcadeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  challengedPlayer,
  onClearChallenge,
}) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<ArcadeRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<ArcadeRoom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

  // 1. Create Room FIRST
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
    };

    await dbService.updateArcadeRoom(activeRoomId, updates);
  };

  // 4. Start Match
  const handleStartMatch = async () => {
    if (!activeRoomId || !room) return;
    if (!room.guestUid) {
      setErrorMessage('請等待對手加入，或點擊「加入電腦 NPC」！');
      sound.playBump();
      return;
    }

    sound.playWin();

    const updates: Partial<ArcadeRoom> = {
      status: room.gameType === '1a2b' ? 'setup' : 'playing',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      {/* Light Modern Japanese Theme Card (Ref: 1a2b.terry0215.com) */}
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col h-[88vh] max-h-[680px]">
        {/* Clean Light-Themed Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🕹️
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white drop-shadow-xs">
                ARCADE 街機遊樂中心
              </h2>
              <p className="text-[11px] text-indigo-100 font-medium">雙人連線推理・棋藝對決・好友即時開戰</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeRoomId && (
              <button
                onClick={handleLeaveRoom}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 離開房間
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full text-white/90 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: LOBBY (CREATE ROOM / JOIN) ================= */}
        {!activeRoomId ? (
          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto bg-slate-50/60">
            <div className="w-full max-w-md flex flex-col items-center gap-4 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Gamepad2 className="w-8 h-8" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-black text-slate-800 mb-1 tracking-tight">
                  隨時隨地，即刻開戰！
                </h3>
                <p className="text-xs text-slate-500">
                  一鍵建立專屬房間，可邀請好友輸入4碼房號連線對戰，或在房內加入電腦 NPC！
                </p>
              </div>

              {/* Primary Action: CREATE ROOM */}
              <button
                onClick={() => {
                  sound.playTaiko();
                  handleCreateRoom();
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer tracking-wide active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>建立對戰房間 (獲取4碼房號)</span>
              </button>

              {/* Join with 4-Digit Code */}
              <div className="w-full flex items-center gap-2 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  maxLength={4}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="輸入 4 碼房號..."
                  className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-center text-sm tracking-widest text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 uppercase font-mono font-bold shadow-xs"
                />
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={!joinCodeInput.trim()}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-sm cursor-pointer transition-colors"
                >
                  加入房間
                </button>
              </div>

              {errorMessage && (
                <p className="text-rose-500 text-xs text-center font-bold">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Public Rooms List */}
            {publicRooms.length > 0 && (
              <div className="w-full max-w-lg mt-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-2.5 font-bold">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>等待加入的公開對戰房</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {publicRooms.map((r) => (
                    <div
                      key={r.roomId}
                      onClick={() => handleJoinRoom(r.roomId)}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="text-xs text-slate-800 font-bold">{r.hostName} 的房間</div>
                        <div className="text-[10px] text-indigo-600 font-mono font-bold">#{r.roomId}</div>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg shadow-xs">
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
          <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-between overflow-y-auto bg-slate-50/60">
            {/* Top Room Code Banner */}
            <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">房間房號：</span>
                <span className="text-base text-indigo-600 font-mono font-black tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                  #{room.roomId}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>複製房號</span>
                  </>
                )}
              </button>
            </div>

            {/* Game Selector Chips (4 Multiplayer Games) */}
            <div className="w-full max-w-xl mb-4">
              <div className="text-xs text-slate-600 mb-2 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>選擇對戰遊戲 (房主可切換)：</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GAME_DEFINITIONS.map((g) => {
                  const isSelected = room.gameType === g.id;
                  return (
                    <button
                      key={g.id}
                      disabled={!isHost}
                      onClick={() => handleChangeGame(g.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 shadow-xs'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-xs font-bold">{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Players Battle Pods (Host VS Guest / NPC) */}
            <div className="flex items-center justify-center gap-4 w-full max-w-xl my-auto">
              {/* Host Card */}
              <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col items-center text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-2xl mb-2 shadow-xs">
                  👑
                </div>
                <div className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                  {room.hostName}
                </div>
                <span className="text-[10px] text-amber-600 mt-1 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  房主
                </span>
              </div>

              {/* VS Badge */}
              <div className="text-base font-black text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-xs">
                VS
              </div>

              {/* Guest / NPC Card */}
              <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col items-center text-center shadow-xs min-h-[140px] justify-center">
                {hasGuest ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-2xl mb-2 shadow-xs">
                      {room.guestUid === 'npc_bot' ? '🤖' : '⚔️'}
                    </div>
                    <div className="text-sm font-bold text-slate-800 truncate max-w-[120px]">
                      {room.guestName}
                    </div>
                    {room.guestUid === 'npc_bot' && isHost ? (
                      <button
                        onClick={handleRemoveNpc}
                        className="text-[10px] text-rose-500 hover:text-rose-600 mt-1.5 flex items-center gap-0.5 underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> 移除 NPC
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 mt-1 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        🟢 已就緒
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-slate-400">等待對手加入...</span>
                    {isHost && (
                      <button
                        onClick={handleAddNpc}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
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
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 tracking-wide cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{hasGuest ? '開始對戰！' : '等待對手或加入 NPC 後即可開始'}</span>
                </button>
              ) : (
                <div className="text-center text-xs text-indigo-600 font-bold py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                  ⏳ 等待房主按下開始對戰...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: ACTIVE PLAYING GAME VIEW ================= */}
        {room && (room.status === 'playing' || room.status === 'finished') && (
          <div className="flex-1 overflow-hidden bg-white">
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
          </div>
        )}
      </div>
    </div>
  );
};
export default ArcadeModal;
