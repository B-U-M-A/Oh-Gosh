/**
 * Configuration interface for enemy sprites in the game.
 * Defines visual and behavioral properties for enemy entities.
 */
export interface EnemyConfig {
  /** Key of the texture asset to use for this enemy sprite */
  textureKey: string
  /** Scale factor to apply to the enemy sprite's size */
  scale: number
  /** Color tint to apply to the enemy sprite (hexadecimal value) */
  tint: number
  depth?: number // Optional depth property
  collideWorldBounds?: boolean // Optional collideWorldBounds property
  // Add other properties as needed for different enemy behaviors or visuals
  // For example:
  /** Base movement speed of the enemy in pixels per second */
  speed: number
  // baseHealth: number;
  // attackDamage: number;
  // attackType: 'melee' | 'ranged';
  // pathfindingAlgorithm: 'direct' | 'A*';
  /** Optional animation configurations for the enemy sprite */
  animations?: {
    key: string // Animation key identifier
    frames: { start: number; end: number } | number[] // Frame range or specific frames
    frameRate: number // Animation speed in frames per second
    repeat: number // Number of times to repeat (-1 for infinite)
  }[]
  /** Optional starting frame number for static sprites */
  frame?: number
}
