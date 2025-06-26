// src/data/roomTemplates.ts

import { RoomType, type RoomTemplate } from '../types/WorldTypes'
import { TILE_KEYS } from '../utils/constants'

// Tile indices from world.png (assuming 64x64 frames)
// 0: Grass, 1: Dirt Path, 2: Dirt, 3: Wall (new)
const TILE_GRASS = 0
const TILE_DIRT_PATH = 1
const TILE_DIRT = 2
const TILE_WALL = 3 // Assuming you'll add a wall tile at index 3 in world.png

/**
 * Defines the tile layouts and properties for various room types.
 * Each room is assumed to be CHUNK_SIZE_TILES x CHUNK_SIZE_TILES (e.g., 10x10).
 */
export const ROOM_TEMPLATES: Record<RoomType, RoomTemplate> = {
  [RoomType.START]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)), // All grass
    obstacles: [],
    entities: [],
  },
  [RoomType.END]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.EMPTY]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.COMBAT]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_DIRT)), // Dirt floor for combat
    obstacles: [
      { x: 2, y: 2, tileIndex: TILE_WALL },
      { x: 7, y: 2, tileIndex: TILE_WALL },
      { x: 2, y: 7, tileIndex: TILE_WALL },
      { x: 7, y: 7, tileIndex: TILE_WALL },
    ],
    entities: [], // Entities will be added dynamically by Level1Scene
  },
  [RoomType.TREASURE]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [
      { x: 4, y: 4, tileIndex: TILE_WALL },
      { x: 5, y: 4, tileIndex: TILE_WALL },
      { x: 4, y: 5, tileIndex: TILE_WALL },
      { x: 5, y: 5, tileIndex: TILE_WALL },
    ],
    entities: [], // Placeholder for treasure entities
  },
  [RoomType.SHOP]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_DIRT)),
    obstacles: [
      { x: 1, y: 4, tileIndex: TILE_WALL },
      { x: 1, y: 5, tileIndex: TILE_WALL },
      { x: 8, y: 4, tileIndex: TILE_WALL },
      { x: 8, y: 5, tileIndex: TILE_WALL },
    ],
    entities: [], // Placeholder for shopkeeper entity
  },
  [RoomType.CORRIDOR_H]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.CORRIDOR_V]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.CORNER_TL]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.CORNER_TR]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.CORNER_BL]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
  [RoomType.CORNER_BR]: {
    tiles: Array(10)
      .fill(0)
      .map(() => Array(10).fill(TILE_GRASS)),
    obstacles: [],
    entities: [],
  },
}

// Enhance corridor templates to actually look like corridors
// Example: Horizontal corridor with dirt path in the middle
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 10; x++) {
    if (y >= 4 && y <= 5) {
      ROOM_TEMPLATES[RoomType.CORRIDOR_H].tiles[y][x] = TILE_DIRT_PATH
    }
  }
}

// Example: Vertical corridor with dirt path in the middle
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 10; x++) {
    if (x >= 4 && x <= 5) {
      ROOM_TEMPLATES[RoomType.CORRIDOR_V].tiles[y][x] = TILE_DIRT_PATH
    }
  }
}

// Example: Corner Top-Left (path from right to bottom)
ROOM_TEMPLATES[RoomType.CORNER_TL].tiles = Array(10)
  .fill(0)
  .map(() => Array(10).fill(TILE_GRASS))
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 10; x++) {
    if ((y >= 4 && y <= 5 && x >= 4) || (x >= 4 && x <= 5 && y >= 4)) {
      ROOM_TEMPLATES[RoomType.CORNER_TL].tiles[y][x] = TILE_DIRT_PATH
    }
  }
}

// Add more complex templates as needed.
// For now, the other corners will be simple grass.
