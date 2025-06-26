// src/game/EnemyFactory.ts
import Phaser from 'phaser'
import type { EnemyConfig } from '../types/EnemyTypes'
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
    const enemy = scene.physics.add.sprite(x, y, config.textureKey, config.frame) // Pass frame to sprite creation

    // Set the sprite's origin point to its center (0.5, 0.5) for proper rotation/scale
    enemy.setOrigin(0.5, 0.5)
    // Apply the configured scale to size the sprite appropriately
    enemy.setScale(config.scale)
    // Apply color tint to the sprite as specified in config
    enemy.setTint(config.tint)
    // Set rendering depth (z-index), defaulting to 5 if not specified
    enemy.setDepth(config.depth ?? 5)
    // Enable/disable world bounds collision, defaulting to true if not specified
    enemy.setCollideWorldBounds(config.collideWorldBounds ?? true)

    // Animation setup - processes all animation configurations if provided
    // This creates Phaser animation instances that can be played on the sprite
    if (config.animations) {
      config.animations.forEach((animConfig) => {
        // Determine frame data format - either {start, end} range or explicit frame numbers
        // Converts range format to frame numbers using Phaser's generator if needed
        const frames: Phaser.Types.Animations.AnimationFrame[] =
          typeof animConfig.frames === 'object' && 'start' in animConfig.frames
            ? scene.anims.generateFrameNumbers(config.textureKey, animConfig.frames)
            : animConfig.frames.map((frame) => ({ key: config.textureKey, frame }))

        // Register the animation with Phaser's animation manager
        // This makes the animation available to all sprites using the same texture
        scene.anims.create({
          key: animConfig.key,
          frames: frames,
          frameRate: animConfig.frameRate,
          repeat: animConfig.repeat,
        })
      })
      // Auto-play the first animation in the list if any animations exist
      // This provides immediate visual feedback for animated enemies
      if (config.animations.length > 0) {
        enemy.play(config.animations[0].key)
      }
    }

    // Optional: Uncomment to attach the config to the sprite instance
    // Useful for later reference to original properties (e.g., resetting states)
    // Requires type assertion since Phaser.Sprite doesn't natively have this property
    // (enemy as any).enemyConfig = config;

    return enemy
  }
}
