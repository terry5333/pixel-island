import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dbService } from './services/dbService';
import { sound } from './services/audio';
import { 
  UserProfile, 
  Item, 
  ArcadeRoom, 
  GameType 
} from './types/game';
import { BoutiqueModal } from './components/BoutiqueModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { Game1A2B } from './components/arcade/Game1A2B';
import { GameOOXX } from './components/arcade/GameOOXX';
import { GameBattleship } from './components/arcade/GameBattleship';
import { GameDotsBoxes } from './components/arcade/GameDotsBoxes';
import { GameSlotMachine } from './components/arcade/GameSlotMachine';
import { 
  Coins, 
  Volume2, 
  VolumeX, 
  Shirt, 
  LogOut, 
  Shield, 
  ArrowLeft, 
  Users, 
  Bot, 
  Copy, 
  Check, 
  Play, 
  RefreshCw,
  Sparkles,
  Trophy
} from 'lucide-react';

const ADMIN_EMAIL = 'ltairui79@gmail.com';

interface GameMetadata {
  id: GameType | 'slot';
  numeral: string;
  name: string;
  englishSub: string;
  icon: string;
  grade: string;
  desc: string;
  supportsMultiplayer: boolean;
}

const GAME_DOSSIERS: GameMetadata[] = [
  {
    id: '1a2b',
    numeral: '第壹號試驗',
    name: '1A2B 數字密碼推理',
    englishSub: '- INTELLECTUAL NUMERIC CIPHER TEST NO. 1A2B -',
    icon: '🔢',
    grade: '甲等公文',
    desc: '4位不重複數字暗號推理。依據每次判定反饋之 A/B 提示，以最少次數破解密碼。',
    supportsMultiplayer: true,
  },
  {
    id: 'ooxx',
    numeral: '第貳號試驗',
    name: '無限 OOXX 棋藝對弈',
    englishSub: '- INFINITE TIC-TAC-TOE TACTICAL EXAM -',
    icon: '⭕❌',
    grade: '乙等公文',
    desc: '棋盤至多保留 3 顆棋子，落第 4 子時首子銷毀消除。考驗受驗生動態記憶與棋術。',
    supportsMultiplayer: true,
  },
  {
    id: 'battleship',
    numeral: '第參號試驗',
    name: '帝國海戰棋 (8×8)',
    englishSub: '- NAVAL FLEET STRATEGIC BOARD TEST -',
    icon: '🚢',
    grade: '甲等公文',
    desc: '8×8 海象公文圖。秘密部署4艘海軍戰艦，與敵軍輪番砲擊交叉偵查，先擊沉敵艦者勝。',
    supportsMultiplayer: true,
  },
  {
    id: 'dots_boxes',
    numeral: '第肆號試驗',
    name: '方格點線棋 (5×5)',
    englishSub: '- TERRITORY GRID EXPANSION PROTOCOL -',
    icon: '📦',
    grade: '乙等公文',
    desc: '5×5 點陣連線佔地。封閉四邊者即刻奪得領地並獲連續行動權，考驗大局規劃。',
    supportsMultiplayer: true,
  },
  {
    id: 'slot',
    numeral: '第伍號遊技',
    name: '777 昭和機械拉霸機',
    englishSub: '- SHOWA RETRO MECHANICAL SLOT MACHINE -',
    icon: '🎰',
    grade: '昭和特賞',
    desc: '純實體機械拉桿手感，777 特賞大獎金幣滾滾。為公文試驗之餘的放鬆遊樂所。',
    supportsMultiplayer: false,
  },
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  // Active game session
  const [activeGameType, setActiveGameType] = useState<GameType | 'slot' | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ArcadeRoom | null>(null);

  // Modals state
  const [isBoutiqueOpen, setIsBoutiqueOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Lobby state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [publicRooms, setPublicRooms] = useState<ArcadeRoom[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3-Minute Idle Kick State
  const [isAfkKicked, setIsAfkKicked] = useState(false);
  const [afkWarningRemaining, setAfkWarningRemaining] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Items map
  const itemsMap = useMemo(() => {
    const map: Record<string, Item> = {};
    items.forEach((it) => {
      map[it.id] = it;
    });
    return map;
  }, [items]);

  // Auth, items subscription
  useEffect(() => {
    const unsubAuth = dbService.onAuthChange((user) => {
      setCurrentUser(user);
      // Admin redirect: if admin email logs in, open admin dashboard immediately
      if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setIsAdminOpen(true);
      }
    });

    const unsubItems = dbService.subscribeItems((newItems) => {
      setItems(newItems);
    });

    return () => {
      unsubAuth();
      unsubItems();
    };
  }, []);

  // Subscribe to active room changes
  useEffect(() => {
    if (!activeRoomId) {
      setActiveRoom(null);
      return;
    }
    const unsubscribe = dbService.subscribeArcadeRoom(activeRoomId, (updatedRoom) => {
      setActiveRoom(updatedRoom);
      if (updatedRoom && updatedRoom.gameType) {
        setActiveGameType(updatedRoom.gameType);
      }
    });
    return () => unsubscribe();
  }, [activeRoomId]);

  // Load public rooms
  const refreshPublicRooms = useCallback(() => {
    dbService.getPublicArcadeRooms().then(setPublicRooms);
  }, []);

  useEffect(() => {
    if (!activeGameType) {
      refreshPublicRooms();
      const interval = setInterval(refreshPublicRooms, 6000);
      return () => clearInterval(interval);
    }
  }, [activeGameType, refreshPublicRooms]);

  // Activity tracker for 3-minute idle kick
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setAfkWarningRemaining(null);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentUser || isAfkKicked) return;
      const elapsed = Date.now() - lastActivityRef.current;
      const totalKickLimit = 3 * 60 * 1000; // 3 minutes = 180s
      const warningStart = 2.5 * 60 * 1000; // 2.5 minutes = 150s

      if (elapsed >= totalKickLimit) {
        setIsAfkKicked(true);
        setAfkWarningRemaining(null);
        sound.playDoor();
      } else if (elapsed >= warningStart) {
        const remainingSeconds = Math.max(1, Math.ceil((totalKickLimit - elapsed) / 1000));
        setAfkWarningRemaining(remainingSeconds);
      } else {
        setAfkWarningRemaining(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser, isAfkKicked]);

  // Global activity listeners
  useEffect(() => {
    const onActivity = () => resetActivityTimer();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('mousedown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('mousedown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
  }, [resetActivityTimer]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  const handleSignOut = async () => {
    sound.playBump();
    await dbService.signOutUser();
    setCurrentUser(null);
    setIsAdminOpen(false);
    setActiveGameType(null);
    setActiveRoomId(null);
  };

  // Launch AI Solo Game
  const handleStartAiGame = async (gameType: GameType) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    sound.playClick();
    setErrorMessage(null);

    const roomId = await dbService.createArcadeRoom({
      gameType,
      mode: 'ai',
      status: 'playing',
      hostUid: currentUser.uid,
      hostName: currentUser.displayName,
      guestUid: 'npc_bot',
      guestName: '試驗局 AI 試驗官',
      currentTurn: currentUser.uid,
      isPublic: false,
    });

    setActiveRoomId(roomId);
    setActiveGameType(gameType);
  };

  // Create Public/Private Multiplayer Room
  const handleCreateMultiplayerRoom = async (gameType: GameType, isPublic: boolean = true) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    sound.playClick();
    setErrorMessage(null);

    const roomId = await dbService.createArcadeRoom({
      gameType,
      mode: 'pvp',
      status: 'waiting',
      hostUid: currentUser.uid,
      hostName: currentUser.displayName,
      currentTurn: currentUser.uid,
      isPublic,
    });

    setActiveRoomId(roomId);
    setActiveGameType(gameType);
  };

  // Join Room by 4-digit Code
  const handleJoinByCode = async (codeToJoin?: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const cleanCode = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!cleanCode) {
      sound.playBump();
      setErrorMessage('請輸入標準 4 位代碼！');
      return;
    }

    sound.playClick();
    setErrorMessage(null);

    const targetRoom = await dbService.getArcadeRoom(cleanCode);
    if (!targetRoom) {
      sound.playBump();
      setErrorMessage('未查得此考局代碼，或考局已滿員/已結束！');
      return;
    }

    if (targetRoom.status === 'playing' && targetRoom.hostUid !== currentUser.uid && targetRoom.guestUid !== currentUser.uid) {
      sound.playBump();
      setErrorMessage('該考局已開始對戰或已滿員！');
      return;
    }

    if (targetRoom.hostUid !== currentUser.uid) {
      await dbService.updateArcadeRoom(cleanCode, {
        guestUid: currentUser.uid,
        guestName: currentUser.displayName,
        status: 'playing',
      });
    }

    setActiveRoomId(cleanCode);
    setActiveGameType(targetRoom.gameType);
    setJoinCodeInput('');
  };

  // Join Existing Public Room
  const handleJoinPublicRoom = async (room: ArcadeRoom) => {
    await handleJoinByCode(room.roomId);
  };

  // Exit Current Game & Return to Lobby
  const handleReturnToLobby = () => {
    sound.playClick();
    setActiveGameType(null);
    setActiveRoomId(null);
    setActiveRoom(null);
    setErrorMessage(null);
  };

  const safeCoins = Math.max(0, currentUser?.coins || 0);
  const isAdminUser = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div 
      className="min-h-screen w-full bg-[#F7F3E9] text-[#2D1E18] font-serif select-none flex flex-col paper-grid relative"
      style={{ fontFamily: "'Noto Serif TC', 'Songti TC', SimSun, serif" }}
    >
      {/* Admin Full-Screen Dashboard (bypasses game entirely if admin is logged in) */}
      {isAdminUser && isAdminOpen && (
        <AdminDashboardModal
          isOpen={true}
          onClose={() => { setIsAdminOpen(false); handleSignOut(); }}
          items={items}
          presences={{}}
        />
      )}

      {/* ================= 1. SHOWA MASTHEAD HEADER ================= */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9] border-b-4 border-double border-[#5D4037] px-4 py-3 sm:px-8 sm:py-4 shadow-[0_4px_6px_rgba(93,64,55,0.06)] flex items-center justify-between">
        {/* Left Bureau Seal & Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Vermilion Stamp Watermark */}
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm border-2 border-double border-[#C62828] text-[#C62828] flex flex-col items-center justify-center font-black leading-tight shadow-[2px_2px_0px_#C62828] shrink-0"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <span className="text-[8px] border-b border-[#C62828] pb-0.5">官 印</span>
            <span className="text-[11px] sm:text-xs">試驗局</span>
          </div>

          <div>
            <div className="text-[9px] sm:text-[11px] text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
              - SHOWA AMUSEMENT & EXAMINATION PLATFORM -
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-[0.2em] text-[#2D1E18] flex items-center gap-2">
              <span>昭和遊技試驗局</span>
              <span className="hidden md:inline-block text-[10px] sm:text-xs px-2 py-0.5 border border-[#5D4037] bg-[#F7F3E9] text-[#5D4037] font-semibold tracking-normal">
                公文試驗・動態棋弈・遊樂殿堂
              </span>
            </h1>
          </div>
        </div>

        {/* Right Player Credentials & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <>
              {/* Coin Balance Dossier */}
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFDF9] border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] text-xs font-black text-[#2D1E18]"
                title="受驗生持有金幣總額"
              >
                <Coins className="w-4 h-4 text-[#C62828]" />
                <span className="font-mono text-sm tracking-wider">{safeCoins.toLocaleString()}</span>
              </div>

              {/* Player Name Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F3E9] border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] text-xs font-bold text-[#5D4037]">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                <span className="truncate max-w-[100px]">{currentUser.displayName}</span>
              </div>

              {/* Wardrobe Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setIsBoutiqueOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-[#FFFDF9] hover:bg-[#EFEBE4] text-[#5D4037] text-xs font-bold border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                title="檢視衣櫃與昭和服飾"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span className="hidden md:inline">服飾閣</span>
              </button>

              {/* Admin Button */}
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFDF9] text-xs font-bold border-2 border-[#2D1E18] shadow-[3px_3px_0px_#2D1E18] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                  title="管理員後台"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">後台</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className="p-1.5 bg-[#FFFDF9] hover:bg-[#EFEBE4] text-[#5D4037] border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                title={isMuted ? '開啟音效' : '靜音'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="p-1.5 bg-[#FFFDF9] hover:bg-red-50 text-[#C62828] border-2 border-[#C62828] shadow-[3px_3px_0px_#C62828] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                title="登出帳號"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-1.5 bg-[#C62828] hover:bg-[#B71C1C] text-[#FFFDF9] text-xs sm:text-sm font-black tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              受驗生登入 / 註冊
            </button>
          )}
        </div>
      </header>

      {/* ================= 2. MAIN CONTAINER ================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* VIEW A: ACTIVE GAME WORKBENCH */}
        {activeGameType !== null ? (
          <div className="flex-1 flex flex-col bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] rounded-sm overflow-hidden min-h-[640px]">
            {/* Active Game Top Bar */}
            <div className="p-3 sm:p-4 bg-[#F7F3E9] border-b-4 border-double border-[#5D4037] flex items-center justify-between">
              <button
                onClick={handleReturnToLobby}
                className="px-4 py-1.5 bg-[#FFFDF9] hover:bg-[#EFEBE4] text-[#5D4037] font-black text-xs sm:text-sm tracking-widest border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回試驗局大廳</span>
              </button>

              {/* Room Code Badge (if multiplayer room) */}
              {activeRoom && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-[#8D6E63] font-bold">考局案號：</span>
                  <div
                    onClick={() => {
                      if (activeRoom.roomId) {
                        navigator.clipboard.writeText(activeRoom.roomId);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                        sound.playClick();
                      }
                    }}
                    className="px-3 py-1 bg-[#FFFDF9] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] font-mono font-black text-sm text-[#C62828] tracking-widest flex items-center gap-1.5 cursor-pointer hover:bg-amber-50"
                    title="點擊複製 4 碼考局代碼"
                  >
                    <span>{activeRoom.roomId}</span>
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
              )}
            </div>

            {/* Render Target Game */}
            <div className="flex-1 overflow-auto">
              {activeGameType === '1a2b' && activeRoom && currentUser && (
                <Game1A2B
                  room={activeRoom}
                  currentUser={currentUser}
                  onUpdateRoom={(updates) => dbService.updateArcadeRoom(activeRoom.roomId, updates)}
                  onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
                  onBackToLobby={handleReturnToLobby}
                />
              )}

              {activeGameType === 'ooxx' && activeRoom && currentUser && (
                <GameOOXX
                  room={activeRoom}
                  currentUser={currentUser}
                  onUpdateRoom={(updates) => dbService.updateArcadeRoom(activeRoom.roomId, updates)}
                  onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
                />
              )}

              {activeGameType === 'battleship' && activeRoom && currentUser && (
                <GameBattleship
                  room={activeRoom}
                  currentUser={currentUser}
                />
              )}

              {activeGameType === 'dots_boxes' && activeRoom && currentUser && (
                <GameDotsBoxes
                  room={activeRoom}
                  currentUser={currentUser}
                />
              )}

              {activeGameType === 'slot' && currentUser && (
                <GameSlotMachine
                  currentUid={currentUser.uid}
                  userCoins={currentUser.coins}
                  onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
                  onDeductCoins={(amt) => dbService.rewardCoins(currentUser.uid, -amt)}
                />
              )}
            </div>
          </div>
        ) : (
          /* VIEW B: SHOWA EXAMINATION & AMUSEMENT LOBBY */
          <div className="flex flex-col gap-6">
            {/* 1. Official Dispatch & Examination Papers Banner */}
            <div className="bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] p-5 sm:p-6 rounded-sm relative">
              <div className="text-[10px] sm:text-xs text-[#8D6E63] font-bold tracking-[0.25em] uppercase">
                - OFFICIAL DISPATCH & EXAMINATION PAPERS -
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-[0.2em] text-[#2D1E18] border-b-4 border-double border-[#5D4037] pb-2 mt-1">
                昭和拾年・第十二號 公文試驗公示
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-[#5D4037] leading-relaxed">
                奉 <b>昭和遊技試驗局</b> 命：凡蒞臨本局之考生，得自由挑選以下五項合格試驗科目進行智力測驗、單人詰棋、或聯網公開考局。合格者將依公文規約頒發官方金幣並登載成績。
              </p>

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="mt-3 px-4 py-2 border-2 border-dashed border-[#C62828] bg-red-50 text-[#C62828] text-xs font-bold flex items-center justify-between">
                  <span>⚠️ {errorMessage}</span>
                  <button onClick={() => setErrorMessage(null)} className="underline cursor-pointer">關閉</button>
                </div>
              )}
            </div>

            {/* 2. Five Grand Game Dossier Cards (五大試驗項目卡片) */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b-2 border-dashed border-[#5D4037] pb-1">
                <span className="text-xs font-bold tracking-[0.2em] text-[#8D6E63] uppercase">
                  - EXAMINATION SUBJECT DOSSIERS -
                </span>
                <span className="text-xs text-[#5D4037] font-bold">共五項試驗科目</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {GAME_DOSSIERS.map((g) => (
                  <div
                    key={g.id}
                    className="bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] p-4 sm:p-5 flex flex-col justify-between rounded-sm relative group hover:border-[#2D1E18] transition-all"
                  >
                    {/* Top Grade Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#8D6E63] tracking-widest">{g.numeral}</span>
                      <span className="text-[10px] px-2 py-0.5 border border-[#5D4037] bg-[#F7F3E9] text-[#5D4037] font-bold">
                        {g.grade}
                      </span>
                    </div>

                    {/* Subtitle & Title */}
                    <div>
                      <div className="text-[9px] text-[#8D6E63] font-bold tracking-wider truncate">
                        {g.englishSub}
                      </div>
                      <h3 className="text-lg sm:text-xl font-black tracking-[0.15em] text-[#2D1E18] flex items-center gap-2 mt-0.5">
                        <span className="text-2xl">{g.icon}</span>
                        <span>{g.name}</span>
                      </h3>
                      <p className="mt-2 text-xs text-[#5D4037] leading-relaxed border-t-2 border-dashed border-[#5D4037] pt-2">
                        {g.desc}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t-2 border-double border-[#5D4037] flex flex-col gap-2">
                      {g.supportsMultiplayer ? (
                        <>
                          <button
                            onClick={() => handleStartAiGame(g.id as GameType)}
                            className="w-full py-2 bg-[#F7F3E9] hover:bg-[#EFEBE4] text-[#2D1E18] text-xs font-black tracking-widest border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Bot className="w-4 h-4 text-[#C62828]" />
                            <span>單人詰棋試驗 (對戰AI)</span>
                          </button>

                          <button
                            onClick={() => handleCreateMultiplayerRoom(g.id as GameType, true)}
                            className="w-full py-2 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFDF9] text-xs font-black tracking-widest border-2 border-[#2D1E18] shadow-[3px_3px_0px_#2D1E18] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-amber-300" />
                            <span>建立聯網考局 (開房)</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              setIsAuthOpen(true);
                              return;
                            }
                            sound.playTaiko();
                            setActiveGameType('slot');
                          }}
                          className="w-full py-2.5 bg-[#C62828] hover:bg-[#B71C1C] text-[#FFFDF9] text-xs font-black tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>進入遊技所 (立即拉桿)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Room Joining & Public Rooms Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
              {/* Left Column: Join by 4-digit Code */}
              <div className="bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] p-5 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-[#8D6E63] font-bold tracking-[0.2em] uppercase">
                    - DIRECT JOIN PROTOCOL -
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-[0.2em] text-[#2D1E18] border-b-2 border-double border-[#5D4037] pb-1 mt-0.5">
                    輸入 4 碼代碼加入考局
                  </h3>
                  <p className="text-xs text-[#5D4037] mt-2 leading-relaxed">
                    請向考局創立者索取 4 位英文或數字考局代碼，直接呈遞進入對局。
                  </p>

                  <div className="mt-4">
                    <input
                      type="text"
                      maxLength={4}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="例：ABCD"
                      className="w-full p-2.5 bg-[#F7F3E9] border-2 border-[#5D4037] text-center font-mono font-black text-2xl tracking-[0.3em] text-[#2D1E18] uppercase focus:outline-none shadow-[3px_3px_0px_#5D4037]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleJoinByCode()}
                  disabled={joinCodeInput.length !== 4}
                  className={`w-full mt-4 py-2.5 font-black text-xs sm:text-sm tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer ${
                    joinCodeInput.length === 4
                      ? 'bg-[#C62828] hover:bg-[#B71C1C] text-[#FFFDF9]'
                      : 'bg-[#EFEBE4] text-[#A1887F] cursor-not-allowed'
                  }`}
                >
                  呈遞加入對戰
                </button>
              </div>

              {/* Right Column: Public Active Rooms List */}
              <div className="lg:col-span-2 bg-[#FFFDF9] border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] p-5 rounded-sm flex flex-col">
                <div className="flex items-center justify-between border-b-2 border-double border-[#5D4037] pb-1">
                  <div>
                    <div className="text-[10px] text-[#8D6E63] font-bold tracking-[0.2em] uppercase">
                      - REAL-TIME PUBLIC EXAMINATIONS -
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-[0.2em] text-[#2D1E18]">
                      即時公開考局清單
                    </h3>
                  </div>
                  <button
                    onClick={refreshPublicRooms}
                    className="p-1.5 bg-[#F7F3E9] hover:bg-[#EFEBE4] text-[#5D4037] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    title="重新整理清單"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rooms List */}
                <div className="mt-3 flex-1 overflow-y-auto max-h-[220px] flex flex-col gap-2">
                  {publicRooms.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-[#5D4037] text-xs text-[#8D6E63]">
                      目前尚無公開等待中之考局。點擊上方科目「建立聯網考局」即可率先發起！
                    </div>
                  ) : (
                    publicRooms.map((r) => {
                      const matchedMeta = GAME_DOSSIERS.find((g) => g.id === r.gameType);
                      return (
                        <div
                          key={r.roomId}
                          className="p-3 bg-[#F7F3E9] border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{matchedMeta?.icon || '🎮'}</span>
                            <div>
                              <div className="text-xs font-black text-[#2D1E18]">
                                {matchedMeta?.name || r.gameType}
                              </div>
                              <div className="text-[10px] text-[#8D6E63] flex items-center gap-2">
                                <span>局主：<b>{r.hostName}</b></span>
                                <span>案號：<b className="font-mono text-[#C62828]">{r.roomId}</b></span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleJoinPublicRoom(r)}
                            className="px-4 py-1.5 bg-[#5D4037] hover:bg-[#4E342E] text-[#FFFDF9] text-xs font-black tracking-wider border-2 border-[#2D1E18] shadow-[2px_2px_0px_#2D1E18] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                          >
                            進入對戰
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= 3. MODALS & NOTIFICATIONS ================= */}

      {/* Boutique & Wardrobe Modal */}
      {currentUser && (
        <BoutiqueModal
          isOpen={isBoutiqueOpen}
          onClose={() => setIsBoutiqueOpen(false)}
          user={currentUser}
          items={items}
          itemsMap={itemsMap}
          initialTab="wardrobe"
          onEquipChange={async (eq) => {
            await dbService.updateEquipped(currentUser.uid, eq);
            sound.playBuy();
          }}
          onBuyItem={async (item) => {
            if (currentUser.coins < item.price) {
              sound.playBump();
              return;
            }
            await dbService.buyItem(currentUser.uid, item);
            sound.playBuy();
          }}
        />
      )}

      {/* Compulsory Mandatory Login Gate */}
      <AuthModal
        isOpen={!currentUser || isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        isMandatory={!currentUser}
      />

      {/* AFK Idle Kick Warning Countdown Banner (30 seconds before 3-minute kick) */}
      {afkWarningRemaining !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#C62828] border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] text-white text-xs font-serif flex items-center gap-2 animate-bounce">
          <span className="text-base">⚠️</span>
          <span>閒置提醒：您已長時間無動作，將於</span>
          <span className="font-mono font-black text-amber-300 text-sm px-1.5 py-0.5 bg-black/40 rounded">{afkWarningRemaining}</span>
          <span>秒後自動離線！(請點擊任意處)</span>
        </div>
      )}

      {/* 3-Minute Idle Kick Showa Alert Modal */}
      {isAfkKicked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-[#FFFDF9] border-4 border-[#5D4037] p-6 text-center shadow-[8px_8px_0px_#5D4037] text-[#2D1E18] font-serif">
            <div className="text-4xl mb-3">🏮 📜</div>
            <h3 className="text-lg font-black text-[#2D1E18] mb-2 tracking-[0.2em] border-b-2 border-double border-[#5D4037] pb-1">
              閒置離線公文（3 分鐘無動作）
            </h3>
            <p className="text-xs sm:text-sm text-[#5D4037] my-4 leading-relaxed">
              因受驗生超過 3 分鐘未進行任何試驗操作，為維護昭和遊技試驗局各考局之平穩秩序，系統已將您暫時請回休息。隨時歡迎您再次呈遞公文蒞臨！
            </p>
            <button
              onClick={() => {
                setIsAfkKicked(false);
                setIsAuthOpen(true);
                sound.playDoor();
              }}
              className="w-full py-3 bg-[#C62828] hover:bg-[#B71C1C] text-[#FFFDF9] font-black text-xs sm:text-sm tracking-widest border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              重新踏入昭和試驗局 🌸
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
