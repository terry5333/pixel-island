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
  checkBuildingEntrance, 
  HOME_HEIGHT 
} from './config/mapData';
import { IslandMap } from './components/IslandMap';
import { HomeMap } from './components/HomeMap';
import { Navbar } from './components/Navbar';
import { VirtualControls } from './components/VirtualControls';
import { BoutiqueModal } from './components/BoutiqueModal';
import { ArcadeModal } from './components/ArcadeModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { PlayerActionModal } from './components/PlayerActionModal';

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
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<IslandPresence | null>(null);
  const [challengedPlayer, setChallengedPlayer] = useState<IslandPresence | null>(null);

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

  // High-performance local position state (0ms latency, zero stutter)
  const [localPos, setLocalPos] = useState({
    x: 18,
    y: 13,
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
      if (!forceSync && updates.isMoving && now - lastSyncTimeRef.current < 180) {
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
      syncSelfPresence({ x: 18, y: 13, facing: 'right' });
    }
  }, [currentUser, presences, syncSelfPresence]);

  // Detect interaction at current position
  const contextBuilding = useMemo(() => {
    if (currentPlace !== 'island') return null;
    return checkBuildingEntrance(localPos.x, localPos.y);
  }, [currentPlace, localPos.x, localPos.y]);

  const isHomeExitMat = useMemo(() => {
    if (currentPlace !== 'home') return false;
    return localPos.y === HOME_HEIGHT - 1 && (localPos.x === 5 || localPos.x === 6);
  }, [currentPlace, localPos.x, localPos.y]);

  // Determine floating contextual prompt text
  const contextPrompt = useMemo(() => {
    if (contextBuilding) {
      if (contextBuilding.type === 'boutique') return '進入精品服飾店 👗';
      if (contextBuilding.type === 'arcade') return '進入「銭屋」街機遊樂場 🕹️';
      if (contextBuilding.type === 'home') return '進入個人溫馨小屋 🏡';
    }
    if (isHomeExitMat) {
      return '離開小屋 (回到島嶼) 🚪';
    }
    return null;
  }, [contextBuilding, isHomeExitMat]);

  // Handle Player Movement (Instant local responsiveness, buttery smooth continuous walking)
  const handleMove = useCallback(
    (dir: 'up' | 'down' | 'left' | 'right') => {
      if (!currentUser) return;

      const current = localPosRef.current;
      let dx = 0;
      let dy = 0;
      let newFacing: 'left' | 'right' = current.facing;

      if (dir === 'up') dy = -1;
      if (dir === 'down') dy = 1;
      if (dir === 'left') {
        dx = -1;
        newFacing = 'left';
      }
      if (dir === 'right') {
        dx = 1;
        newFacing = 'right';
      }

      const nextX = current.x + dx;
      const nextY = current.y + dy;

      let canWalk = false;
      if (currentPlace === 'island') {
        canWalk = isIslandWalkable(nextX, nextY);
      } else {
        canWalk = isHomeWalkable(nextX, nextY);
      }

      if (canWalk) {
        sound.playStep();
        const nextState = {
          x: nextX,
          y: nextY,
          facing: newFacing,
          isMoving: true,
        };
        setLocalPos(nextState);
        localPosRef.current = nextState;

        syncSelfPresence(
          {
            x: nextX,
            y: nextY,
            facing: newFacing,
            isMoving: true,
          },
          false
        );

        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = window.setTimeout(() => {
          setLocalPos((prev) => ({ ...prev, isMoving: false }));
          syncSelfPresence({ isMoving: false }, true);
        }, 150);
      } else {
        sound.playBump();
      }
    },
    [currentUser, currentPlace, syncSelfPresence]
  );

  // Handle Interaction (Space / Enter / A Button / Click Prompt)
  const handleInteract = useCallback(() => {
    if (contextBuilding) {
      sound.playDoor();
      if (contextBuilding.type === 'boutique') {
        setBoutiqueInitialTab('shop');
        setIsBoutiqueOpen(true);
      } else if (contextBuilding.type === 'arcade') {
        setIsArcadeOpen(true);
      } else if (contextBuilding.type === 'home') {
        setVisitingUser(currentUser);
        setCurrentPlace('home');
        syncSelfPresence({
          currentPlace: 'home',
          x: 5,
          y: 7,
          visitingHomeUid: currentUser?.uid,
        }, true);
      }
      return;
    }

    if (isHomeExitMat) {
      sound.playDoor();
      setCurrentPlace('island');
      setVisitingUser(null);
      syncSelfPresence({
        currentPlace: 'island',
        x: 28,
        y: 12,
        visitingHomeUid: undefined,
      }, true);
    }
  }, [contextBuilding, isHomeExitMat, currentUser, syncSelfPresence]);

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

      // Single step toward target tile
      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else if (dy !== 0) {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    },
    [currentUser, handleMove]
  );

  // Handle Buying Item in Boutique
  const handleBuyItem = async (item: Item) => {
    if (!currentUser) return;
    const newCoins = currentUser.coins - item.price;
    const newInventory = [...currentUser.inventory, item.id];

    await dbService.updateUserProfile(currentUser.uid, {
      coins: newCoins,
      inventory: newInventory,
    });
  };

  // Handle Changing Equipped Items (Synchronized immediately to RTDB + Firestore)
  const handleEquipChange = async (newEquipped: EquippedItems) => {
    if (!currentUser) return;
    await dbService.updateUserProfile(currentUser.uid, {
      equipped: newEquipped,
    });
    // Immediately push to RTDB so other players see outfit right away
    syncSelfPresence({ equipped: newEquipped });
  };

  // Handle Saving Room Layout
  const handleSaveRoomLayout = async (newLayout: RoomFurniture[]) => {
    if (!currentUser) return;
    await dbService.updateUserProfile(currentUser.uid, {
      roomLayout: newLayout,
    });
  };

  // Visit another player's house
  const handleVisitPlayerHome = async (targetPlayer: IslandPresence) => {
    const profile = await dbService.getUserProfile(targetPlayer.uid);
    if (profile) {
      setVisitingUser(profile);
      setCurrentPlace('home');
      syncSelfPresence({
        currentPlace: 'home',
        x: 5,
        y: 7,
        visitingHomeUid: profile.uid,
      });
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
  };

  const onlineCount = Object.keys(presences).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#181425] select-none">
      {/* Top Navigation Bar */}
      <Navbar
        user={currentUser}
        onlineCount={onlineCount}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenWardrobe={() => {
          setBoutiqueInitialTab('wardrobe');
          setIsBoutiqueOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
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
            onTileClick={handleTileClick}
            onPlayerClick={(player) => setSelectedPlayer(player)}
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
              setVisitingUser(null);
              syncSelfPresence({
                currentPlace: 'island',
                x: 36,
                y: 11,
                visitingHomeUid: undefined,
              });
              sound.playDoor();
            }}
            onTileClick={handleTileClick}
          />
        )}
      </main>

      {/* Cross-Platform Controller HUD (Desktop hotkeys + Mobile Virtual D-Pad / A button) */}
      <VirtualControls
        onMove={handleMove}
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

      {/* Admin Dashboard Modal */}
      {currentUser?.role === 'admin' && (
        <AdminDashboardModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          items={items}
        />
      )}

      {/* Auth & Character Switcher Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
      />

      {/* Player Interaction Action Modal */}
      <PlayerActionModal
        player={selectedPlayer}
        itemsMap={itemsMap}
        onClose={() => setSelectedPlayer(null)}
        onChallenge={handleChallengePlayer}
        onVisitHome={handleVisitPlayerHome}
        onSendWave={() => handleSendEmoji('👋')}
      />
    </div>
  );
};

export default App;
