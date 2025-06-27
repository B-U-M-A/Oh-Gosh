// src/types/WorldTypes.ts

/**
 * Defines different types of rooms that can exist in the game world.
 */
export const RoomType = {
  START: 'start', // Player spawn room
  END: 'end', // Win condition room (or exit)
  COMBAT: 'combat', // Room designed for enemy encounters
  TREASURE: 'treasure', // Room containing valuable items
  SHOP: 'shop', // Room where players can buy/sell
  EMPTY: 'empty', // Basic room with minimal features
  CORRIDOR_H: 'corridor_h', // Horizontal corridor
  CORRIDOR_V: 'corridor_v', // Vertical corridor
  CORNER_TL: 'corner_tl', // Top-left corner corridor
  CORNER_TR: 'corner_tr', // Top-right corner corridor
  CORNER_BL: 'corner_bl', // Bottom-left corner corridor
  CORNER_BR: 'corner_br', // Bottom-right corner corridor
} as const;

export type RoomType = typeof RoomType[keyof typeof RoomType];

/**
 * Defines a template for a single room or corridor.
 * This includes its tile layout and potential entity/obstacle placements.
 */
export interface RoomTemplate {
  /** 2D array representing the tile indices for the room's base layer. */
  tiles: number[][]
  /** Optional array of obstacle positions and types within the room. */
  obstacles?: {
    x: number
    y: number
    tileIndex: number // The tile index for the obstacle (e.g., a wall tile)
  }[]
  /** Optional array of entity positions and types within the room. */
  entities?: {
    x: number
    y: number
    type: string // e.g., ENEMY_TYPES.BASIC_CHASER
  }[]
  // Add other properties as needed, e.g., 'treasureItems', 'shopInventory'
}

/**
 * Represents a cell in the high-level level grid, indicating what type of room/corridor it holds.
 */
export interface LevelLayoutCell {
  type: RoomType
  chunkX: number // Grid X coordinate of this room
  chunkY: number // Grid Y coordinate of this room
  // Add other properties like 'visited', 'hasBoss', etc.
}
// Force recompile by adding a new line or comment.
// This line is intentionally added to trigger a file change.
