// src/game/EnemyFactory.ts
import Phaser from 'phaser';
import type { EnemyConfig } from '../types/EnemyTypes';
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
   * @returns The created Phaser.Physics.Arcade.Sprite.
   */
  public static createEnemy(
    scene: Phaser.Scene,
    config: EnemyConfig,
    x: number,
    y: number,
  ): Phaser.Physics.Arcade.Sprite {
    const enemy = scene.physics.add.sprite(x, y, config.textureKey, config.frame); // Pass frame to sprite creation

    enemy.setOrigin(0.5, 0.5);
    enemy.setScale(config.scale);
    enemy.setTint(config.tint);
    enemy.setDepth(config.depth ?? 5); // Use config.depth, fallback to 5
    enemy.setCollideWorldBounds(config.collideWorldBounds ?? true); // Use config.collideWorldBounds, fallback to true

    // Apply animations if defined in the config
    if (config.animations) {
      config.animations.forEach(animConfig => {
        // Check if frames is an object {start, end} or an array of numbers
        const frames = typeof animConfig.frames === 'object' && 'start' in animConfig.frames
          ? scene.anims.generateFrameNumbers(config.textureKey, animConfig.frames)
          : animConfig.frames;

        scene.anims.create({
          key: animConfig.key,
          frames: frames,
          frameRate: animConfig.frameRate,
          repeat: animConfig.repeat,
        });
      });
      // Play the first animation by default if animations are defined
      if (config.animations.length > 0) {
        enemy.play(config.animations[0].key);
      }
    }

    // You can store the config on the sprite itself if you need to access
    // its base properties later (e.g., for specific enemy behaviors).
    // (enemy as any).enemyConfig = config;

    return enemy;
  }
}
