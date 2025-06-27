import Phaser from 'phaser'
import type { EnemyConfig } from '../types/EnemyTypes'

/**
 * Base class for all enemy types in the game.
 * Extends Phaser.Physics.Arcade.Sprite to provide physics capabilities.
 * Handles common enemy properties and behaviors like animation and configuration.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected config: EnemyConfig // Store the configuration for this enemy

  /**
   * Creates a new Enemy instance.
   * @param scene The Phaser Scene this enemy belongs to.
   * @param x The initial X position of the enemy.
   * @param y The initial Y position of the enemy.
   * @param texture The key of the texture to be used for the enemy sprite.
   * @param frame The initial frame of the texture to be used.
   * @param config The configuration object for this enemy type.
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame: number | string | undefined,
    config: EnemyConfig,
  ) {
    super(scene, x, y, texture, frame)

    this.config = config // Store the provided configuration

    scene.add.existing(this) // Add the sprite to the scene's display list
    scene.physics.add.existing(this) // Add the sprite to the scene's physics system

    // Apply common properties from the configuration
    this.setScale(config.scale)
    this.setTint(config.tint)
    if (config.depth !== undefined) {
      this.setDepth(config.depth)
    }
    if (config.collideWorldBounds !== undefined) {
      this.setCollideWorldBounds(config.collideWorldBounds)
    }

    // Set up animations if defined in the config
    if (config.animations) {
      config.animations.forEach((anim) => {
        if (!this.scene.anims.exists(anim.key)) {
          // Check if animation already exists to prevent errors on multiple enemy spawns
          this.scene.anims.create({
            key: anim.key,
            frames: Array.isArray(anim.frames)
              ? anim.frames.map((f) => ({ key: texture, frame: f }))
              : this.scene.anims.generateFrameNumbers(texture, anim.frames),
            frameRate: anim.frameRate,
            repeat: anim.repeat,
          })
        }
      })
      // Play the first animation defined in the config by default, if any
      if (config.animations.length > 0) {
        this.play(config.animations[0].key)
      }
    }
  }

  /**
   * The update method for the enemy. This can be overridden by specific enemy types
   * to implement their unique AI and behaviors.
   * @param _time The current game time.
   * @param _delta The time elapsed since the last frame in milliseconds.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_time: number, _delta: number): void {
    // Base enemy update logic (e.g., simple movement, animation updates)
  }
}
