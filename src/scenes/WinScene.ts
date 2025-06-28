import Phaser from 'phaser'
import { SCENE_KEYS, TEXTURE_KEYS, ANIMATION_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'

/**
 * Scene displayed when the player successfully wins the game.
 * Shows victory message, time survived, and provides options to restart.
 */
class WinScene extends Phaser.Scene {
  private score: number = 0
  private winText?: Phaser.GameObjects.Text
  private scoreText?: Phaser.GameObjects.Text
  private playerSprite?: Phaser.GameObjects.Sprite
  private restartButton?: Phaser.GameObjects.Text

  constructor() {
    super({ key: SCENE_KEYS.WIN })
  }

  init(data?: { score?: number }) {
    this.score = data?.score ?? 0
    if (!isFinite(this.score)) {
      console.error(`[WinScene:${this.scene.key}] Error in init: Invalid score value`, { score: this.score })
      this.score = 0
    }
  }

  /**
   * Creates and sets up the win scene UI elements.
   * - Adds background and text elements
   * - Displays the time survived
   * - Sets up restart functionality via button and keyboard input
   */
  create() {
    // Set black background for the win scene
    this.cameras.main.setBackgroundColor('#000000')

    localizationManager.addChangeListener(() => this.updateText())
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial layout
    this.updateText()
    this.handleResize(this.scale.gameSize)

    // --- Restart Logic ---
    this.restartButton?.on('pointerdown', this.restartGame, this)
    // Enable restarting the game with ENTER key
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this)

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(() => this.updateText())
      // No manual nullification of GameObjects here. Let Phaser handle it.
    })
  }

  /**
   * Updates all text elements in the scene based on the current language.
   * This method is called when the language changes via LocalizationManager.
   */
  private updateText(): void {
    const winStrings = localizationManager.getStrings().win
    this.winText?.setText(winStrings.title ?? 'You Win!')
    this.scoreText?.setText(
      (winStrings.timeSurvived?.replace('{score}', this.score.toFixed(2)) ?? 'Score: {score}').replace(
        '{score}',
        this.score.toFixed(2),
      ),
    )
    this.restartButton?.setText(winStrings.restartPrompt ?? 'Press to Restart')
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // Add the win title text with gradient and shadow effects
    const winFontSize = Math.max(64, 128 * scaleFactor)
    const winStrings = localizationManager.getStrings().win
    if (!this.winText) {
      this.winText = this.add
        .text(width / 2, 150 * scaleFactor, winStrings.title, {
          fontFamily: 'Staatliches',
          fontSize: `${winFontSize}px`,
          color: '#00ff00', // Green for win
          stroke: '#000000',
          strokeThickness: 8 * scaleFactor,
          shadow: {
            offsetX: 5 * scaleFactor,
            offsetY: 5 * scaleFactor,
            color: '#000',
            blur: 5 * scaleFactor,
            stroke: true,
            fill: true,
          },
        })
        .setOrigin(0.5)
      try {
        const gradient = this.winText.context.createLinearGradient(0, 0, 0, this.winText.height)
        gradient.addColorStop(0, '#00ff00')
        gradient.addColorStop(1, '#00aa00')
        this.winText.setFill(gradient)
      } catch (e) {
        console.warn(
          `[WinScene:${this.scene.key}] Error in handleResize: Failed to create text gradient. Using solid color.`,
          e,
        )
      }
    } else {
      this.winText.setFontSize(`${winFontSize}px`)
      this.winText.setStroke('#000000', 8 * scaleFactor)
      this.winText.setShadow(5 * scaleFactor, 5 * scaleFactor, '#000', 5 * scaleFactor, true, true)
      this.winText.setPosition(width / 2, 150 * scaleFactor)
      try {
        const gradient = this.winText.context.createLinearGradient(0, 0, 0, this.winText.height)
        gradient.addColorStop(0, '#00ff00')
        gradient.addColorStop(1, '#00aa00')
        this.winText.setFill(gradient)
      } catch (e) {
        console.warn(
          `[WinScene:${this.scene.key}] Error in handleResize: Failed to create text gradient. Using solid color.`,
          e,
        )
      }
      this.winText.setText(winStrings.title)
    }

    // Add text showing the time survived with localization
    const scoreFontSize = Math.max(32, 64 * scaleFactor)
    if (!this.scoreText) {
      this.scoreText = this.add
        .text(
          width / 2,
          250 * scaleFactor,
          (winStrings.timeSurvived?.replace('{score}', this.score.toFixed(2)) ?? 'Score: {score}').replace(
            '{score}',
            this.score.toFixed(2),
          ),
          {
            fontFamily: 'Staatliches',
            fontSize: `${scoreFontSize}px`,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6 * scaleFactor,
          },
        )
        .setOrigin(0.5)
    } else {
      this.scoreText.setFontSize(`${scoreFontSize}px`)
      this.scoreText.setStroke('#000000', 6 * scaleFactor)
      this.scoreText.setPosition(width / 2, 250 * scaleFactor)
      this.scoreText.setText(
        (winStrings.timeSurvived?.replace('{score}', this.score.toFixed(2)) ?? 'Score: {score}').replace(
          '{score}',
          this.score.toFixed(2),
        ),
      ) // Ensure text is updated on resize
    }

    // Add player sprite with idle animation in the center
    const playerScale = 2 * scaleFactor * 2
    if (!this.playerSprite) {
      try {
        this.playerSprite = this.add.sprite(width / 2, height / 2 + 50 * scaleFactor, TEXTURE_KEYS.IDLE)
        this.playerSprite.setScale(playerScale)
        if (this.anims.exists(ANIMATION_KEYS.PLAYER_IDLE)) {
          this.playerSprite.play(ANIMATION_KEYS.PLAYER_IDLE)
        } else {
          console.warn(
            `[WinScene:${this.scene.key}] Warning in handleResize: Animation not found: ${ANIMATION_KEYS.PLAYER_IDLE}. Displaying static sprite.`,
          )
        }
      } catch (error) {
        console.error(
          `[WinScene:${this.scene.key}] Error in createPlayerSprite: Failed to create player sprite (texture: ${TEXTURE_KEYS.IDLE})`,
          error,
        )
      }
    } else {
      this.playerSprite.setScale(playerScale)
      this.playerSprite.setPosition(width / 2, height / 2 + 50 * scaleFactor)
    }

    // Add interactive restart button with pulsing animation
    const restartFontSize = Math.max(28, 48 * scaleFactor)
    if (!this.restartButton) {
      this.restartButton = this.add
        .text(width / 2, height - 80 * scaleFactor, winStrings.restartPrompt ?? 'Press to Restart', {
          fontFamily: 'Staatliches',
          fontSize: `${restartFontSize}px`,
          color: '#00FFFF', // Cyan
          backgroundColor: '#8A2BE2', // Blue Violet
          padding: { x: 20 * scaleFactor, y: 10 * scaleFactor },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      this.tweens.add({
        targets: this.restartButton,
        alpha: 0.6,
        ease: 'Sine.easeInOut',
        duration: 1500,
        yoyo: true,
        repeat: -1,
      })
    } else {
      this.restartButton.setFontSize(`${restartFontSize}px`)
      this.restartButton.setStyle({
        padding: { x: 20 * scaleFactor, y: 10 * scaleFactor },
      })
      this.restartButton.setPosition(width / 2, height - 80 * scaleFactor)
    }
  }

  private restartGame(): void {
    // Prevent multiple restart triggers from firing simultaneously
    this.input.keyboard?.off('keydown-ENTER', this.restartGame, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this) // Remove resize listener

    // Robustly check if the target scene exists before trying to start it
    if (!this.scene.manager.keys[SCENE_KEYS.MAIN_MENU]) {
      console.error(
        `[WinScene:${this.scene.key}] Error in restartGame: Scene key not found: ${SCENE_KEYS.MAIN_MENU}. Cannot restart game.`,
      )
      return
    }

    this.cameras.main.fadeOut(500, 0, 0, 0, (_: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.stop(SCENE_KEYS.WIN) // Stop the current WinScene
        this.scene.start(SCENE_KEYS.MAIN_MENU)
      }
    })
  }
}

export default WinScene
