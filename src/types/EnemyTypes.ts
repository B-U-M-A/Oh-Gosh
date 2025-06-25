export interface EnemyConfig {
  textureKey: string;
  scale: number;
  tint: number;
  depth?: number; // Optional depth property
  collideWorldBounds?: boolean; // Optional collideWorldBounds property
  // Add other properties as needed for different enemy behaviors or visuals
  // For example:
  // baseHealth: number;
  // attackDamage: number;
  // attackType: 'melee' | 'ranged';
  // pathfindingAlgorithm: 'direct' | 'A*';
  animations?: { key: string; frames: { start: number; end: number } | number[]; frameRate: number; repeat: number }[];
  frame?: number; // Optional frame property for static sprites
}

