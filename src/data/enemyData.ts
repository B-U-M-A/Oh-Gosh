import type { EnemyConfig } from '../types/EnemyTypes'
import { DIFFICULTY } from '../utils/constants'
import { TEXTURE_KEYS } from '../utils/constants'

/**
 * Central registry for enemy type identifiers.
 * Provides consistent string keys for referencing enemy types throughout the codebase.
 * @readonly
 * @enum {string}
 */
export const ENEMY_TYPES = {
  BASIC_CHASER: 'basic_chaser',
  // Add other enemy types here as needed
} as const // 'as const' makes it a readonly tuple/object

/**
 * Configuration definitions for all enemy types in the game.
 * Each key corresponds to an ENEMY_TYPES identifier, with detailed settings for:
 * - Visual appearance (textures, animations)
 * - Physics behavior
 * - Gameplay properties
 * @type {Object.<string, EnemyConfig>}
 */
export const ENEMY_CONFIGS: { [key: string]: EnemyConfig } = {
  [ENEMY_TYPES.BASIC_CHASER]: {
    // Texture key from TEXTURE_KEYS to use for this enemy's sprite
    textureKey: TEXTURE_KEYS.WALK,
    // Starting frame index of the texture atlas
    frame: 0,
    // Scale multiplier for the sprite (1.5 = 150% size)
    scale: 1.5,
    // Color tint applied to sprite (0xff0000 = red)
    tint: 0xff0000,
    // Rendering depth (higher values appear in front)
    depth: 5,
    // Whether enemy collides with world boundaries
    collideWorldBounds: true,
    // Base movement speed for this enemy type
    speed: DIFFICULTY.INITIAL_CHASER_SPEED,
    // Animation configurations for this enemy type
    animations: [
      {
        key: 'chaser_idle',
        frames: { start: 0, end: 3 },
        frameRate: 8,
        repeat: -1,
      },
      // Add other animations specific to the chaser if needed
    ],
    // Add other properties specific to EnemyConfig if necessary
  },
  // Add configurations for other enemy types here
}
