import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dbService } from './services/dbService';
import { sound } from './services/audio';
import { 
  UserProfile, 
  Item, 
  IslandPresence, 
  EquippedItems, 
  RoomFurniture 
} from './types/game';
import { 
  isIslandWalkable, 
  isHomeWalkable, 
  checkBuildingOrHouseEntrance, 
  getActiveHouses,
  ActiveHouse,
  HOME_HEIGHT 
} from './config/mapData';
import { IslandMap } from './components/IslandMap';
import { HomeMap } from './components/HomeMap';
import { Navbar } from './components/Navbar';
import { VirtualControls } from './components/VirtualControls';
import { BoutiqueModal } from './components/BoutiqueModal';
import { ArcadeModal } from './components/ArcadeModal';
import { CasinoModal } from './components/CasinoModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { PlayerActionModal } from './components/PlayerActionModal';
import { FriendPanel } from './components/FriendPanel';
import { HouseUpgradeModal } from './components/HouseUpgradeModal';
import { TutorialModal } from './components/TutorialModal';

const ADMIN_EMAIL = 'ltairui79@gmail.com';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [presences, setPresences] = useState<Record<string, IslandPresence>>({});

  // Navigation & Location
  const [currentPlace, setCurrentPlace] = useState<'island' | 'home'>('island');
  const [visitingUser, setVisitingUser] = useState<UserProfile | null>(null);

  // Modals state
  const [isBoutiqueOpen, setIsBoutiqueOpen] = useState(false);
  const [boutiqueInitialTab, setBoutiqueInitialTab] = useState<'shop' | 'wardrobe'>('shop');
  const [isArcadeOpen, setIsArcadeOpen] = useState(false);
  const [isCasinoOpen, setIsCasinoOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFriendPanelOpen, setIsFriendPanelOpen] = useState(false);
  const [isHouseUpgradeOpen, setIsHouseUpgradeOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<IslandPresence | null>(null);
  const [challengedPlayer, setChallengedPlayer] = useState<IslandPresence | null>(null);

  // Requirement 3: 3-Minute Idle Kick State
  const [isAfkKicked, setIsAfkKicked] = useState(false);
  const [afkWarningRemaining, setAfkWarningRemaining] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastStepSoundRef = useRef<number>(0);

  // Items map for easy lookup
  const itemsMap = useMemo(() => {
    const map: Record<string, Item> = {};
    items.forEach((it) => {
      map[it.id] = it;
    });
    return map;
  }, [items]);

  // Subscribe to Auth, Items, and Presences
  useEffect(() => {
    const unsubAuth = dbService.onAuthChange((user) => {
      setCurrentUser(user);
      // Admin redirect: if admin email logs in, open admin dashboard immediately
      if (user && user.email?.toLowerCase() === 'ltairui79@gmail.com') {
        setIsAdminOpen(true);
        return;
      }
      if (user && user.hasCompletedTutorial === false) {
        setIsTutorialOpen(true);
      }
    });

    const unsubItems = dbService.subscribeItems((newItems) => {
      setItems(newItems);
    });

    const unsubPresence = dbService.subscribePresence((allPresences) => {
      setPresences(allPresences);
    });

    return () => {
      unsubAuth();
      unsubItems();
      unsubPresence();
    };
  }, []);

  // Requirement 3: 3-Minute Idle Inactivity Kick Watchdog (3分鐘無動作踢出)
  useEffect(() => {
    if (!currentUser) return;

    // Reset activity timer on any user interaction
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      if (afkWarningRemaining !== null) {
        setAfkWarningRemaining(null);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'pointerdown', 'click', 'wheel'];
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    const interval = window.setInterval(() => {
      if (!currentUser) return;
      const idleMs = Date.now() - lastActivityRef.current;
      const IDLE_LIMIT_MS = 180 * 1000; // 3 minutes = 180 seconds
      const WARNING_THRESHOLD_MS = 150 * 1000; // 2.5 minutes (30 seconds before kick)

      if (idleMs >= IDLE_LIMIT_MS) {
        sound.playAlert();
        setIsAfkKicked(true);
        setAfkWarningRemaining(null);
        dbService.signOutUser();
      } else if (idleMs >= WARNING_THRESHOLD_MS) {
        const remainingSeconds = Math.max(1, Math.ceil((IDLE_LIMIT_MS - idleMs) / 1000));
        setAfkWarningRemaining(remainingSeconds);
      } else {
        setAfkWarningRemaining(null);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      window.clearInterval(interval);
    };
  }, [currentUser, afkWarningRemaining]);

  // High-performance continuous local position state (sub-pixel float coordinates)
  // Default spawn at the central Showa crossroads in front of the arcade and bridge
  const [localPos, setLocalPos] = useState({
    x: 31.0,
    y: 14.5,
    facing: 'right' as 'left' | 'right',
    isMoving: false,
  });
  const localPosRef = useRef(localPos);
  localPosRef.current = localPos;
  const moveTimeoutRef = useRef<number | null>(null);

  const selfPresence = currentUser ? presences[currentUser.uid] : null;

  // Push presence updates helper (throttled during continuous walking to prevent RTDB broadcast thrash)
  const lastSyncTimeRef = useRef<number>(0);
  const syncSelfPresence = useCallback(
    (updates: Partial<IslandPresence>, forceSync = false) => {
      if (!currentUser) return;
      const now = Date.now();
      if (!forceSync && updates.isMoving && now - lastSyncTimeRef.current < 160) {
        return; // Throttled to keep local 60fps buttery smooth
      }
      lastSyncTimeRef.current = now;

      const current = localPosRef.current;
      const base: IslandPresence = {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        x: updates.x ?? current.x,
        y: updates.y ?? current.y,
        facing: updates.facing ?? current.facing,
        equipped: currentUser.equipped,
        currentPlace,
        visitingHomeUid: visitingUser?.uid ?? undefined,
        houseLevel: currentUser.houseLevel || 1,
        emojiBubble: updates.emojiBubble !== undefined ? updates.emojiBubble : (selfPresence?.emojiBubble ?? null),
        updatedAt: now,
        ...updates,
      };
      dbService.updatePresence(base);
    },
    [currentUser, currentPlace, visitingUser, selfPresence]
  );

  // Initialize self presence on first load at the center boulevard
  useEffect(() => {
    if (currentUser && !presences[currentUser.uid]) {
      syncSelfPresence({ x: 31, y: 14.5, facing: 'right' }, true);
    }
  }, [currentUser, presences, syncSelfPresence]);

  // Active houses mapped for all online players + persistent island residents
  const activeHouses = useMemo(() => {
    if (!currentUser) return [];
    return getActiveHouses(
      currentUser.uid,
      currentUser.displayName,
      currentUser.houseLevel || 1,
      presences
    );
  }, [currentUser, presences]);

  // Detect interaction at current position (Commercial buildings or any Player's House!)
  const contextEntrance = useMemo(() => {
    if (currentPlace !== 'island') return null;
    return checkBuildingOrHouseEntrance(localPos.x, localPos.y, activeHouses);
  }, [currentPlace, localPos.x, localPos.y, activeHouses]);

  const isHomeExitMat = useMemo(() => {
    if (currentPlace !== 'home') return false;
    return localPos.y >= HOME_HEIGHT - 1.5 && (localPos.x >= 4.5 && localPos.x <= 6.5);
  }, [currentPlace, localPos.x, localPos.y]);

  // Determine floating contextual prompt text
  const contextPrompt = useMemo(() => {
    if (contextEntrance) {
      if (contextEntrance.type === 'commercial') {
        const b = contextEntrance.building;
        if (b.type === 'boutique') return '進入「服」昭和和服精品店 👘';
        if (b.type === 'arcade') return '進入「遊台」街機遊樂中心 🕹️';
        if (b.type === 'casino') return '進入「CASINO」777 復古拉霸娛樂城 🎰';
      } else if (contextEntrance.type === 'house') {
        const h = contextEntrance.house;
        return h.isSelf ? '進入自宅玄關 🏡' : `拜訪 ${h.ownerName} 之宅 🏡`;
      }
    }
    if (isHomeExitMat) {
      return '邁出門扉（返回櫻花島）🚪';
    }
    return null;
  }, [contextEntrance, isHomeExitMat]);

  // Enter house helper (for self or visiting another player's house)
  const handleEnterHouse = useCallback((targetHouse: ActiveHouse) => {
    sound.playDoor();
    const isSelf = targetHouse.ownerUid === currentUser?.uid;
    const targetUser = isSelf
      ? currentUser
      : {
          uid: targetHouse.ownerUid,
          displayName: targetHouse.ownerName,
          coins: 100,
          houseLevel: targetHouse.level || 1,
          equipped: { hair: 'hair_01', top: 'top_01', bottom: 'bottom_01', accessory: null },
          inventory: [],
          roomLayout: [],
          friends: [],
          friendRequests: [],
        };
    setVisitingUser(targetUser as UserProfile);
    setCurrentPlace('home');
    setLocalPos({ x: 5, y: 7, facing: 'right', isMoving: false });
    syncSelfPresence({
      currentPlace: 'home',
      x: 5,
      y: 7,
      visitingHomeUid: targetHouse.ownerUid,
    }, true);
  }, [currentUser, syncSelfPresence]);

  // 60 FPS Sub-pixel continuous free walking movement engine
  const handleMoveDelta = useCallback(
    (vx: number, vy: number, dt: number) => {
      if (!currentUser) return;

      const current = localPosRef.current;
      const speed = 6.0; // tiles per second
      const stepX = vx * speed * dt;
      const stepY = vy * speed * dt;

      let newX = current.x;
      let newY = current.y;
      let newFacing = current.facing;
      if (vx < 0) newFacing = 'left';
      else if (vx > 0) newFacing = 'right';

      // Smooth X-axis movement with collision sliding
      const targetX = current.x + stepX;
      const canWalkX =
        currentPlace === 'island'
          ? isIslandWalkable(targetX, current.y, activeHouses)
          : isHomeWalkable(targetX, current.y);
      if (canWalkX) newX = targetX;

      // Smooth Y-axis movement with collision sliding
      const targetY = current.y + stepY;
      const canWalkY =
        currentPlace === 'island'
          ? isIslandWalkable(newX, targetY, activeHouses)
          : isHomeWalkable(newX, targetY);
      if (canWalkY) newY = targetY;

      if (newX !== current.x || newY !== current.y) {
        const nextState = {
          x: newX,
          y: newY,
          facing: newFacing,
          isMoving: true,
        };
        setLocalPos(nextState);
        localPosRef.current = nextState;

        // Contextual footstep sounds during continuous walking
        const now = Date.now();
        if (now - lastStepSoundRef.current > 280) {
          lastStepSoundRef.current = now;
          const isWood = (newX >= 3.5 && newX <= 14.5 && newY >= 23.0 && newY <= 27.5) ||
                         (newX >= 22.0 && newX <= 25.5 && newY >= 15.5 && newY <= 18.0);
          if (isWood) {
            sound.playStepWood();
          } else {
            sound.playStepDirt();
          }
        }

        syncSelfPresence(
          {
            x: Math.round(newX * 100) / 100,
            y: Math.round(newY * 100) / 100,
            facing: newFacing,
            isMoving: true,
          },
          false
        );

        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = window.setTimeout(() => {
          setLocalPos((prev) => ({ ...prev, isMoving: false }));
          syncSelfPresence({ isMoving: false }, true);
        }, 120);
      }
    },
    [currentUser, currentPlace, activeHouses, syncSelfPresence]
  );

  // Discrete single-step movement helper (for click or single taps)
  const handleMove = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      let vx = 0;
      let vy = 0;
      if (dir === 'up') vy = -1;
      if (dir === 'down') vy = 1;
      if (dir === 'left') vx = -1;
      if (dir === 'right') vx = 1;
      handleMoveDelta(vx, vy, 0.16);
      const cur = localPosRef.current;
      const isWood = (cur.x >= 3.5 && cur.x <= 14.5 && cur.y >= 23.0 && cur.y <= 27.5) ||
                     (cur.x >= 22.0 && cur.x <= 25.5 && cur.y >= 15.5 && cur.y <= 18.0);
      if (isWood) {
        sound.playStepWood();
      } else {
        sound.playStepDirt();
      }
    },
    [handleMoveDelta]
  );

  // Handle Interaction (Space / Enter / A Button / Click Prompt)
  const handleInteract = useCallback(() => {
    if (contextEntrance) {
      if (contextEntrance.type === 'commercial') {
        const b = contextEntrance.building;
        if (b.type === 'boutique') {
          sound.playWindChime();
          setBoutiqueInitialTab('shop');
          setIsBoutiqueOpen(true);
        } else if (b.type === 'arcade') {
          sound.playTaiko();
          setIsArcadeOpen(true);
        } else if (b.type === 'casino') {
          sound.playTaiko();
          setIsCasinoOpen(true);
        }
      } else if (contextEntrance.type === 'house') {
        sound.playShojiDoor();
        handleEnterHouse(contextEntrance.house);
      }
      return;
    }

    if (isHomeExitMat) {
      sound.playDoor();
      setCurrentPlace('island');
      const targetHouse = activeHouses.find((h) => h.ownerUid === visitingUser?.uid) || activeHouses[0];
      const exitX = targetHouse ? targetHouse.doorX : 29;
      const exitY = targetHouse ? targetHouse.doorY + 1 : 12;
      setLocalPos({ x: exitX, y: exitY, facing: 'right', isMoving: false });
      setVisitingUser(null);
      syncSelfPresence({
        currentPlace: 'island',
        x: exitX,
        y: exitY,
        visitingHomeUid: undefined,
      }, true);
    }
  }, [contextEntrance, isHomeExitMat, activeHouses, visitingUser, handleEnterHouse, syncSelfPresence]);

  // Handle Sending Emoji Bubble
  const handleSendEmoji = useCallback(
    (emoji: string) => {
      if (!currentUser) return;
      sound.playEmoji();
      syncSelfPresence({
        emojiBubble: {
          emoji,
          expiresAt: Date.now() + 3500, // Show for 3.5 seconds
        },
      }, true);
    },
    [currentUser, syncSelfPresence]
  );

  // Handle Tile Click-to-Move
  const handleTileClick = useCallback(
    (tx: number, ty: number) => {
      if (!currentUser) return;
      const current = localPosRef.current;
      const dx = tx - current.x;
      const dy = ty - current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.1) {
        handleMoveDelta(dx / dist, dy / dist, 0.25);
      }
    },
    [currentUser, handleMoveDelta]
  );

  // Handle Equip Change
  const handleEquipChange = async (newEquipped: EquippedItems) => {
    if (!currentUser) return;
    await dbService.updateEquipped(currentUser.uid, newEquipped);
    syncSelfPresence({ equipped: newEquipped }, true);
    sound.playCloth();
  };

  // Handle Buy Item
  const handleBuyItem = async (item: Item) => {
    if (!currentUser) return;
    await dbService.buyItem(currentUser.uid, item);
    sound.playBuy();
  };

  // Handle Room Layout Save
  const handleSaveRoomLayout = async (newLayout: RoomFurniture[]) => {
    if (!currentUser) return;
    await dbService.updateRoomLayout(currentUser.uid, newLayout);
    sound.playSuccess();
  };

  // Handle House Upgrade
  const handleUpgradeHouse = async (newLevel: number, cost: number) => {
    if (!currentUser) return;
    await dbService.upgradeHouse(currentUser.uid, newLevel, cost);
    setCurrentUser((prev) => prev ? { ...prev, coins: prev.coins - cost, houseLevel: newLevel } : null);
    syncSelfPresence({ houseLevel: newLevel }, true);
  };

  // Handle Complete Tutorial
  const handleCompleteTutorial = async () => {
    if (!currentUser) return;
    await dbService.completeTutorial(currentUser.uid, 1000);
    setCurrentUser((prev) => prev ? { ...prev, coins: prev.coins + 1000, hasCompletedTutorial: true } : null);
    setIsTutorialOpen(false);
  };

  const handleVisitPlayerHome = (targetPresence: IslandPresence) => {
    const targetHouse = activeHouses.find((h) => h.ownerUid === targetPresence.uid);
    if (targetHouse) {
      handleEnterHouse(targetHouse);
    } else {
      setVisitingUser({
        uid: targetPresence.uid,
        displayName: targetPresence.displayName,
        coins: 100,
        role: 'user',
        houseLevel: targetPresence.houseLevel || 1,
        equipped: targetPresence.equipped,
        inventory: [],
        roomLayout: [],
        friends: [],
        friendRequests: [],
      } as UserProfile);
      setCurrentPlace('home');
      setLocalPos({ x: 5, y: 7, facing: 'right', isMoving: false });
      syncSelfPresence({
        currentPlace: 'home',
        x: 5,
        y: 7,
        visitingHomeUid: targetPresence.uid,
      }, true);
      sound.playDoor();
    }
  };

  const handleChallengePlayer = (targetPlayer: IslandPresence) => {
    setChallengedPlayer(targetPlayer);
    setIsArcadeOpen(true);
  };

  const handleSignOut = async () => {
    sound.playBump();
    await dbService.signOutUser();
    setCurrentUser(null);
    setIsAdminOpen(false);
  };

  const onlineCount = Object.keys(presences).length;

  // Admin shortcut: if admin is logged in, show admin dashboard directly
  const isAdminUser = currentUser?.email?.toLowerCase() === 'ltairui79@gmail.com';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a0a05] select-none" style={{ fontFamily: "'Noto Serif TC', 'Hiragino Mincho ProN', serif" }}>

      {/* Admin Full-Screen Dashboard (bypasses game entirely) */}
      {isAdminUser && isAdminOpen && (
        <AdminDashboardModal
          isOpen={true}
          onClose={() => { setIsAdminOpen(false); handleSignOut(); }}
          items={items}
          presences={presences}
        />
      )}

      {/* Show regular game only if not in admin mode */}
      {(!isAdminUser || !isAdminOpen) && (
        <>
      {/* Top Navigation Bar — Showa Japanese style */}
      <Navbar
        user={currentUser}
        onlineCount={onlineCount}
        currentUid={currentUser?.uid || ''}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenWardrobe={() => {
          setBoutiqueInitialTab('wardrobe');
          setIsBoutiqueOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenHouseUpgrade={() => setIsHouseUpgradeOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onSignOut={handleSignOut}
        onToggleFriends={() => setIsFriendPanelOpen((prev) => !prev)}
      />

      {/* Main World View (Island or Home Interior) */}
      <main className="w-full h-full">
        {currentPlace === 'island' ? (
          <IslandMap
            currentUid={currentUser?.uid || ''}
            localPos={localPos}
            currentUser={currentUser}
            presences={presences}
            itemsMap={itemsMap}
            activeHouses={activeHouses}
            mapBgUrl={'/island_map_showa.jpg'}
            onTileClick={handleTileClick}
            onPlayerClick={(player) => setSelectedPlayer(player)}
            onEnterHouse={handleEnterHouse}
            onOpenUpgrade={() => setIsHouseUpgradeOpen(true)}
            onBuildingClick={(type) => {
              if (type === 'boutique') {
                sound.playWindChime();
                setBoutiqueInitialTab('shop');
                setIsBoutiqueOpen(true);
              } else if (type === 'arcade') {
                sound.playTaiko();
                setIsArcadeOpen(true);
              } else if (type === 'casino') {
                sound.playTaiko();
                setIsCasinoOpen(true);
              }
            }}
          />
        ) : (
          <HomeMap
            hostUser={visitingUser || currentUser!}
            currentUid={currentUser?.uid || ''}
            presences={presences}
            itemsMap={itemsMap}
            onSaveLayout={handleSaveRoomLayout}
            onExitHome={() => {
              setCurrentPlace('island');
              const targetHouse = activeHouses.find((h) => h.ownerUid === visitingUser?.uid) || activeHouses[0];
              const exitX = targetHouse ? targetHouse.doorX : 29;
              const exitY = targetHouse ? targetHouse.doorY + 1 : 12;
              setLocalPos({ x: exitX, y: exitY, facing: 'right', isMoving: false });
              setVisitingUser(null);
              syncSelfPresence({
                currentPlace: 'island',
                x: exitX,
                y: exitY,
                visitingHomeUid: undefined,
              }, true);
              sound.playDoor();
            }}
            onTileClick={handleTileClick}
          />
        )}
      </main>

      {/* Cross-Platform Controller HUD */}
      <VirtualControls
        onMove={handleMove}
        onMoveDelta={handleMoveDelta}
        onInteract={handleInteract}
        onSendEmoji={handleSendEmoji}
        contextPrompt={contextPrompt}
        onContextAction={handleInteract}
      />

      {/* Boutique & Wardrobe Modal */}
      {currentUser && (
        <BoutiqueModal
          isOpen={isBoutiqueOpen}
          onClose={() => setIsBoutiqueOpen(false)}
          user={currentUser}
          items={items}
          initialTab={boutiqueInitialTab}
          onEquipChange={handleEquipChange}
          onBuyItem={handleBuyItem}
        />
      )}

      {/* Arcade Center Modal */}
      {currentUser && (
        <ArcadeModal
          isOpen={isArcadeOpen}
          onClose={() => {
            setIsArcadeOpen(false);
            setChallengedPlayer(null);
          }}
          currentUser={currentUser}
          challengedPlayer={challengedPlayer}
          onClearChallenge={() => setChallengedPlayer(null)}
        />
      )}

      {/* Casino Center Modal (777 Retro Slot Machine) */}
      {currentUser && (
        <CasinoModal
          isOpen={isCasinoOpen}
          onClose={() => setIsCasinoOpen(false)}
          currentUser={currentUser}
          onRewardCoins={(amt) => dbService.rewardCoins(currentUser.uid, amt)}
          onDeductCoins={(amt) => dbService.rewardCoins(currentUser.uid, -amt)}
        />
      )}

      {/* Admin Dashboard (non-admin quick access) */}
      {currentUser?.role === 'admin' && !isAdminUser && (
        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          items={items}
          presences={presences}
        />
      )}

      {/* Compulsory Mandatory Login Gate */}
      <AuthModal
        isOpen={!currentUser || isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        isMandatory={!currentUser}
      />

      {/* First-Time Player Interactive Tutorial */}
      {currentUser && (
        <TutorialModal
          isOpen={isTutorialOpen}
          onComplete={handleCompleteTutorial}
          playerName={currentUser.displayName}
        />
      )}

      {/* House Upgrade Modal */}
      {currentUser && (
        <HouseUpgradeModal
          isOpen={isHouseUpgradeOpen}
          onClose={() => setIsHouseUpgradeOpen(false)}
          currentUser={currentUser}
          onUpgradeSuccess={handleUpgradeHouse}
        />
      )}

      {/* Player Interaction Action Modal */}
      <PlayerActionModal
        player={selectedPlayer}
        currentUid={currentUser?.uid || ''}
        currentName={currentUser?.displayName || '冒險家'}
        itemsMap={itemsMap}
        onClose={() => setSelectedPlayer(null)}
        onChallenge={handleChallengePlayer}
        onVisitHome={handleVisitPlayerHome}
        onSendWave={() => handleSendEmoji('👋')}
      />

      {/* Friend System Side Panel */}
      {isFriendPanelOpen && (
        <FriendPanel
          currentUid={currentUser?.uid || ''}
          currentName={currentUser?.displayName || '冒險家'}
          presences={presences}
          onClose={() => setIsFriendPanelOpen(false)}
          onVisitHome={(targetPresence) => {
            setIsFriendPanelOpen(false);
            handleVisitPlayerHome(targetPresence);
          }}
        />
      )}

      {/* AFK Idle Kick Warning Countdown Banner (30 seconds before 3-minute kick) */}
      {afkWarningRemaining !== null && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#991b1b]/95 border-2 border-[#fef08a] rounded-full text-white text-xs font-serif shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-base">⚠️</span>
          <span>閒置提醒：您已長時間無動作，將於</span>
          <span className="font-mono font-black text-amber-300 text-sm px-1.5 py-0.5 bg-black/40 rounded">{afkWarningRemaining}</span>
          <span>秒後自動離線！(請移動或點擊任意處)</span>
        </div>
      )}

      {/* 3-Minute Idle Kick Showa Japanese Alert Modal */}
      {isAfkKicked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#201109] border-4 border-[#8b4513] rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(0,0,0,0.9)] text-[#fef08a] font-serif">
            <div className="text-4xl mb-3">⛩️ 🏮</div>
            <h3 className="text-lg font-bold text-[#fef08a] mb-2 tracking-wider">
              閒置離線通知（3 分鐘無動作）
            </h3>
            <p className="text-sm text-[#fed7aa] mb-5 leading-relaxed">
              因您已超過 3 分鐘未進行任何操作，為了維護櫻花島嶼平穩運行，系統已將您暫時請回休養。隨時歡迎您再次光臨！
            </p>
            <button
              onClick={() => {
                setIsAfkKicked(false);
                setIsAuthOpen(true);
                sound.playShojiDoor();
              }}
              className="w-full py-3 bg-[#991b1b] hover:bg-[#b91c1c] text-[#fef08a] font-bold text-sm rounded-xl border-2 border-[#f59e0b] shadow-lg cursor-pointer tracking-widest active:scale-95 transition-all"
            >
              重新踏入島嶼 🌸
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default App;
