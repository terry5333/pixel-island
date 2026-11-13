import React, { useState, useEffect } from 'react';
import { ArcadeRoom, GameType, UserProfile, IslandPresence } from '../types/game';
import { dbService } from '../services/dbService';
import { sound } from '../services/audio';
import { Game1A2B } from './arcade/Game1A2B';
import { GameOOXX } from './arcade/GameOOXX';
import { GameBattleship } from './arcade/GameBattleship';
import { GameDotsBoxes } from './arcade/GameDotsBoxes';
import { X, Play, Users, Bot, Key, Plus, ArrowLeft, Gamepad2 } from 'lucide-react';

interface ArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialGameType?: GameType;
  challengedPlayer?: IslandPresence | null;
  onClearChallenge?: () => void;
}

export const ArcadeModal: React.FC<ArcadeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialGameType = '1a2b',
  challengedPlayer,
  onClearChallenge,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>(initialGameType);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<ArcadeRoom | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<ArcadeRoom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      handleCreateRoom('pvp', challengedPlayer);
    }
  }, [challengedPlayer, isOpen]);

  if (!isOpen) return null;

  // Single-player match vs AI
  const handlePlayVsAi = async (gameType: GameType) => {
    sound.playClick();
    const payload: Parameters<typeof dbService.createArcadeRoom>[0] = {
      gameType,
      mode: 'ai',
      status: 'playing',
      hostUid: currentUser.uid,
      hostName: currentUser.displayName,
      guestUid: 'ai_bot',
      guestName: '電腦 AI 🤖',
      currentTurn: currentUser.uid,
      isPublic: false,
    };
    if (gameType === '1a2b') {
      payload.state1a2b = { hostGuesses: [], guestGuesses: [] };
    } else if (gameType === 'ooxx') {
      payload.stateOoxx = { mode: 'infinite', board: Array(9).fill(null), pieceHistory: [] };
    }
    const roomId = await dbService.createArcadeRoom(payload);
    setActiveRoomId(roomId);
  };

  // Create PvP Room
  const handleCreateRoom = async (mode: 'pvp', targetPlayer?: IslandPresence) => {
    sound.playClick();
    const payload: Parameters<typeof dbService.createArcadeRoom>[0] = {
      gameType: selectedGame,
      mode: 'pvp',
      status: targetPlayer ? 'playing' : 'waiting',
      hostUid: currentUser.uid,
      hostName: currentUser.displayName,
      currentTurn: currentUser.uid,
      isPublic: !targetPlayer,
    };
    if (targetPlayer) {
      payload.guestUid = targetPlayer.uid;
      payload.guestName = targetPlayer.displayName;
    }
    if (selectedGame === '1a2b') {
      payload.state1a2b = { hostGuesses: [], guestGuesses: [] };
    } else if (selectedGame === 'ooxx') {
      payload.stateOoxx = { mode: 'infinite', board: Array(9).fill(null), pieceHistory: [] };
    }
    const roomId = await dbService.createArcadeRoom(payload);
    setActiveRoomId(roomId);
    if (onClearChallenge) onClearChallenge();
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
    if (targetRoom.status !== 'waiting' && targetRoom.hostUid !== currentUser.uid) {
      setErrorMessage('該房間已開始對戰或已額滿！');
      sound.playBump();
      return;
    }

    setErrorMessage(null);
    if (targetRoom.hostUid !== currentUser.uid) {
      await dbService.updateArcadeRoom(code, {
        guestUid: currentUser.uid,
        guestName: currentUser.displayName,
        status: 'playing',
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

  const handleUpdateRoom = async (updates: Partial<ArcadeRoom>) => {
    if (!activeRoomId) return;
    await dbService.updateArcadeRoom(activeRoomId, updates);
  };

  const handleRewardCoins = async (amount: number) => {
    await dbService.updateUserProfile(currentUser.uid, {
      coins: (currentUser.coins || 0) + amount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="pixel-card w-full max-w-3xl bg-[#1e1b4b] border-4 border-slate-900 rounded-lg shadow-pixel-lg overflow-hidden flex flex-col h-[85vh] max-h-[640px]">
        {/* Header */}
        <div className="p-3 bg-slate-950 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕹️</span>
            <h2 className="font-arcade text-sm text-cyan-400">
              8-BIT ARCADE CENTER - 像素連線遊樂場
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {activeRoomId && (
              <button
                onClick={handleLeaveRoom}
                className="pixel-btn px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 退出房間
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Game Room View */}
        {room ? (
          <div className="flex-1 overflow-hidden">
            {room.gameType === '1a2b' && (
              <Game1A2B
                room={room}
                currentUser={currentUser}
                onUpdateRoom={handleUpdateRoom}
                onRewardCoins={handleRewardCoins}
              />
            )}
            {room.gameType === 'ooxx' && (
              <GameOOXX
                room={room}
                currentUser={currentUser}
                onUpdateRoom={handleUpdateRoom}
                onRewardCoins={handleRewardCoins}
              />
            )}
            {room.gameType === 'battleship' && (
              <GameBattleship room={room} currentUser={currentUser} />
            )}
            {room.gameType === 'dots_boxes' && (
              <GameDotsBoxes room={room} currentUser={currentUser} />
            )}
          </div>
        ) : (
          /* Arcade Lobby View */
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
            {/* Game Selector Cards */}
            <div>
              <div className="text-slate-300 font-bold mb-2 flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>選擇想遊玩的街機遊戲：</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: '1a2b' as GameType, name: '雙人互猜 1A2B', icon: '🔢', badge: '熱門對決' },
                  { id: 'ooxx' as GameType, name: '三子無限 OOXX', icon: '⭕', badge: '無限模式' },
                  { id: 'battleship' as GameType, name: '海戰棋 Battleship', icon: '⚓', badge: '下一階段' },
                  { id: 'dots_boxes' as GameType, name: '點線棋 Dots&Boxes', icon: '📐', badge: '下一階段' },
                ].map((g) => {
                  const isSelected = selectedGame === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        setSelectedGame(g.id);
                        sound.playClick();
                      }}
                      className={`pixel-card p-3 rounded-lg border-2 text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/50 shadow-pixel'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{g.icon}</span>
                        <span className="text-[9px] bg-slate-800 text-cyan-300 px-1 py-0.5 rounded border border-slate-700">
                          {g.badge}
                        </span>
                      </div>
                      <div className="font-bold text-slate-100 mt-2">{g.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2 bg-rose-950/80 border border-rose-800 text-rose-300 text-center rounded">
                {errorMessage}
              </div>
            )}

            {/* Mode Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Single Player vs AI */}
              <div className="pixel-card p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 text-sm mb-1">
                    <Bot className="w-4 h-4" />
                    <span>挑戰電腦 AI</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    單人即時對決！磨練技術並隨時賺取金幣獎勵。
                  </p>
                </div>
                <button
                  onClick={() => handlePlayVsAi(selectedGame)}
                  className="pixel-btn w-full mt-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  即刻挑戰 AI
                </button>
              </div>

              {/* Create PvP Room */}
              <div className="pixel-card p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-sm mb-1">
                    <Plus className="w-4 h-4" />
                    <span>建立對戰房</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    自動產生 4 位數專屬房號，公開等待或邀請好友加入。
                  </p>
                </div>
                <button
                  onClick={() => handleCreateRoom('pvp')}
                  className="pixel-btn w-full mt-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  建立房間
                </button>
              </div>

              {/* Join by 4-digit code */}
              <div className="pixel-card p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-purple-400 text-sm mb-1">
                    <Key className="w-4 h-4" />
                    <span>加入 4 碼房間</span>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="輸入 4 位數房號"
                    className="w-full mt-2 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-center font-mono tracking-widest text-amber-300 font-bold"
                  />
                </div>
                <button
                  onClick={() => handleJoinRoom()}
                  disabled={joinCodeInput.length !== 4}
                  className="pixel-btn w-full mt-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded"
                >
                  輸入並進入
                </button>
              </div>
            </div>

            {/* Public Rooms List */}
            <div className="pixel-card p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <div className="font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>公開對戰大廳列表 ({publicRooms.length})</span>
                <button
                  onClick={() => dbService.getPublicArcadeRooms().then(setPublicRooms)}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  重新整理
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <div className="text-slate-500 py-4 text-center text-xs">
                  目前大廳沒有等待中的公開房間，您可以點擊「建立房間」率先開局！
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {publicRooms.map((r) => (
                    <div
                      key={r.roomId}
                      className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-amber-300">
                          #{r.roomId} - {r.hostName} 的房間
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          遊戲: {r.gameType}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(r.roomId)}
                        className="pixel-btn px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded"
                      >
                        加入
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
