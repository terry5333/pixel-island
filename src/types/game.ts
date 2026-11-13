export type ItemCategory = 'hair' | 'top' | 'bottom' | 'accessory' | 'furniture' | 'tile';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  r2Url?: string;
  zIndex?: number;
  walkable?: boolean;
  createdAt?: number | string;
  description?: string;
  color?: string;
  secondaryColor?: string;
  variant?: string;
}

export interface EquippedItems {
  hair?: string;
  top?: string;
  bottom?: string;
  accessory?: string;
}

export interface RoomFurniture {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  coins: number;
  inventory: string[];
  equipped: EquippedItems;
  roomLayout: RoomFurniture[];
  role: 'user' | 'admin';
  friends?: FriendEntry[];
  friendRequests?: FriendRequest[];
}

export interface EmojiBubble {
  emoji: string;
  expiresAt: number;
}

export interface IslandPresence {
  uid: string;
  displayName: string;
  x: number;
  y: number;
  facing: 'left' | 'right';
  equipped: EquippedItems;
  emojiBubble?: EmojiBubble | null;
  currentPlace?: 'island' | 'home' | 'boutique' | 'arcade';
  visitingHomeUid?: string;
  updatedAt: number;
  isMoving?: boolean;
}

export type GameType = '1a2b' | 'ooxx' | 'battleship' | 'dots_boxes';

export interface GuessRecord {
  guess: string;
  a: number;
  b: number;
  timestamp: number;
}

export interface Game1A2BState {
  hostSecret?: string;
  guestSecret?: string;
  hostGuesses: GuessRecord[];
  guestGuesses: GuessRecord[];
}

export interface MoveRecord {
  uid: string;
  index: number;
}

export interface GameOOXXState {
  mode: 'infinite' | 'classic';
  board: (string | null)[]; // 9 cells with player uid
  pieceHistory: MoveRecord[];
  winningLine?: number[];
}

export interface ArcadeRoom {
  roomId: string;
  gameType: GameType;
  mode: 'ai' | 'pvp';
  status: 'waiting' | 'setup' | 'playing' | 'finished';
  hostUid: string;
  hostName: string;
  guestUid?: string;
  guestName?: string;
  currentTurn?: string; // uid of the player whose turn it is
  winner?: string | 'draw';
  isPublic: boolean;
  state1a2b?: Game1A2BState;
  stateOoxx?: GameOOXXState;
  createdAt: number;
  updatedAt: number;
}

export interface FriendRequest {
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface FriendEntry {
  uid: string;
  displayName: string;
  addedAt: number;
}
