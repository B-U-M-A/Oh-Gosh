import Phaser from 'phaser'
import { DIFFICULTY } from './constants'

/**
 * Manages game difficulty progression, including enemy speed and spawn rates.
 * Handles difficulty scaling based on player's score.
 */
export class DifficultyManager {
  private scene: Phaser.Scene
  private currentChaserSpeed: number
  private currentSpawnDelay: number
  private lastDifficultyUpdateScore: number
  private chaserSpawnTimer?: Phaser.Time.TimerEvent

  /**
   * Creates a new DifficultyManager instance
   * @param scene - Phaser scene reference for timer management
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.currentChaserSpeed = DIFFICULTY.INITIAL_CHASER_SPEED
    this.currentSpawnDelay = DIFFICULTY.INITIAL_SPAWN_DELAY
    this.lastDifficultyUpdateScore = 0
  }

  /**
   * Updates difficulty based on the current score
   * @param score - Current player score (time survived in seconds)
   * @returns True if difficulty was updated, false otherwise
   */
  public updateDifficulty(score: number): boolean {
    // Only update difficulty if score has increased enough since last update
    if (score - this.lastDifficultyUpdateScore < DIFFICULTY.DIFFICULTY_UPDATE_INTERVAL_SCORE) {
      return false
    }
    this.lastDifficultyUpdateScore = score

    // Calculate new chaser speed
    const newChaserSpeed = Math.min(
      DIFFICULTY.INITIAL_CHASER_SPEED +
        Math.floor(score / DIFFICULTY.SPEED_INCREASE_INTERVAL_SCORE) * DIFFICULTY.SPEED_INCREASE_AMOUNT,
      DIFFICULTY.MAX_CHASER_SPEED,
    )

    // Calculate new spawn delay
    const newSpawnDelay = Math.max(
      DIFFICULTY.INITIAL_SPAWN_DELAY -
        Math.floor(score / DIFFICULTY.SPAWN_DECREASE_INTERVAL_SCORE) * DIFFICULTY.SPAWN_DECREASE_AMOUNT,
      DIFFICULTY.MIN_SPAWN_DELAY,
    )

    let difficultyUpdated = false

    // Update chaser speed if it has changed
    if (newChaserSpeed !== this.currentChaserSpeed) {
      this.currentChaserSpeed = newChaserSpeed
      difficultyUpdated = true
    }

    // Update spawn delay if it has changed
    if (newSpawnDelay !== this.currentSpawnDelay) {
      this.currentSpawnDelay = newSpawnDelay
      difficultyUpdated = true
    }

    return difficultyUpdated
  }

  /**
   * Gets the current chaser speed
   * @returns Current chaser speed in pixels per second
   */
  public getChaserSpeed(): number {
    return this.currentChaserSpeed
  }

  /**
   * Gets the current spawn delay
   * @returns Current spawn delay in milliseconds
   */
  public getSpawnDelay(): number {
    return this.currentSpawnDelay
  }

  /**
   * Updates the spawn timer with the current spawn delay
   * @param callback - Function to call when a new enemy should be spawned
   * @param callbackScope - The context in which to call the callback
   * @returns The created timer event
   */
  public createSpawnTimer(callback: () => void, callbackScope: Phaser.Scene): Phaser.Time.TimerEvent {
    if (this.chaserSpawnTimer) {
      this.chaserSpawnTimer.remove()
    }

    this.chaserSpawnTimer = this.scene.time.addEvent({
      delay: this.currentSpawnDelay,
      callback: callback,
      callbackScope: callbackScope,
      loop: true,
    })

    return this.chaserSpawnTimer
  }

  /**
   * Updates the speed of existing chasers
   * @param chasers - Group of chaser enemies to update
   * @param player - Player object to move chasers towards
   */
  public updateChasersSpeed(chasers: Phaser.Physics.Arcade.Group, player: Phaser.Physics.Arcade.Sprite): void {
    chasers.children.each((chaser) => {
      if (chaser instanceof Phaser.Physics.Arcade.Sprite && player) {
        this.scene.physics.moveToObject(chaser, player, this.currentChaserSpeed)
      }
      return true // Continue iteration
    })
  }
}
