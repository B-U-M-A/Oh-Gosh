// src/game/EnemyFactory.ts
import Phaser from 'phaser'
import type { EnemyConfig } from '../types/EnemyTypes'
import { Enemy } from '../enemies/Enemy' // Add this import

/**
 * Factory class for creating and configuring enemy sprites in the game.
 * This class encapsulates the logic for instantiating enemies with specific visual properties.
 * It allows for easy expansion and modification of enemy types without cluttering the main game logic.
 */

export class EnemyFactory {
  /**
   * Creates and configures an enemy sprite based on the provided configuration.
   * This method handles the instantiation and initial setup of the sprite's visual properties.
   * Dynamic properties like speed (which changes with difficulty) are applied by the scene after creation.
   *
   * @param scene The Phaser scene to which the enemy will be added.
   * @param config The configuration object for the enemy type.
   * @param x The initial X position of the enemy.
   * @param y The initial Y position of the enemy.
   * @returns The created Enemy instance.
   */
  public static createEnemy(
    scene: Phaser.Scene,
    config: EnemyConfig,
    x: number,
    y: number,
  ): Enemy { // Change return type to Enemy
    // Instantiate the Enemy class, passing all required info to its constructor
    const enemy = new Enemy(scene, x, y, config.textureKey, config.frame, config)
    return enemy
  }
}
