import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  ref, 
  set, 
  onValue, 
  onDisconnect, 
  remove 
} from 'firebase/database';
import { auth, db, rtdb, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { mockNetwork, getStoredItems, saveStoredItems, getStoredRooms, saveStoredRoom, deleteStoredRoom } from './mockDb';
import { Item, UserProfile, IslandPresence, ArcadeRoom, FriendEntry, FriendRequest, EquippedItems, RoomFurniture } from '../types/game';

const ADMIN_EMAILS = [
  'ltairui79@gmail.com',
  ...(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean),
];

const DEFAULT_PROFILE: Omit<UserProfile, 'uid' | 'displayName' | 'email'> = {
  coins: 1000,
  inventory: ['hair_01', 'hair_04', 'top_01', 'top_02', 'bottom_01', 'bottom_02', 'furn_01', 'furn_05', 'furn_06'],
  equipped: {
    hair: 'hair_01',
    top: 'top_01',
    bottom: 'bottom_01',
  },
  roomLayout: [
    { instanceId: 'init_bed', itemId: 'furn_01', x: 2, y: 2, rotation: 0 },
    { instanceId: 'init_table', itemId: 'furn_05', x: 5, y: 3, rotation: 0 },
    { instanceId: 'init_plushie', itemId: 'furn_06', x: 2, y: 5, rotation: 0 },
  ],
  role: 'user',
};

// Check if an email is an administrator
export function isUserAdmin(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase()) || email.startsWith('admin');
}

export function sanitizeRtdbData<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeRtdbData) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      result[key] = sanitizeRtdbData(val);
    }
  }
  return result as T;
}

export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = removeUndefinedFields(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

export class DatabaseService {
  private activeUser: UserProfile | null = null;
  private authSubscribers: Set<(user: UserProfile | null) => void> = new Set();

  constructor() {
    if (isFirebaseConfigured && auth) {
      firebaseOnAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const profile = await this.syncFirebaseUserProfile(firebaseUser);
          this.activeUser = profile;
          this.notifyAuth(profile);
        } else {
          // Check for previously saved local resident session
          const guestRaw = localStorage.getItem('pixel_island_firebase_guest');
          if (guestRaw) {
            try {
              const guestProfile = JSON.parse(guestRaw);
              this.activeUser = guestProfile;
              this.notifyAuth(guestProfile);
              return;
            } catch {}
          }
          // Mandatory login: User must authenticate or choose a nickname
          this.activeUser = null;
          this.notifyAuth(null);
        }
      });
    } else {
      // Mock mode: Check for saved user
      const saved = localStorage.getItem('pixel_island_mock_user');
      if (saved) {
        try {
          this.activeUser = JSON.parse(saved);
          this.notifyAuth(this.activeUser);
        } catch {
          this.activeUser = null;
          this.notifyAuth(null);
        }
      } else {
        this.activeUser = null;
        this.notifyAuth(null);
      }
    }
  }

  // --- AUTHENTICATION ---

  public initMockDefaultUser(id: string, name: string, role: 'user' | 'admin' = 'user'): UserProfile {
    const user: UserProfile = {
      uid: id,
      displayName: name,
      email: `${id}@pixelisland.local`,
      ...DEFAULT_PROFILE,
      role: role,
    };
    this.activeUser = user;
    localStorage.setItem('pixel_island_mock_user', JSON.stringify(user));
    this.notifyAuth(user);
    return user;
  }

  public async signInWithGoogle(): Promise<UserProfile> {
    if (isFirebaseConfigured && auth && googleProvider) {
      const result = await signInWithPopup(auth, googleProvider);
      return this.syncFirebaseUserProfile(result.user);
    } else {
      // Mock mode switch/login
      const user = this.initMockDefaultUser(
        'google_user_' + Math.floor(Math.random() * 1000),
        '像素探險者',
        'user'
      );
      return user;
    }
  }

  public async signOutUser(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    if (this.activeUser) {
      this.removePresence(this.activeUser.uid);
    }
    this.activeUser = null;
    localStorage.removeItem('pixel_island_mock_user');
    localStorage.removeItem('pixel_island_firebase_guest');
    this.notifyAuth(null);
  }

  public onAuthChange(cb: (user: UserProfile | null) => void) {
    this.authSubscribers.add(cb);
    cb(this.activeUser);
    return () => {
      this.authSubscribers.delete(cb);
    };
  }

  private notifyAuth(user: UserProfile | null) {
    this.authSubscribers.forEach((cb) => cb(user));
  }

  private async syncFirebaseUserProfile(fbUser: FirebaseUser): Promise<UserProfile> {
    if (!db) throw new Error('Firestore not initialized');
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);

    const isAdmin = isUserAdmin(fbUser.email || '');

    if (!snap.exists()) {
      const newProfile: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || '島民新手',
        email: fbUser.email || '',
        ...DEFAULT_PROFILE,
        role: isAdmin ? 'admin' : 'user',
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    } else {
      const data = snap.data() as UserProfile;
      if (isAdmin && data.role !== 'admin') {
        data.role = 'admin';
        await updateDoc(userRef, { role: 'admin' });
      }
      return data;
    }
  }

  // --- USER PROFILE & INVENTORY ---

  public async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const cleanUpdates = removeUndefinedFields(updates);
    if (isFirebaseConfigured && db) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, cleanUpdates);
    }

    if (this.activeUser && this.activeUser.uid === uid) {
      this.activeUser = { ...this.activeUser, ...cleanUpdates };
      localStorage.setItem('pixel_island_mock_user', JSON.stringify(this.activeUser));
      this.notifyAuth(this.activeUser);
    }
  }

  public async updateEquipped(uid: string, equipped: EquippedItems): Promise<void> {
    await this.updateUserProfile(uid, { equipped });
  }

  public async buyItem(uid: string, item: Item): Promise<void> {
    const profile = await this.getUserProfile(uid);
    if (!profile) return;
    if (profile.coins < item.price) {
      throw new Error('金幣不足！');
    }
    const newInventory = [...profile.inventory, item.id];
    await this.updateUserProfile(uid, {
      coins: profile.coins - item.price,
      inventory: newInventory,
    });
  }

  public async updateRoomLayout(uid: string, roomLayout: RoomFurniture[]): Promise<void> {
    await this.updateUserProfile(uid, { roomLayout });
  }

  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    }
    if (this.activeUser?.uid === uid) return this.activeUser;
    return null;
  }

  public async rewardCoins(uid: string, amount: number): Promise<void> {
    const profile = await this.getUserProfile(uid);
    if (profile) {
      await this.updateUserProfile(uid, {
        coins: Math.max((profile.coins || 0) + amount, 0),
      });
    }
  }

  public async upgradeHouse(uid: string, nextLevel: number, cost: number): Promise<void> {
    const profile = await this.getUserProfile(uid);
    if (profile) {
      if (profile.coins < cost) {
        throw new Error('金幣不足，無法升級房屋！');
      }
      await this.updateUserProfile(uid, {
        coins: profile.coins - cost,
        houseLevel: nextLevel,
      });
    }
  }

  public async completeTutorial(uid: string, bonusCoins = 1000): Promise<void> {
    const profile = await this.getUserProfile(uid);
    if (profile) {
      await this.updateUserProfile(uid, {
        coins: (profile.coins || 0) + bonusCoins,
        hasCompletedTutorial: true,
      });
    }
  }

  // --- REALTIME PRESENCE (RTDB) ---

  public updatePresence(presence: IslandPresence): void {
    const sanitized = sanitizeRtdbData(presence);
    if (isFirebaseConfigured && rtdb) {
      const presenceRef = ref(rtdb, `island_presence/${presence.uid}`);
      set(presenceRef, sanitized).catch((err) => {
        console.warn('[RTDB Presence Error]', err);
      });
      // Ensure player is automatically removed upon disconnect or tab close
      onDisconnect(presenceRef).remove();
    } else {
      mockNetwork.updatePresence(sanitized);
    }
  }

  public removePresence(uid: string): void {
    if (isFirebaseConfigured && rtdb) {
      const presenceRef = ref(rtdb, `island_presence/${uid}`);
      remove(presenceRef);
    } else {
      mockNetwork.removePresence(uid);
    }
  }

  public subscribePresence(cb: (presences: Record<string, IslandPresence>) => void) {
    if (isFirebaseConfigured && rtdb) {
      const presenceRef = ref(rtdb, 'island_presence');
      const unsubscribe = onValue(presenceRef, (snapshot) => {
        const val = snapshot.val() || {};
        cb(val);
      });
      return () => unsubscribe();
    } else {
      return mockNetwork.subscribePresence(cb);
    }
  }

  // --- ITEMS CATALOG (FIRESTORE) ---

  public subscribeItems(cb: (items: Item[]) => void) {
    if (isFirebaseConfigured && db) {
      const itemsCol = collection(db, 'items');
      return onSnapshot(itemsCol, async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial catalog items to Firestore
          try {
            const { INITIAL_ITEMS } = await import('./mockData');
            for (const item of INITIAL_ITEMS) {
              await setDoc(doc(db!, 'items', item.id), item);
            }
          } catch (e) {
            console.warn('[Firestore] Auto-seed items:', e);
          }
          const { INITIAL_ITEMS } = await import('./mockData');
          cb(INITIAL_ITEMS);
          return;
        }
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
        cb(items);
      });
    } else {
      return mockNetwork.subscribeItems(cb);
    }
  }

  public async addItem(item: Omit<Item, 'id'>): Promise<string> {
    if (isFirebaseConfigured && db) {
      const docRef = await addDoc(collection(db, 'items'), {
        ...item,
        createdAt: Date.now(),
      });
      return docRef.id;
    } else {
      const items = getStoredItems();
      const id = 'custom_' + Date.now().toString(36);
      const newItem: Item = { id, ...item, createdAt: Date.now() };
      items.push(newItem);
      saveStoredItems(items);
      return id;
    }
  }

  public async updateItem(id: string, updates: Partial<Item>): Promise<void> {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'items', id), updates);
    } else {
      const items = getStoredItems().map((it) => (it.id === id ? { ...it, ...updates } : it));
      saveStoredItems(items);
    }
  }

  public async deleteItem(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'items', id));
    } else {
      const items = getStoredItems().filter((it) => it.id !== id);
      saveStoredItems(items);
    }
  }

  // --- ARCADE ROOMS (FIRESTORE) ---

  public async createArcadeRoom(room: Omit<ArcadeRoom, 'roomId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Generate 4-digit code (e.g. 1000 - 9999)
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    const fullRoom: ArcadeRoom = {
      ...room,
      roomId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const cleanRoom = removeUndefinedFields(fullRoom);

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'arcade_rooms', roomId), cleanRoom);
    } else {
      saveStoredRoom(fullRoom);
    }
    return roomId;
  }

  public async getArcadeRoom(roomId: string): Promise<ArcadeRoom | null> {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'arcade_rooms', roomId));
      return snap.exists() ? (snap.data() as ArcadeRoom) : null;
    } else {
      const rooms = getStoredRooms();
      return rooms[roomId] || null;
    }
  }

  public async updateArcadeRoom(roomId: string, updates: Partial<ArcadeRoom>): Promise<void> {
    const dataWithTs = { ...updates, updatedAt: Date.now() };
    const cleanUpdates = removeUndefinedFields(dataWithTs);
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'arcade_rooms', roomId), cleanUpdates);
    } else {
      const rooms = getStoredRooms();
      if (rooms[roomId]) {
        rooms[roomId] = { ...rooms[roomId], ...dataWithTs };
        saveStoredRoom(rooms[roomId]);
      }
    }
  }

  public subscribeArcadeRoom(roomId: string, cb: (room: ArcadeRoom | null) => void) {
    if (isFirebaseConfigured && db) {
      return onSnapshot(doc(db, 'arcade_rooms', roomId), (snap) => {
        cb(snap.exists() ? (snap.data() as ArcadeRoom) : null);
      });
    } else {
      return mockNetwork.subscribeRoom(roomId, cb);
    }
  }

  public async getPublicArcadeRooms(): Promise<ArcadeRoom[]> {
    if (isFirebaseConfigured && db) {
      // In Firestore, fetch recent rooms
      const rooms: ArcadeRoom[] = [];
      return rooms;
    } else {
      const rooms = getStoredRooms();
      return Object.values(rooms).filter((r) => r.isPublic && r.status !== 'finished');
    }
  }

  // --- CLOUDFLARE R2 UPLOAD ---

  public async uploadR2Asset(file: File): Promise<string> {
    const uploadEndpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT;
    const publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';

    if (uploadEndpoint) {
      try {
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const targetUrl = `${uploadEndpoint.replace(/\/$/, '')}/${fileName}`;
        
        const res = await fetch(targetUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'image/png',
            ...(import.meta.env.VITE_R2_API_TOKEN
              ? { Authorization: `Bearer ${import.meta.env.VITE_R2_API_TOKEN}` }
              : {}),
          },
          body: file,
        });

        if (res.ok) {
          return targetUrl;
        }
      } catch (err) {
        console.warn('[R2 Direct Upload] Fallback to preview data URL:', err);
      }
    }

    // Fallback: convert file to Data URL (100% usable for live preview & saving)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  // --- FRIEND SYSTEM ---

  // In-memory mock store for friends in mock mode
  private _mockFriends: Record<string, FriendEntry[]> = {};
  private _mockFriendRequests: Record<string, FriendRequest[]> = {};

  public async sendFriendRequest(fromUid: string, fromName: string, toUid: string, toName: string): Promise<void> {
    const requestId = `${fromUid}_${toUid}`;
    const request: FriendRequest = {
      fromUid,
      fromName,
      toUid,
      toName,
      status: 'pending',
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'friend_requests', requestId), request);
    } else {
      // Mock: store for target user
      if (!this._mockFriendRequests[toUid]) this._mockFriendRequests[toUid] = [];
      const existing = this._mockFriendRequests[toUid].findIndex(r => r.fromUid === fromUid);
      if (existing === -1) {
        this._mockFriendRequests[toUid].push(request);
      }
    }
  }

  public async acceptFriendRequest(currentUid: string, fromUid: string): Promise<void> {
    const requestId = `${fromUid}_${currentUid}`;

    if (isFirebaseConfigured && db) {
      // Update request status
      await updateDoc(doc(db, 'friend_requests', requestId), { status: 'accepted' });

      // Add each other as friends in user docs
      const now = Date.now();
      const currentRef = doc(db, 'users', currentUid);
      const fromRef = doc(db, 'users', fromUid);

      const [currentSnap, fromSnap] = await Promise.all([getDoc(currentRef), getDoc(fromRef)]);
      const currentData = currentSnap.data() as UserProfile | undefined;
      const fromData = fromSnap.data() as UserProfile | undefined;

      const currentFriends: FriendEntry[] = currentData?.friends ?? [];
      const fromFriends: FriendEntry[] = fromData?.friends ?? [];

      if (!currentFriends.find(f => f.uid === fromUid)) {
        currentFriends.push({ uid: fromUid, displayName: fromData?.displayName ?? fromUid, addedAt: now });
      }
      if (!fromFriends.find(f => f.uid === currentUid)) {
        fromFriends.push({ uid: currentUid, displayName: currentData?.displayName ?? currentUid, addedAt: now });
      }

      await Promise.all([
        updateDoc(currentRef, { friends: currentFriends }),
        updateDoc(fromRef, { friends: fromFriends }),
      ]);
    } else {
      // Mock
      const now = Date.now();
      if (!this._mockFriends[currentUid]) this._mockFriends[currentUid] = [];
      if (!this._mockFriends[fromUid]) this._mockFriends[fromUid] = [];
      this._mockFriends[currentUid].push({ uid: fromUid, displayName: fromUid, addedAt: now });
      this._mockFriends[fromUid].push({ uid: currentUid, displayName: currentUid, addedAt: now });

      if (this._mockFriendRequests[currentUid]) {
        this._mockFriendRequests[currentUid] = this._mockFriendRequests[currentUid].filter(r => r.fromUid !== fromUid);
      }
    }
  }

  public async rejectFriendRequest(currentUid: string, fromUid: string): Promise<void> {
    const requestId = `${fromUid}_${currentUid}`;

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'friend_requests', requestId), { status: 'rejected' });
    } else {
      if (this._mockFriendRequests[currentUid]) {
        this._mockFriendRequests[currentUid] = this._mockFriendRequests[currentUid].filter(r => r.fromUid !== fromUid);
      }
    }
  }

  public async removeFriend(currentUid: string, friendUid: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      const currentRef = doc(db, 'users', currentUid);
      const friendRef = doc(db, 'users', friendUid);

      const [currentSnap, friendSnap] = await Promise.all([getDoc(currentRef), getDoc(friendRef)]);
      const currentData = currentSnap.data() as UserProfile | undefined;
      const friendData = friendSnap.data() as UserProfile | undefined;

      const currentFriends = (currentData?.friends ?? []).filter(f => f.uid !== friendUid);
      const friendFriends = (friendData?.friends ?? []).filter(f => f.uid !== currentUid);

      await Promise.all([
        updateDoc(currentRef, { friends: currentFriends }),
        updateDoc(friendRef, { friends: friendFriends }),
      ]);
    } else {
      if (this._mockFriends[currentUid]) {
        this._mockFriends[currentUid] = this._mockFriends[currentUid].filter(f => f.uid !== friendUid);
      }
      if (this._mockFriends[friendUid]) {
        this._mockFriends[friendUid] = this._mockFriends[friendUid].filter(f => f.uid !== currentUid);
      }
    }
  }

  public subscribeToFriends(uid: string, callback: (friends: FriendEntry[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      return onSnapshot(doc(db, 'users', uid), (snap) => {
        const data = snap.data() as UserProfile | undefined;
        callback(data?.friends ?? []);
      });
    } else {
      callback(this._mockFriends[uid] ?? []);
      return () => {};
    }
  }

  public subscribeToFriendRequests(uid: string, callback: (requests: FriendRequest[]) => void): () => void {
    if (isFirebaseConfigured && db) {
      const q = collection(db, 'friend_requests');
      return onSnapshot(q, (snap) => {
        const requests = snap.docs
          .map(d => d.data() as FriendRequest)
          .filter(r => r.toUid === uid && r.status === 'pending');
        callback(requests);
      });
    } else {
      callback(this._mockFriendRequests[uid] ?? []);
      return () => {};
    }
  }

  // --- ADMIN METHODS ---

  public async adminGetAllUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured && db) {
      const { getDocs, query, orderBy, limit } = await import('firebase/firestore');
      const q = query(collection(db, 'users'), orderBy('displayName'), limit(200));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as UserProfile);
    }
    // mock: return current user
    return this.activeUser ? [this.activeUser] : [];
  }

  public async adminUpdateUserCoins(uid: string, coins: number): Promise<void> {
    await this.updateUserProfile(uid, { coins });
  }

  public async adminDeleteUser(uid: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'users', uid));
    }
  }

  public async adminGetAllArcadeRooms(): Promise<ArcadeRoom[]> {
    if (isFirebaseConfigured && db) {
      const { getDocs, query, orderBy, limit } = await import('firebase/firestore');
      const q = query(collection(db, 'arcade_rooms'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as ArcadeRoom);
    }
    return Object.values(getStoredRooms());
  }

  public async adminDeleteArcadeRoom(roomId: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'arcade_rooms', roomId));
    } else {
      deleteStoredRoom(roomId);
    }
  }
}

export const dbService = new DatabaseService();