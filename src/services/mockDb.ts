import { IslandPresence, Item, UserProfile, ArcadeRoom } from '../types/game';
import { INITIAL_ITEMS } from './mockData';

// Multi-tab broadcast channel for local peer-to-peer presence synchronization
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('pixel_island_sync') 
  : null;

const STORAGE_KEYS = {
  USER: 'pixel_island_mock_user',
  ITEMS: 'pixel_island_mock_items',
  ROOMS: 'pixel_island_mock_rooms',
};

// Initial state helpers
export function getStoredItems(): Item[] {
  const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
    return INITIAL_ITEMS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_ITEMS;
  }
}

export function saveStoredItems(items: Item[]) {
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  if (channel) {
    channel.postMessage({ type: 'ITEMS_UPDATE', items });
  }
}

export function getStoredRooms(): Record<string, ArcadeRoom> {
  const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveStoredRoom(room: ArcadeRoom) {
  const rooms = getStoredRooms();
  rooms[room.roomId] = room;
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  if (channel) {
    channel.postMessage({ type: 'ROOM_UPDATE', room });
  }
}

export function deleteStoredRoom(roomId: string) {
  const rooms = getStoredRooms();
  delete rooms[roomId];
  localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  if (channel) {
    channel.postMessage({ type: 'ROOM_DELETE', roomId });
  }
}

// Online players in mock mode (current tab + other tabs via broadcast + friendly NPC bot)
export class MockNetworkManager {
  private presences: Map<string, IslandPresence> = new Map();
  private presenceSubscribers: Set<(presences: Record<string, IslandPresence>) => void> = new Set();
  private itemSubscribers: Set<(items: Item[]) => void> = new Set();
  private roomSubscribers: Map<string, Set<(room: ArcadeRoom | null) => void>> = new Map();
  private npcInterval: number | null = null;

  constructor() {
    // Add friendly NPC Guide Bobo
    this.initNpcBot();

    if (channel) {
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'PRESENCE_UPDATE' && data.presence) {
          this.presences.set(data.presence.uid, data.presence);
          this.notifyPresence();
        } else if (data.type === 'PRESENCE_LEAVE' && data.uid) {
          this.presences.delete(data.uid);
          this.notifyPresence();
        } else if (data.type === 'ITEMS_UPDATE' && data.items) {
          this.notifyItems(data.items);
        } else if (data.type === 'ROOM_UPDATE' && data.room) {
          this.notifyRoom(data.room);
        }
      };
    }

    // Clean up on tab close
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        const currentUserUid = sessionStorage.getItem('pixel_island_session_uid');
        if (currentUserUid && channel) {
          channel.postMessage({ type: 'PRESENCE_LEAVE', uid: currentUserUid });
        }
      });
    }
  }

  private initNpcBot() {
    const npc: IslandPresence = {
      uid: 'npc_bobo',
      displayName: '導遊波波 🤖',
      x: 25,
      y: 13,
      facing: 'right',
      equipped: {
        hair: 'hair_04',
        top: 'top_03',
        bottom: 'bottom_02',
        accessory: 'acc_01',
      },
      currentPlace: 'island',
      updatedAt: Date.now(),
    };
    this.presences.set(npc.uid, npc);

    // NPC wander loop
    if (typeof window !== 'undefined') {
      this.npcInterval = window.setInterval(() => {
        const cur = this.presences.get('npc_bobo');
        if (!cur) return;
        const dx = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.6 ? 1 : 0);
        const dy = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.6 ? 1 : 0);
        const nx = Math.max(22, Math.min(26, cur.x + dx));
        const ny = Math.max(12, Math.min(14, cur.y + dy));
        
        const randomEmoji = Math.random() < 0.2 ? ['👋', '🏝️', '✨', '🎮', '💖'][Math.floor(Math.random() * 5)] : null;

        this.presences.set('npc_bobo', {
          ...cur,
          x: nx,
          y: ny,
          facing: dx < 0 ? 'left' : dx > 0 ? 'right' : cur.facing,
          isMoving: dx !== 0 || dy !== 0,
          emojiBubble: randomEmoji ? { emoji: randomEmoji, expiresAt: Date.now() + 3500 } : cur.emojiBubble,
          updatedAt: Date.now(),
        });
        this.notifyPresence();
      }, 4000);
    }
  }

  public updatePresence(presence: IslandPresence) {
    sessionStorage.setItem('pixel_island_session_uid', presence.uid);
    this.presences.set(presence.uid, presence);
    this.notifyPresence();

    if (channel) {
      channel.postMessage({ type: 'PRESENCE_UPDATE', presence });
    }
  }

  public removePresence(uid: string) {
    this.presences.delete(uid);
    this.notifyPresence();
    if (channel) {
      channel.postMessage({ type: 'PRESENCE_LEAVE', uid });
    }
  }

  public subscribePresence(cb: (presences: Record<string, IslandPresence>) => void) {
    this.presenceSubscribers.add(cb);
    // Send current immediately
    const obj: Record<string, IslandPresence> = {};
    this.presences.forEach((v, k) => { obj[k] = v; });
    cb(obj);
    return () => {
      this.presenceSubscribers.delete(cb);
    };
  }

  private notifyPresence() {
    const obj: Record<string, IslandPresence> = {};
    const now = Date.now();
    this.presences.forEach((v, k) => {
      // Clear expired emoji
      if (v.emojiBubble && v.emojiBubble.expiresAt < now) {
        v.emojiBubble = null;
      }
      obj[k] = v;
    });
    this.presenceSubscribers.forEach((cb) => cb(obj));
  }

  public subscribeItems(cb: (items: Item[]) => void) {
    this.itemSubscribers.add(cb);
    cb(getStoredItems());
    return () => {
      this.itemSubscribers.delete(cb);
    };
  }

  public notifyItems(items: Item[]) {
    this.itemSubscribers.forEach((cb) => cb(items));
  }

  public subscribeRoom(roomId: string, cb: (room: ArcadeRoom | null) => void) {
    if (!this.roomSubscribers.has(roomId)) {
      this.roomSubscribers.set(roomId, new Set());
    }
    this.roomSubscribers.get(roomId)!.add(cb);
    const rooms = getStoredRooms();
    cb(rooms[roomId] || null);
    return () => {
      this.roomSubscribers.get(roomId)?.delete(cb);
    };
  }

  private notifyRoom(room: ArcadeRoom) {
    const subs = this.roomSubscribers.get(room.roomId);
    if (subs) {
      subs.forEach((cb) => cb(room));
    }
  }
}

export const mockNetwork = new MockNetworkManager();
