export const ISLAND_WIDTH = 64; // 64 * 32px = 2048px (Exact 2x match of 1024x571 Showa map)
export const ISLAND_HEIGHT = 35.6875; // 35.6875 * 32px = 1142px
export const TILE_SIZE = 32; // 32px coordinate unit

export const WORLD_WIDTH = 2048;
export const WORLD_HEIGHT = 1142;

export const HOME_WIDTH = 12;
export const HOME_HEIGHT = 12;

export type TileType = 
  | 'water' 
  | 'sand' 
  | 'grass' 
  | 'asphalt' 
  | 'sidewalk' 
  | 'plaza' 
  | 'boardwalk' 
  | 'wood_floor' 
  | 'wall';

export interface InteractiveBuilding {
  id: string;
  name: string;
  type: 'boutique' | 'arcade' | 'casino' | 'home';
  x: number;
  y: number;
  width: number;
  height: number;
  doorX: number;
  doorY: number;
  prompt: string;
}

export const BUILDINGS: InteractiveBuilding[] = [
  {
    id: 'casino_palace',
    name: 'CASINO 777 復古拉霸娛樂城',
    type: 'casino',
    x: 44.5,
    y: 4.0,
    width: 11.5,
    height: 10.0,
    doorX: 51.0,
    doorY: 14.5,
    prompt: '進入「CASINO」777 復古拉霸娛樂城 🎰 (按 Space / 點我)',
  },
  {
    id: 'arcade_qianwu',
    name: 'ARCADE 街機遊樂中心 (遊台/1A2B/海戰棋)',
    type: 'arcade',
    x: 28.5,
    y: 7.5,
    width: 6.0,
    height: 3.5,
    doorX: 30.6,
    doorY: 11.0,
    prompt: '進入「遊台」街機遊樂中心 🕹️ (按 Space / 點我)',
  },
  {
    id: 'boutique_pavilion',
    name: 'FASHION 昭和和服精品店',
    type: 'boutique',
    x: 13.5,
    y: 3.5,
    width: 11.5,
    height: 8.0,
    doorX: 19.1,
    doorY: 11.6,
    prompt: '進入「服」昭和和服精品店 👗 (按 Space / 點我)',
  },
];

export interface ResidentialPlot {
  plotId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doorX: number;
  doorY: number;
}

// 3 Residential plots calibrated to the Japanese houses in the background art
export const RESIDENTIAL_PLOTS: ResidentialPlot[] = [
  { plotId: 'plot_0', x: 26.0, y: 18.5, width: 7.5, height: 7.5, doorX: 29.7, doorY: 26.0 }, // House 1 (Left Japanese house)
  { plotId: 'plot_1', x: 35.0, y: 18.0, width: 9.5, height: 8.0, doorX: 39.7, doorY: 25.6 }, // House 2 (Middle Japanese house)
  { plotId: 'plot_2', x: 45.5, y: 18.0, width: 7.0, height: 8.0, doorX: 48.75, doorY: 26.0 }, // House 3 (Right Japanese house)
];

export const DEFAULT_ISLAND_RESIDENTS = [
  { uid: 'res_terry', name: 'Terry', level: 4 },
  { uid: 'res_ash', name: '小智', level: 3 },
  { uid: 'res_misty', name: '小霞', level: 2 },
  { uid: 'res_oak', name: '大木博士', level: 3 },
  { uid: 'res_pika', name: '皮卡丘', level: 1 },
  { uid: 'res_brock', name: '小剛', level: 2 },
];

export interface ActiveHouse {
  plotId: string;
  ownerUid: string;
  ownerName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  doorX: number;
  doorY: number;
  level: number;
  isSelf: boolean;
  isClaimed: boolean;
  prompt: string;
}

// Compute active houses for all players online + persistent island residents
export function getActiveHouses(
  currentUid: string,
  currentDisplayName: string,
  currentUserLevel: number = 1,
  presences: Record<string, any> = {}
): ActiveHouse[] {
  const houses: ActiveHouse[] = [];

  // 1. Local player always owns Plot 0
  houses.push({
    ...RESIDENTIAL_PLOTS[0],
    ownerUid: currentUid,
    ownerName: currentDisplayName || '冒險家',
    level: currentUserLevel || 1,
    isSelf: true,
    isClaimed: true,
    prompt: '進入自宅玄關 🏡 (按 Space / 點我)',
  });

  // 2. All other plots are ONLY claimed if there is an actual online player!
  const otherOnlineUids = Object.keys(presences).filter((uid) => uid !== currentUid);

  for (let i = 1; i < RESIDENTIAL_PLOTS.length; i++) {
    const plot = RESIDENTIAL_PLOTS[i];
    const onlineUid = otherOnlineUids[i - 1];

    if (onlineUid) {
      const presence = presences[onlineUid];
      const ownerName = presence?.displayName || `玩家 #${onlineUid.slice(-4)}`;
      houses.push({
        ...plot,
        ownerUid: onlineUid,
        ownerName,
        level: presence?.houseLevel || 1,
        isSelf: false,
        isClaimed: true,
        prompt: `拜訪 ${ownerName} 之宅 🏡 (按 Space / 點我)`,
      });
    } else {
      // Unclaimed empty house: do not write any owner name on top!
      houses.push({
        ...plot,
        ownerUid: '',
        ownerName: '',
        level: 0,
        isSelf: false,
        isClaimed: false,
        prompt: '暫無人認領的日式居所 🏡',
      });
    }
  }

  return houses;
}

// Smooth continuous walkability & accurate obstacles collision for the Japanese Showa island map
export function isIslandWalkable(x: number, y: number, activeHouses: ActiveHouse[] = []): boolean {
  // 1. World outer boundary limits (Map is 64 x 35.6875 tiles)
  if (x < 3.0 || x > 60.5 || y < 2.5 || y > 33.5) {
    return false;
  }

  // 2. Wooden Pier at Bottom-Left (always walkable)
  const isWoodenPier = x >= 3.5 && x <= 14.5 && y >= 23.0 && y <= 27.5;
  if (isWoodenPier) {
    return true;
  }

  // 3. Deep sea surrounding island
  if (x < 6.0 && y > 27.0) return false;
  if (x < 4.0) return false;
  if (x > 59.0 && y > 26.0) return false;

  // 4. River & Waterfall channel: blocks player unless crossing on the wooden bridge
  const isBridge = x >= 22.0 && x <= 25.5 && y >= 15.5 && y <= 18.0;
  if (!isBridge && x >= 20.8 && x <= 24.5 && y >= 17.0 && y <= 27.0) {
    return false;
  }

  // 5. Fenced amusement festival park (Ferris wheel & carousel)
  if (x >= 34.5 && x <= 44.0 && y >= 2.0 && y <= 11.8) {
    const isFestivalEntrance = Math.hypot(x - 34.8, y - 11.5) < 1.3;
    if (!isFestivalEntrance) return false;
  }

  // 6. Cherry Blossom Trees & Rocks (Natural Obstacles)
  if (Math.hypot(x - 26.5, y - 24.2) < 1.5) return false; // Large Sakura tree
  if (x >= 8.0 && x <= 13.5 && y >= 2.5 && y <= 9.0) return false; // Mountain forest grove

  // 7. Building Footprints & Doorways
  for (const b of BUILDINGS) {
    // Doorway entrance is always accessible!
    if (Math.hypot(x - b.doorX, y - b.doorY) <= 1.5) {
      return true;
    }
    // Solid building body
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      return false;
    }
  }

  // 8. Active Player Houses Footprints & Doorways
  for (const h of activeHouses) {
    if (Math.hypot(x - h.doorX, y - h.doorY) <= 1.5) {
      return true;
    }
    if (x >= h.x && x <= h.x + h.width && y >= h.y && y <= h.y + h.height) {
      return false;
    }
  }

  return true;
}

// Detect if player is standing behind an obstacle/canopy (for depth silhouette)
export function isPlayerBehindObstacle(x: number, y: number): boolean {
  if (y >= 8.0 && y <= 12.2 && x >= 13.5 && x <= 25.0) return true; // Kimono shop eaves
  if (y >= 10.0 && y <= 15.0 && x >= 44.5 && x <= 55.5) return true; // Casino neon roof eaves
  if (y >= 21.0 && y <= 25.5 && x >= 24.5 && x <= 28.5) return true; // Sakura tree canopy
  if (y >= 21.5 && y <= 23.5 && x >= 31.5 && x <= 34.5) return true; // Torii gate beam
  return false;
}

export type BuildingOrHouseEntrance = 
  | { type: 'commercial'; building: InteractiveBuilding }
  | { type: 'house'; house: ActiveHouse };

// Check if player is near building or house entrance
export function checkBuildingOrHouseEntrance(
  x: number,
  y: number,
  activeHouses: ActiveHouse[] = []
): BuildingOrHouseEntrance | null {
  for (const b of BUILDINGS) {
    if (Math.hypot(x - b.doorX, y - b.doorY) <= 1.8) {
      return { type: 'commercial', building: b };
    }
  }

  for (const h of activeHouses) {
    if (Math.hypot(x - h.doorX, y - h.doorY) <= 1.8) {
      return { type: 'house', house: h };
    }
  }

  return null;
}

export function checkBuildingEntrance(x: number, y: number): InteractiveBuilding | null {
  for (const b of BUILDINGS) {
    if (Math.hypot(x - b.doorX, y - b.doorY) <= 1.8) {
      return b;
    }
  }
  return null;
}

// Home interior
export function getHomeTile(x: number, y: number): TileType {
  if (x === 0 || x === HOME_WIDTH - 1 || y === 0 || y === HOME_HEIGHT - 1) {
    return 'wall';
  }
  return 'wood_floor';
}

export function isHomeWalkable(x: number, y: number): boolean {
  if (y >= HOME_HEIGHT - 1.2 && (x >= 4.5 && x <= 6.5)) {
    return true;
  }
  if (x <= 0.6 || x >= HOME_WIDTH - 1.6 || y <= 0.6 || y >= HOME_HEIGHT - 1.6) {
    return false;
  }
  return true;
}
