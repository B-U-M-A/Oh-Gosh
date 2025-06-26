import Phaser from 'phaser'
import { SCENE_KEYS, TEXTURE_KEYS, ANIMATION_KEYS, LOCAL_STORAGE_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'

/**
 * GameOverScene represents the scene displayed when the player loses the game.
 * It shows the player's score, high score, and provides options to restart the game.
 */
class GameOverScene extends Phaser.Scene {
  private score: number = 0
  private gameOverText?: Phaser.GameObjects.Text
  private scoreText?: Phaser.GameObjects.Text
  private highScore: number = 0
  private highScoreText?: Phaser.GameObjects.Text
  private playerSprite?: Phaser.GameObjects.Sprite
  private restartButton?: Phaser.GameObjects.Text

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER })
  }

  init(data?: { score?: number }) {
    this.score = data?.score ?? 0

    // Retrieve high score from local storage
    const storedHighScore = localStorage.getItem(LOCAL_STORAGE_KEYS.HIGH_SCORE)
    let currentHighScore = storedHighScore ? parseInt(storedHighScore, 10) : 0

    // Update high score if current score is higher
    if (this.score > currentHighScore) {
      currentHighScore = this.score
      localStorage.setItem(LOCAL_STORAGE_KEYS.HIGH_SCORE, currentHighScore.toString())
    }
    this.highScore = currentHighScore // Store the high score for display
  }

  /**
   * Creates and sets up the game over UI elements including:
   * - Background and text displays
   * - Score and high score displays
   * - Restart game functionality
   */
  create() {
    this.cameras.main.setBackgroundColor('#000000') // Ensure black background

    // Add listeners for localization changes and screen resizing
    localizationManager.addChangeListener(() => this.updateText())
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial layout setup
    this.updateText()
    this.handleResize(this.scale.gameSize)

    // --- Restart Logic ---
    // Set up restart game controls - both mouse click and keyboard
    this.restartButton?.on('pointerdown', this.restartGame, this)
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this)

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(() => this.updateText())
      // Nullify references to allow garbage collection
      this.gameOverText = undefined
      this.scoreText = undefined
      this.highScoreText = undefined
      this.playerSprite = undefined
      this.restartButton = undefined
    })
  }

  /**
   * Updates all text elements in the scene based on the current language.
   * This method is called when the language changes via LocalizationManager.
   */
  private updateText(): void {
    // Get localized strings for game over screen
    const gameOverStrings = localizationManager.getStrings().gameOver

    // Update all text elements with localized strings and current scores
    this.gameOverText?.setText(gameOverStrings.title)
    this.scoreText?.setText(gameOverStrings.yourScore.replace('{score}', this.score.toFixed(2)))
    this.highScoreText?.setText(gameOverStrings.highScore.replace('{score}', this.highScore.toFixed(2)))
    this.restartButton?.setText(gameOverStrings.restartPrompt)
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // --- 1. Styled "Game Over" Text ---
    const gameOverFontSize = Math.max(64, 128 * scaleFactor)
    const gameOverStrings = localizationManager.getStrings().gameOver
    if (!this.gameOverText) {
      // Create and style the "Game Over" title text with gradient and shadow effects
      this.gameOverText = this.add
        .text(width / 2, 150 * scaleFactor, gameOverStrings.title, {
          fontFamily: 'Staatliches',
          fontSize: `${gameOverFontSize}px`,
          color: '#ffdd00',
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
        const gradient = this.gameOverText.context.createLinearGradient(0, 0, 0, this.gameOverText.height)
        gradient.addColorStop(0, '#ffdd00')
        gradient.addColorStop(1, '#fbb034')
        this.gameOverText.setFill(gradient)
      } catch (e) {
        console.warn('Failed to create text gradient. Using solid color.', e)
      }
    } else {
      this.gameOverText.setFontSize(`${gameOverFontSize}px`)
      this.gameOverText.setStroke('#000000', 8 * scaleFactor)
      this.gameOverText.setShadow(5 * scaleFactor, 5 * scaleFactor, '#000', 5 * scaleFactor, true, true)
      this.gameOverText.setPosition(width / 2, 150 * scaleFactor)
      try {
        const gradient = this.gameOverText.context.createLinearGradient(0, 0, 0, this.gameOverText.height)
        gradient.addColorStop(0, '#ffdd00')
        gradient.addColorStop(1, '#fbb034')
        this.gameOverText.setFill(gradient)
      } catch (e) {
        console.warn('Failed to create text gradient. Using solid color.', e)
      }
      this.gameOverText.setText(gameOverStrings.title)
    }

    // --- Display the final score ---
    const scoreFontSize = Math.max(32, 64 * scaleFactor)
    if (!this.scoreText) {
      // Create the score display text showing the player's final score
      this.scoreText = this.add
        .text(width / 2, 250 * scaleFactor, gameOverStrings.yourScore.replace('{score}', this.score.toFixed(2)), {
          fontFamily: 'Staatliches',
          fontSize: `${scoreFontSize}px`,
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    } else {
      this.scoreText.setFontSize(`${scoreFontSize}px`)
      this.scoreText.setStroke('#000000', 6 * scaleFactor)
      this.scoreText.setPosition(width / 2, 250 * scaleFactor)
      this.scoreText.setText(gameOverStrings.yourScore.replace('{score}', this.score.toFixed(2))) // Ensure text is updated on resize
    }

    const highScoreFontSize = Math.max(28, 56 * scaleFactor) // Slightly smaller than current score, but prominent
    if (!this.highScoreText) {
      // Create the high score display text showing the best score
      this.highScoreText = this.add
        .text(width / 2, 320 * scaleFactor, gameOverStrings.highScore.replace('{score}', this.highScore.toFixed(2)), {
          fontFamily: 'Staatliches',
          fontSize: `${highScoreFontSize}px`,
          color: '#ffff00', // Yellow color for high score
          stroke: '#000000',
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    } else {
      this.highScoreText.setFontSize(`${highScoreFontSize}px`)
      this.highScoreText.setStroke('#000000', 6 * scaleFactor)
      this.highScoreText.setPosition(width / 2, 320 * scaleFactor)
      this.highScoreText.setText(gameOverStrings.highScore.replace('{score}', this.highScore.toFixed(2))) // Ensure text is updated on resize
    }

    // --- 2. Player Sprite with Idle Animation ---
    const playerScale = 2 * scaleFactor * 2
    if (!this.playerSprite) {
      try {
        this.playerSprite = this.add.sprite(width / 2, height / 2 + 50 * scaleFactor, TEXTURE_KEYS.IDLE)
        this.playerSprite.setScale(playerScale)
        if (this.anims.exists(ANIMATION_KEYS.PLAYER_IDLE)) {
          this.playerSprite.play(ANIMATION_KEYS.PLAYER_IDLE)
        } else {
          console.warn(`Animation not found: ${ANIMATION_KEYS.PLAYER_IDLE}. Displaying static sprite.`)
        }
      } catch (error) {
        console.error('Failed to create player sprite on game over screen:', error)
      }
    } else {
      this.playerSprite.setScale(playerScale)
      this.playerSprite.setPosition(width / 2, height / 2 + 50 * scaleFactor)
    }

    // --- 3. Interactive "Restart" Text with Tween ---
    const restartFontSize = Math.max(28, 48 * scaleFactor)
    if (!this.restartButton) {
      // Create the interactive restart button with pulsing animation
      this.restartButton = this.add
        .text(width / 2, height - 80 * scaleFactor, gameOverStrings.restartPrompt, {
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
    // --- Prevent multiple restart triggers from firing simultaneously ---
    this.input.keyboard?.off('keydown-ENTER', this.restartGame, this)
    this.input.off('pointerdown', this.restartGame, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this) // Remove resize listener

    // --- Robustly check if the target scene exists before trying to start it ---
    if (!this.scene.manager.keys[SCENE_KEYS.MAIN_MENU]) {
      console.error(`Scene key not found: ${SCENE_KEYS.MAIN_MENU}. Cannot restart game.`)
      return
    }

    this.cameras.main.fadeOut(500, 0, 0, 0, (_: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.stop(SCENE_KEYS.GAME_OVER) // Stop the current GameOverScene
        this.scene.start(SCENE_KEYS.MAIN_MENU) // Go back to MainMenuScene
      }
    })
  }
}

export default GameOverScene
