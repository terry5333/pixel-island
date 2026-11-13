export const ISLAND_WIDTH = 36;
export const ISLAND_HEIGHT = 36;
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
    x: 12,
    y: 4,
    width: 12,
    height: 8,
    doorX: 18,
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
  {
    id: 'cozy_home',
    name: '溫馨個人小屋 (MY HOME)',
    type: 'home',
    x: 26,
    y: 6,
    width: 5,
    height: 5,
    doorX: 28,
    doorY: 11,
    prompt: '進入個人小屋 (按 Space / A 鍵)',
  },
];

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

export const TOWN_SCENERY: SceneryItem[] = [
  // Utility Poles with wires
  { id: 'pole_1', type: 'utility_pole', x: 10, y: 7, widthTiles: 2, heightTiles: 4, walkable: false },
  { id: 'pole_2', type: 'utility_pole', x: 24, y: 7, widthTiles: 2, heightTiles: 4, walkable: false },

  // Vending Machine
  { id: 'vending_1', type: 'vending', x: 11, y: 10, widthTiles: 1, heightTiles: 2, walkable: false },

  // Parked White Retro Mini Car
  { id: 'car_1', type: 'car', x: 9, y: 15, widthTiles: 2, heightTiles: 2, walkable: false },

  // Retro Billboard & Bench in front
  { id: 'billboard_1', type: 'billboard', x: 21, y: 14, widthTiles: 4, heightTiles: 3, walkable: false },

  // Road Markings ("慢" - Slow)
  { id: 'road_slow_1', type: 'road_slow', x: 15, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },
  { id: 'road_slow_2', type: 'road_slow', x: 20, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },

  // Sewer Manhole Covers
  { id: 'manhole_1', type: 'manhole', x: 12, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },
  { id: 'manhole_2', type: 'manhole', x: 24, y: 13, widthTiles: 1, heightTiles: 1, walkable: true },

  // Foreground Streetlamps & Flower Hedges along the curb at y: 16
  { id: 'lamp_1', type: 'street_lamp', x: 8, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_1', type: 'hedge', x: 11, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_2', type: 'hedge', x: 12, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_2', type: 'street_lamp', x: 15, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_3', type: 'hedge', x: 16, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'hedge_4', type: 'hedge', x: 19, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },
  { id: 'lamp_3', type: 'street_lamp', x: 25, y: 16, widthTiles: 1, heightTiles: 1, walkable: false },

  // Central Fountain Plaza at y: 20..24
  { id: 'fountain_center', type: 'fountain', x: 17, y: 21, widthTiles: 2, heightTiles: 2, walkable: false },

  // Trees & Palms
  { id: 'pine_1', type: 'tree_pine', x: 4, y: 13, widthTiles: 2, heightTiles: 2, walkable: false },
  { id: 'pine_2', type: 'tree_pine', x: 30, y: 13, widthTiles: 2, heightTiles: 2, walkable: false },
  { id: 'palm_1', type: 'tree_palm', x: 3, y: 29, widthTiles: 2, heightTiles: 3, walkable: false },
  { id: 'palm_2', type: 'tree_palm', x: 31, y: 29, widthTiles: 2, heightTiles: 3, walkable: false },
];

// Determine tile type for perfect 36x36 Square Island
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
  if (y === 28 || y === 29) {
    return 'boardwalk';
  }

  // South Beach area
  if (y >= 30 && y <= ISLAND_HEIGHT - 3) {
    return 'sand';
  }

  // Main Boulevard Asphalt Street
  if (y >= 12 && y <= 15) {
    return 'asphalt';
  }

  // Sidewalks
  if (y === 11 || y === 16) {
    return 'sidewalk';
  }

  // Central Fountain Plaza
  if (x >= 14 && x <= 22 && y >= 19 && y <= 24) {
    return 'plaza';
  }

  // Default is lush town lawn
  return 'grass';
}

// Check walkability on the square island
export function isIslandWalkable(x: number, y: number): boolean {
  if (x < 0 || x >= ISLAND_WIDTH || y < 0 || y >= ISLAND_HEIGHT) {
    return false;
  }

  // Ocean is non-walkable
  if (getIslandTile(x, y) === 'water') {
    return false;
  }

  // Building footprints (doors are accessible)
  for (const b of BUILDINGS) {
    if (x === b.doorX && y === b.doorY) {
      return true;
    }
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
      return false;
    }
  }

  // Non-walkable Scenery Items
  for (const s of TOWN_SCENERY) {
    if (s.walkable === false) {
      if (x >= s.x && x < s.x + s.widthTiles && y >= s.y && y < s.y + s.heightTiles) {
        return false;
      }
    }
  }

  return true;
}

// Check if player is standing on or directly adjacent to entrance
export function checkBuildingEntrance(x: number, y: number): InteractiveBuilding | null {
  for (const b of BUILDINGS) {
    if (x === b.doorX && y === b.doorY) {
      return b;
    }
    // Also trigger if 1 step directly in front
    if (x === b.doorX && (y === b.doorY - 1 || y === b.doorY + 1)) {
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
  if (y === HOME_HEIGHT - 1 && (x === 5 || x === 6)) {
    return true;
  }
  if (x <= 0 || x >= HOME_WIDTH - 1 || y <= 0 || y >= HOME_HEIGHT - 1) {
    return false;
  }
  return true;
}
