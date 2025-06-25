import type { EnemyConfig } from '../types/EnemyTypes';
import { TEXTURE_KEYS } from '../utils/constants'; // Add this import

// Define enemy types as an enum or object for clear referencing
export const ENEMY_TYPES = {
  BASIC_CHASER: 'basic_chaser',
  // Add other enemy types here as needed
} as const; // 'as const' makes it a readonly tuple/object

// Define configurations for each enemy type
export const ENEMY_CONFIGS: { [key: string]: EnemyConfig } = {
  [ENEMY_TYPES.BASIC_CHASER]: {
    textureKey: TEXTURE_KEYS.WALK, // Change 'chaser' to TEXTURE_KEYS.WALK
    frame: 0, // Specify initial frame
    scale: 1.5,
    tint: 0xff0000, // Add a default tint (red)
    depth: 5, // Explicitly set depth
    collideWorldBounds: true, // Explicitly set collideWorldBounds
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
};
