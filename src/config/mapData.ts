export const ISLAND_WIDTH = 38;
export const ISLAND_HEIGHT = 38;
export const TILE_SIZE = 48; // 48px per grid cell

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
  type: 'boutique' | 'arcade' | 'home';
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
    id: 'arcade_qianwu',
    name: '銭屋 (Qian-Wu) 8-Bit 街機遊樂場',
    type: 'arcade',
    x: 13,
    y: 4,
    width: 12,
    height: 8,
    doorX: 19,
    doorY: 12,
    prompt: '進入「銭屋」街機遊樂場 (按 Space / A 鍵)',
  },
  {
    id: 'boutique_pavilion',
    name: '島嶼精品服飾店 (BOUTIQUE)',
    type: 'boutique',
    x: 5,
    y: 6,
    width: 5,
    height: 5,
    doorX: 7,
    doorY: 11,
    prompt: '進入精品服飾店 (按 Space / A 鍵)',
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

export const RESIDENTIAL_PLOTS: ResidentialPlot[] = [
  { plotId: 'plot_0', x: 27, y: 6, width: 5, height: 5, doorX: 29, doorY: 11 }, // North-East prime estate (Local player default)
  { plotId: 'plot_1', x: 5, y: 25, width: 4, height: 4, doorX: 7, doorY: 29 }, // South-West residential
  { plotId: 'plot_2', x: 12, y: 25, width: 4, height: 4, doorX: 14, doorY: 29 }, // South mid-west
  { plotId: 'plot_3', x: 21, y: 25, width: 4, height: 4, doorX: 23, doorY: 29 }, // South mid-east
  { plotId: 'plot_4', x: 28, y: 25, width: 4, height: 4, doorX: 30, doorY: 29 }, // South-East residential
  { plotId: 'plot_5', x: 3, y: 17, width: 4, height: 4, doorX: 5, doorY: 21 }, // West park estate
  { plotId: 'plot_6', x: 30, y: 17, width: 4, height: 4, doorX: 32, doorY: 21 }, // East park estate
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
    prompt: '進入自己的溫馨小屋 🏡 (按 Space / A 鍵)',
  });

  // 2. All other plots 1..6 are ALWAYS populated (showing other online players or persistent residents)
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
        prompt: `拜訪 ${ownerName} 的家 🏡 (按 Space / A 鍵)`,
      });
    } else {
      // Fallback persistent community resident so the village is NEVER empty
      const defaultRes = DEFAULT_ISLAND_RESIDENTS[(i - 1) % DEFAULT_ISLAND_RESIDENTS.length];
      houses.push({
        ...plot,
        ownerUid: defaultRes.uid,
        ownerName: defaultRes.name,
        level: defaultRes.level,
        isSelf: false,
        prompt: `拜訪 ${defaultRes.name} 的家 🏡 (按 Space / A 鍵)`,
      });
    }
  }

  return houses;
}

export interface SceneryItem {
  id: string;
  type: 
    | 'utility_pole' 
    | 'billboard' 
    | 'car' 
    | 'vending' 
    | 'street_lamp' 
    | 'hedge' 
    | 'manhole' 
    | 'road_slow' 
    | 'tree_pine' 
    | 'tree_palm' 
    | 'fountain';
  x: number;
  y: number;
  widthTiles: number;
  heightTiles: number;
  walkable?: boolean;
}

// Scenery items positioned on borders and sidewalks, leaving central avenue COMPLETELY OPEN
export const TOWN_SCENERY: SceneryItem[] = [
  // Utility Poles with overhead cables (flanking the arcade facade)
  { id: 'pole_1', type: 'utility_pole', x: 11, y: 7, widthTiles: 2, heightTiles: 4, walkable: false },
  { id: 'pole_2', type: 'utility_pole', x: 25, y: 7, widthTiles: 2, heightTiles: 4, walkable: false },

  // Vending Machine
  { id: 'vending_1', type: 'vending', x: 10, y: 10, widthTiles: 1, heightTiles: 2, walkable: false },

  // Parked Cars along the curb (off-center)
  { id: 'car_1', type: 'car', x: 8, y: 15, widthTiles: 2, heightTiles: 2, walkable: false },
  { id: 'car_2', type: 'car', x: 24, y: 15, widthTiles: 2, heightTiles: 2, walkable: false },

  // Retro Billboard & Bench in front (on the right curb)
  { id: 'billboard_1', type: 'billboard', x: 23, y: 14, widthTiles: 4, heightTiles: 3, walkable: false },

  // Road Markings ("慢" - Slow) on the asphalt (fully walkable)
  { id: 'road_slow_1', type: 'road_slow', x: 15, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },
  { id: 'road_slow_2', type: 'road_slow', x: 21, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },
  { id: 'road_slow_3', type: 'road_slow', x: 18, y: 22, widthTiles: 1, heightTiles: 1, walkable: true },

  // Sewer Manhole Covers (fully walkable)
  { id: 'manhole_1', type: 'manhole', x: 13, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },
  { id: 'manhole_2', type: 'manhole', x: 23, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },
  { id: 'manhole_3', type: 'manhole', x: 18, y: 7, widthTiles: 1, heightTiles: 1, walkable: true },

  // Streetlamps along sidewalks (spaced out to NEVER block the central thoroughfare)
  { id: 'lamp_1', type: 'street_lamp', x: 7, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_2', type: 'street_lamp', x: 27, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_3', type: 'street_lamp', x: 5, y: 11, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_4', type: 'street_lamp', x: 31, y: 11, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_5', type: 'street_lamp', x: 4, y: 24, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_6', type: 'street_lamp', x: 32, y: 24, widthTiles: 1, heightTiles: 1, walkable: false },

  // Planter Hedges only on the outer sidewalk curbs
  { id: 'hedge_1', type: 'hedge', x: 9, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_2', type: 'hedge', x: 10, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_3', type: 'hedge', x: 25, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_4', type: 'hedge', x: 26, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },

  // Decorative Trees on the island edges (spacious)
  { id: 'pine_1', type: 'tree_pine', x: 4, y: 13, widthTiles: 2, heightTiles: 2, walkable: false },
  { id: 'pine_2', type: 'tree_pine', x: 32, y: 13, widthTiles: 2, heightTiles: 2, walkable: false },
  { id: 'palm_1', type: 'tree_palm', x: 3, y: 31, widthTiles: 2, heightTiles: 3, walkable: false },
  { id: 'palm_2', type: 'tree_palm', x: 33, y: 31, widthTiles: 2, heightTiles: 3, walkable: false },
];

// Determine tile type for spacious island
export function getIslandTile(x: number, y: number): TileType {
  // Border Ocean Water on all 4 sides
  if (x <= 1 || x >= ISLAND_WIDTH - 2 || y <= 1 || y >= ISLAND_HEIGHT - 2) {
    return 'water';
  }

  // Inner Sandy Beach Ring on all 4 sides
  if (x === 2 || x === ISLAND_WIDTH - 3 || y === 2 || y === ISLAND_HEIGHT - 3) {
    return 'sand';
  }

  // South Coastal Boardwalk Pier
  if (y === 30 || y === 31) {
    return 'boardwalk';
  }

  // South Beach area
  if (y >= 32 && y <= ISLAND_HEIGHT - 3) {
    return 'sand';
  }

  // South Park Road (y=22..23) — asphalt, full width
  if (y >= 22 && y <= 23 && x >= 3 && x <= ISLAND_WIDTH - 4) {
    return 'asphalt';
  }

  // South park road sidewalks
  if ((y === 21 || y === 24) && x >= 3 && x <= ISLAND_WIDTH - 4) {
    return 'sidewalk';
  }

  // Main Boulevard Asphalt Street (y=12..15)
  if (y >= 12 && y <= 15 && x >= 3 && x <= ISLAND_WIDTH - 4) {
    return 'asphalt';
  }

  // Sidewalks flanking the main boulevard
  if ((y === 11 || y === 16) && x >= 3 && x <= ISLAND_WIDTH - 4) {
    return 'sidewalk';
  }

  // Central North-South Grand Promenade (x=17..20, from arcade to beach)
  if (x >= 17 && x <= 20) {
    return 'plaza';
  }

  // Park District (x=7..31, y=17..21)
  if (x >= 7 && x <= 31 && y >= 17 && y <= 21) {
    return 'plaza';
  }

  // Default is lush town lawn
  return 'grass';
}

// Check walkability for smooth continuous movement
export function isIslandWalkable(x: number, y: number, activeHouses: ActiveHouse[] = []): boolean {
  if (x < 2 || x > ISLAND_WIDTH - 3 || y < 2 || y > ISLAND_HEIGHT - 3) {
    return false;
  }

  // Ocean is non-walkable
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  if (getIslandTile(tileX, tileY) === 'water') {
    return false;
  }

  // Commercial Building footprints (doors are accessible)
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.doorX) <= 0.6 && Math.abs(y - b.doorY) <= 0.6) {
      return true;
    }
    if (x >= b.x - 0.2 && x <= b.x + b.width + 0.2 && y >= b.y - 0.2 && y <= b.y + b.height) {
      return false;
    }
  }

  // Active Player Houses footprints (doors are accessible)
  for (const h of activeHouses) {
    if (Math.abs(x - h.doorX) <= 0.6 && Math.abs(y - h.doorY) <= 0.6) {
      return true;
    }
    if (x >= h.x - 0.2 && x <= h.x + h.width + 0.2 && y >= h.y - 0.2 && y <= h.y + h.height) {
      return false;
    }
  }

  // Non-walkable Scenery Items
  for (const s of TOWN_SCENERY) {
    if (s.walkable === false) {
      if (
        x >= s.x - 0.3 &&
        x <= s.x + s.widthTiles + 0.3 &&
        y >= s.y - 0.3 &&
        y <= s.y + s.heightTiles + 0.3
      ) {
        return false;
      }
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
    if (Math.abs(x - b.doorX) <= 1.2 && Math.abs(y - b.doorY) <= 1.2) {
      return { type: 'commercial', building: b };
    }
  }

  for (const h of activeHouses) {
    if (Math.abs(x - h.doorX) <= 1.2 && Math.abs(y - h.doorY) <= 1.2) {
      return { type: 'house', house: h };
    }
  }

  return null;
}

export function checkBuildingEntrance(x: number, y: number): InteractiveBuilding | null {
  for (const b of BUILDINGS) {
    if (Math.abs(x - b.doorX) <= 1.2 && Math.abs(y - b.doorY) <= 1.2) {
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
