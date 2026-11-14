export const ISLAND_WIDTH = 64; // 64 * 32px = 2048px (Exact 2x match of 1024x682 bg)
export const ISLAND_HEIGHT = 42.625; // 42.625 * 32px = 1364px
export const TILE_SIZE = 32; // 32px coordinate unit

export const WORLD_WIDTH = 2048;
export const WORLD_HEIGHT = 1364;

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
    x: 14,
    y: 3,
    width: 12.5,
    height: 11.5,
    doorX: 20,
    doorY: 15.5,
    prompt: '進入「CASINO」777 復古拉霸娛樂城 🎰 (按 Space / 點我)',
  },
  {
    id: 'arcade_qianwu',
    name: 'ARCADE 街機遊樂中心 (1A2B/海戰棋/點線棋)',
    type: 'arcade',
    x: 31,
    y: 6,
    width: 12.5,
    height: 8.5,
    doorX: 37,
    doorY: 15.2,
    prompt: '進入「ARCADE」街機遊樂中心 🕹️ (按 Space / 點我)',
  },
  {
    id: 'boutique_pavilion',
    name: 'FASHION 島嶼精品服飾店',
    type: 'boutique',
    x: 4.5,
    y: 20.5,
    width: 9.5,
    height: 7,
    doorX: 9.2,
    doorY: 28,
    prompt: '進入「FASHION」精品服飾店 👗 (按 Space / 點我)',
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

// 6 Residential plots calibrated to the grassy lawns of the background art
export const RESIDENTIAL_PLOTS: ResidentialPlot[] = [
  { plotId: 'plot_0', x: 7.5, y: 6, width: 4.5, height: 4.5, doorX: 9.8, doorY: 10.8 }, // North-West hillside plateau (Local player default)
  { plotId: 'plot_1', x: 46, y: 16.5, width: 4.5, height: 4.5, doorX: 48.2, doorY: 21.2 }, // East coastal lawn (Terry's Manor)
  { plotId: 'plot_2', x: 34, y: 32.5, width: 4, height: 4, doorX: 36, doorY: 36.8 }, // South park lawn right
  { plotId: 'plot_3', x: 40, y: 32.5, width: 4, height: 4, doorX: 42, doorY: 36.8 }, // South park lawn far right
  { plotId: 'plot_4', x: 18, y: 32.5, width: 4, height: 4, doorX: 20, doorY: 36.8 }, // South park lawn left
  { plotId: 'plot_5', x: 4.5, y: 32.5, width: 4, height: 4, doorX: 6.5, doorY: 36.8 }, // South lawn near pond
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

// Highly accurate, frictionless continuous walkability for the pixel-art world map
export function isIslandWalkable(x: number, y: number, activeHouses: ActiveHouse[] = []): boolean {
  // 1. World outer boundary limits
  if (x < 1.5 || x > 62.5 || y < 1.5 || y > 41.5) {
    return false;
  }

  // 2. Northern cliff wall (except the open tunnel road at x: 6..9.5)
  if (y < 4 && !(x >= 5.5 && x <= 9.5)) {
    return false;
  }

  // 3. Left mountain boundary
  if (x < 2 && y > 15) {
    return false;
  }

  // 4. Building Footprints & Doorways
  for (const b of BUILDINGS) {
    // Doorway entrance is always accessible!
    if (Math.abs(x - b.doorX) <= 1.0 && Math.abs(y - b.doorY) <= 1.0) {
      return true;
    }
    // Solid building body
    if (x >= b.x - 0.2 && x <= b.x + b.width + 0.2 && y >= b.y - 0.2 && y <= b.y + b.height) {
      return false;
    }
  }

  // 5. Active Player Houses Footprints & Doorways
  for (const h of activeHouses) {
    if (Math.abs(x - h.doorX) <= 1.0 && Math.abs(y - h.doorY) <= 1.0) {
      return true;
    }
    if (x >= h.x - 0.2 && x <= h.x + h.width + 0.2 && y >= h.y - 0.2 && y <= h.y + h.height) {
      return false;
    }
  }

  // 6. Central Roundabout Water Fountain (radius 2.2 tiles around center x: 30, y: 22)
  if (Math.hypot(x - 30, y - 22) < 2.4) {
    return false;
  }

  // 7. Bottom-Left Duck Pond (Except the wooden crossing bridge at x: 8..11)
  if (x >= 2 && x <= 13.5 && y >= 34.5 && y <= 39) {
    const isOnBridge = x >= 8.2 && x <= 11.2 && y >= 34 && y <= 39.5;
    if (!isOnBridge) {
      return false;
    }
  }

  // 8. Ocean & Coastal Water on the right side
  // Wooden Piers are fully walkable!
  const isNorthPier = x >= 47 && x <= 58 && y >= 8 && y <= 11.5;
  const isMidPier = x >= 54 && x <= 61.5 && y >= 19 && y <= 22.5;
  const isSouthPier = x >= 53 && x <= 61.5 && y >= 35 && y <= 38.5;

  if (isNorthPier || isMidPier || isSouthPier) {
    return true;
  }

  // Deep ocean water
  if (x > 56 && y < 35) {
    return false;
  }
  if (x > 43 && y > 38.5) {
    return false;
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
