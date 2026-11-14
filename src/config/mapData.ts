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

  // 6. Cherry Blossom & Pine Trees (Trunks Colliders)
  // Sakura Trees trunks
  if (Math.hypot(x - 26.8, y - 25.0) < 1.3) return false; // Sakura Tree 1 (cliffside near bridge)
  if (Math.hypot(x - 23.5, y - 4.2) < 1.2) return false;  // Sakura Tree 2 (top shore)
  if (Math.hypot(x - 13.8, y - 3.8) < 1.2) return false;  // Sakura Tree 3 (top-left shore)
  if (Math.hypot(x - 9.0, y - 11.5) < 1.2) return false;  // Sakura Tree 4 (left beach sand)
  if (Math.hypot(x - 8.8, y - 17.0) < 1.2) return false;  // Sakura Tree 5 (bottom-left sand edge)
  if (Math.hypot(x - 54.2, y - 18.5) < 1.3) return false; // Sakura Tree 6 (right of house 3)

  // Pine tree groves & dense pine clusters
  if (x >= 10.0 && x <= 13.0 && y >= 19.5 && y <= 23.5) return false; // Left coast pines
  if (x >= 17.5 && x <= 20.5 && y >= 15.5 && y <= 18.5) return false; // Pines near river
  if (x >= 55.5 && x <= 58.5 && y >= 7.5 && y <= 12.5) return false;  // Pines right of casino
  if (x >= 43.5 && x <= 47.5 && y >= 1.5 && y <= 3.5) return false;   // Pines top cliff

  // 7. Rocks & Reefs (海灘與礁石實體障礙)
  if (x >= 11.0 && x <= 15.5 && y >= 27.5 && y <= 32.0) return false; // Sea rocks bottom-left
  if (x >= 18.0 && x <= 22.5 && y >= 29.0 && y <= 33.5) return false; // Waterfall cliff rocks
  if (x >= 52.5 && x <= 58.5 && y >= 24.0 && y <= 30.0) return false; // Bottom-right coast rocks
  if (x >= 3.5 && x <= 7.0 && y >= 9.5 && y <= 13.0) return false;    // Top-left sea rocks
  if (Math.hypot(x - 14.8, y - 19.8) < 0.9) return false;              // Shoreline rock near pier
  if (Math.hypot(x - 22.8, y - 26.5) < 0.9) return false;              // Shoreline rock near waterfall
  if (Math.hypot(x - 53.5, y - 22.5) < 0.9) return false;              // Shoreline rock bottom right

  // 8. Visible Island Fixtures & Obstacles
  // Torii gate posts (passable through center x: 33.6 - 36.4)
  if (Math.hypot(x - 32.8, y - 24.8) < 0.6) return false;
  if (Math.hypot(x - 37.2, y - 24.8) < 0.6) return false;
  if (x >= 55.0 && x <= 57.5 && y >= 14.5 && y <= 16.0) return false; // East Torii

  // Vending machines & benches
  if (x >= 26.5 && x <= 27.8 && y >= 12.8 && y <= 14.2) return false; // Crossroads vending machine
  if (x >= 38.2 && x <= 39.5 && y >= 25.0 && y <= 26.2) return false; // Residential vending machine
  if (x >= 23.5 && x <= 25.5 && y >= 13.0 && y <= 14.2) return false; // River bench
  if (x >= 14.5 && x <= 16.5 && y >= 17.0 && y <= 18.2) return false; // Beach path bench

  // Stone lanterns (石燈籠)
  if (Math.hypot(x - 12.5, y - 19.5) < 0.7) return false;
  if (Math.hypot(x - 19.5, y - 25.0) < 0.7) return false;
  if (Math.hypot(x - 33.5, y - 18.0) < 0.7) return false;

  // 9. Building Footprints & Doorways
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

  // 10. Active Player Houses Footprints & Doorways
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
  // Commercial roofs & eaves
  if (y >= 7.5 && y <= 12.2 && x >= 13.5 && x <= 25.0) return true; // Kimono shop eaves
  if (y >= 9.5 && y <= 15.0 && x >= 44.5 && x <= 56.0) return true; // Casino neon roof eaves

  // Residential roofs
  if (y >= 17.5 && y <= 22.0 && x >= 26.0 && x <= 33.5) return true; // House 1 roof
  if (y >= 17.0 && y <= 22.0 && x >= 35.0 && x <= 44.5) return true; // House 2 roof
  if (y >= 17.0 && y <= 22.0 && x >= 45.5 && x <= 52.5) return true; // House 3 roof

  // Sakura tree canopies (standing under/behind upper blossom branches)
  if (y >= 22.0 && y <= 25.2 && x >= 24.8 && x <= 28.8) return true; // Sakura 1
  if (y >= 15.5 && y <= 19.0 && x >= 52.0 && x <= 56.5) return true; // Sakura 6
  if (y >= 14.5 && y <= 17.5 && x >= 7.0 && x <= 11.0) return true;  // Sakura 5
  if (y >= 9.0 && y <= 12.0 && x >= 7.0 && x <= 11.0) return true;   // Sakura 4
  if (y >= 2.0 && y <= 5.0 && x >= 12.0 && x <= 16.0) return true;   // Sakura 3
  if (y >= 2.0 && y <= 5.0 && x >= 21.5 && x <= 25.5) return true;   // Sakura 2

  // Pine tree canopies
  if (y >= 18.0 && y <= 22.0 && x >= 9.5 && x <= 13.5) return true;
  if (y >= 14.0 && y <= 17.0 && x >= 17.0 && x <= 21.0) return true;
  if (y >= 6.5 && y <= 12.0 && x >= 55.0 && x <= 59.0) return true;

  // Torii gate top beams
  if (y >= 23.0 && y <= 25.0 && x >= 32.5 && x <= 37.5) return true;
  if (y >= 13.5 && y <= 15.5 && x >= 54.5 && x <= 58.0) return true;

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
