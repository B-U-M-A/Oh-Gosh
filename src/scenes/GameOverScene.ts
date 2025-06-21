import Phaser from 'phaser'
import { SCENE_KEYS, TEXTURE_KEYS, ANIMATION_KEYS } from '../utils/constants'

class GameOverScene extends Phaser.Scene {
  private score: number = 0

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER })
  }

  init(data: { score?: number }) {
    this.score = data.score || 0
  }

  create() {
    // --- 1. Styled "Game Over" Text ---
    const gameOverText = this.add
      .text(this.scale.width / 2, 150, 'GAME OVER', {
        fontFamily: 'Staatliches',
        fontSize: '128px',
        color: '#ffdd00',
        stroke: '#000000',
        strokeThickness: 8,
        shadow: {
          offsetX: 5,
          offsetY: 5,
          color: '#000',
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)

    try {
      const gradient = gameOverText.context.createLinearGradient(0, 0, 0, gameOverText.height)
      gradient.addColorStop(0, '#ffdd00')
      gradient.addColorStop(1, '#fbb034')
      gameOverText.setFill(gradient)
    } catch (e) {
      console.warn('Failed to create text gradient. Using solid color.', e)
    }

    // --- Display the final score ---
    this.add
      .text(this.scale.width / 2, 250, `Your Score: ${this.score.toFixed(2)}`, {
        fontFamily: 'Staatliches',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    // --- 2. Player Sprite with Idle Animation ---
    try {
      const player = this.add.sprite(this.scale.width / 2, this.scale.height / 2 + 50, TEXTURE_KEYS.PLAYER)
      player.setScale(0.35)

      // --- Defensively play animation only if it exists ---
      if (this.anims.exists(ANIMATION_KEYS.PLAYER_IDLE)) {
        player.play(ANIMATION_KEYS.PLAYER_IDLE)
      } else {
        console.warn(`Animation not found: ${ANIMATION_KEYS.PLAYER_IDLE}. Displaying static sprite.`)
      }
    } catch (error) {
      console.error('Failed to create player sprite on game over screen:', error)
    }

    // --- 3. Interactive "Restart" Text with Tween ---
    const restartText = this.add
      .text(this.scale.width / 2, this.scale.height - 80, 'Click or Press Enter to Restart', {
        fontFamily: 'Staatliches',
        fontSize: '48px',
        color: '#cccccc',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    this.tweens.add({
      targets: restartText,
      alpha: 0.6,
      ease: 'Sine.easeInOut',
      duration: 1500,
      yoyo: true,
      repeat: -1,
    })

    // --- 4. Restart Logic ---
    restartText.on('pointerdown', this.restartGame, this)
    this.input.keyboard?.on('keydown-ENTER', this.restartGame, this)
  }

  private restartGame(): void {
    // --- Prevent multiple restart triggers from firing simultaneously ---
    this.input.keyboard?.off('keydown-ENTER', this.restartGame, this)
    this.input.off('pointerdown', this.restartGame, this)

    // --- Robustly check if the target scene exists before trying to start it ---
    if (!this.scene.manager.keys[SCENE_KEYS.MAIN]) {
      console.error(`Scene key not found: ${SCENE_KEYS.MAIN}. Cannot restart game.`)
      // Optionally, display an error to the user on the screen here
      return
    }

    this.cameras.main.fadeOut(500, 0, 0, 0, (_: any, progress: number) => {
      if (progress === 1) {
        this.scene.start(SCENE_KEYS.MAIN)
      }
    })
  }
}

export default GameOverScene
