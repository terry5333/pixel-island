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
    y: 6.5,
    width: 11.0,
    height: 11.0,
    doorX: 49.7,
    doorY: 18.0,
    prompt: '進入「CASINO」777 復古拉霸娛樂城 🎰 (按 Space / 點我)',
  },
  {
    id: 'arcade_qianwu',
    name: 'ARCADE 街機遊樂中心 (遊台/1A2B/海戰棋)',
    type: 'arcade',
    x: 28.5,
    y: 8.0,
    width: 9.0,
    height: 9.0,
    doorX: 31.0,
    doorY: 17.0,
    prompt: '進入「ARCADE」街機遊樂中心 🕹️ (按 Space / 點我)',
  },
  {
    id: 'boutique_pavilion',
    name: 'FASHION 昭和和服精品店',
    type: 'boutique',
    x: 14.0,
    y: 5.0,
    width: 12.0,
    height: 11.5,
    doorX: 19.7,
    doorY: 17.5,
    prompt: '進入「FASHION」和服精品店 👗 (按 Space / 點我)',
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
  { plotId: 'plot_0', x: 26.5, y: 20.0, width: 6.0, height: 6.0, doorX: 29.5, doorY: 26.5 }, // House 1 (Left Japanese house)
  { plotId: 'plot_1', x: 36.5, y: 20.5, width: 6.5, height: 6.0, doorX: 39.7, doorY: 27.0 }, // House 2 (Middle Japanese house)
  { plotId: 'plot_2', x: 45.5, y: 20.5, width: 6.0, height: 6.0, doorX: 48.75, doorY: 26.5 }, // House 3 (Right Japanese house)
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
    prompt: '進入自己的溫馨小屋 🏡 (按 Space / 點我)',
  });

  // 2. All other plots 1..5 are ALWAYS populated
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
        prompt: `拜訪 ${ownerName} 的家 🏡 (按 Space / 點我)`,
      });
    } else {
      const defaultRes = DEFAULT_ISLAND_RESIDENTS[(i - 1) % DEFAULT_ISLAND_RESIDENTS.length];
      houses.push({
        ...plot,
        ownerUid: defaultRes.uid,
        ownerName: defaultRes.name,
        level: defaultRes.level,
        isSelf: false,
        prompt: `拜訪 ${defaultRes.name} 的家 🏡 (按 Space / 點我)`,
      });
    }
  }

  return houses;
}

// Smooth continuous walkability calibrated for the Japanese Showa island map
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

  // 4. Building Footprints & Doorways
  for (const b of BUILDINGS) {
    // Doorway entrance is always accessible!
    if (Math.abs(x - b.doorX) <= 1.2 && Math.abs(y - b.doorY) <= 1.2) {
      return true;
    }
    // Solid building body
    if (x >= b.x - 0.2 && x <= b.x + b.width + 0.2 && y >= b.y - 0.2 && y <= b.y + b.height) {
      return false;
    }
  }

  // 5. Active Player Houses Footprints & Doorways
  for (const h of activeHouses) {
    if (Math.abs(x - h.doorX) <= 1.2 && Math.abs(y - h.doorY) <= 1.2) {
      return true;
    }
    if (x >= h.x - 0.2 && x <= h.x + h.width + 0.2 && y >= h.y - 0.2 && y <= h.y + h.height) {
      return false;
    }
  }

  return true;
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
    if (Math.abs(x - b.doorX) <= 1.4 && Math.abs(y - b.doorY) <= 1.4) {
      return { type: 'commercial', building: b };
    }
  }

  for (const h of activeHouses) {
    if (Math.abs(x - h.doorX) <= 1.4 && Math.abs(y - h.doorY) <= 1.4) {
      return { type: 'house', house: h };
    }
  }

  return null;
}

export function checkBuildingEntrance(x: number, y: number): InteractiveBuilding | null {
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.doorX) <= 1.4 && Math.abs(y - b.doorY) <= 1.4) {
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
