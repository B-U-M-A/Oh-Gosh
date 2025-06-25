import Phaser from 'phaser'
import { SCENE_KEYS, TEXTURE_KEYS, ANIMATION_KEYS } from '../utils/constants'

class GameOverScene extends Phaser.Scene {
  private score: number = 0
  private gameOverText?: Phaser.GameObjects.Text
  private scoreText?: Phaser.GameObjects.Text
  private playerSprite?: Phaser.GameObjects.Sprite
  private restartButton?: Phaser.GameObjects.Text

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER })
  }

  init(data: { score?: number }) {
    this.score = data.score || 0
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000') // Ensure black background

    // Add resize event listener
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial layout
    this.handleResize(this.scale.gameSize)

    // --- Restart Logic ---
    this.restartButton?.on('pointerdown', this.restartGame, this)
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this)

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      // Nullify references to allow garbage collection
      this.gameOverText = undefined
      this.scoreText = undefined
      this.playerSprite = undefined
      this.restartButton = undefined
    })
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // --- 1. Styled "Game Over" Text ---
    const gameOverFontSize = Math.max(64, 128 * scaleFactor)
    if (!this.gameOverText) {
      this.gameOverText = this.add
        .text(width / 2, 150 * scaleFactor, 'GAME OVER', {
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
    }

    // --- Display the final score ---
    const scoreFontSize = Math.max(32, 64 * scaleFactor)
    if (!this.scoreText) {
      this.scoreText = this.add
        .text(width / 2, 250 * scaleFactor, `Your Score: ${this.score.toFixed(2)}`, {
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
      this.restartButton = this.add
        .text(width / 2, height - 80 * scaleFactor, 'Click or Press Enter to Restart', {
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

    this.cameras.main.fadeOut(500, 0, 0, 0, (_: any, progress: number) => {
      if (progress === 1) {
        this.scene.stop(SCENE_KEYS.GAME_OVER) // Stop the current GameOverScene
        this.scene.start(SCENE_KEYS.MAIN_MENU) // Go back to MainMenuScene
      }
    })
  }
}

export default GameOverScene
