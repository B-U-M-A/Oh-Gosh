import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'

class PauseScene extends Phaser.Scene {
  private pausedText?: Phaser.GameObjects.Text
  private resumeText?: Phaser.GameObjects.Text
  private backToMenuButton?: Phaser.GameObjects.Text
  private backgroundRect?: Phaser.GameObjects.Rectangle

  constructor() {
    super({ key: SCENE_KEYS.PAUSE })
  }

  create() {
    // Add resize event listener
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial layout
    this.handleResize(this.scale.gameSize)

    // --- Keyboard listener to resume the game ---
    this.input.keyboard?.on('keydown-P', this.resumeGame, this)
    this.input.keyboard?.on('keydown-ESC', this.resumeGame, this)

    // --- Clean up listeners and objects on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this) // Remove resize listener
      this.input.keyboard?.off('keydown-P', this.resumeGame, this)
      this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)

      // Destroy game objects and nullify references
      this.backgroundRect?.destroy()
      this.pausedText?.destroy()
      this.resumeText?.destroy()
      this.backToMenuButton?.destroy()

      this.backgroundRect = undefined
      this.pausedText = undefined
      this.resumeText = undefined
      this.backToMenuButton = undefined

      // Stop and destroy any active tweens on resumeText
      if (this.resumeText) {
        this.tweens.killTweensOf(this.resumeText)
      }
    })
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // --- Create a semi-transparent background overlay ---
    if (!this.backgroundRect) {
      this.backgroundRect = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setOrigin(0.5)
    } else {
      this.backgroundRect.setSize(width, height).setPosition(width / 2, height / 2)
    }

    // --- "Paused" Text ---
    const pausedFontSize = Math.max(48, 96 * scaleFactor)
    if (!this.pausedText) {
      this.pausedText = this.add
        .text(width / 2, height / 2 - 50 * scaleFactor, 'PAUSED', {
          fontFamily: 'Staatliches',
          fontSize: `${pausedFontSize}px`,
          color: '#FFD700', // Gold
          stroke: '#8A2BE2', // Blue Violet
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    } else {
      this.pausedText.setFontSize(`${pausedFontSize}px`)
      this.pausedText.setStroke('#8A2BE2', 6 * scaleFactor)
      this.pausedText.setPosition(width / 2, height / 2 - 50 * scaleFactor)
    }

    // --- "Resume" Instruction Text ---
    const resumeFontSize = Math.max(24, 48 * scaleFactor)
    if (!this.resumeText) {
      this.resumeText = this.add
        .text(width / 2, height / 2 + 50 * scaleFactor, 'Press P or ESC to Resume', {
          fontFamily: 'Staatliches',
          fontSize: `${resumeFontSize}px`,
          color: '#00FFFF', // Cyan
        })
        .setOrigin(0.5)

      // Add a subtle tween to the resume text for better UX ---
      this.tweens.add({
        targets: this.resumeText,
        alpha: 0.5,
        ease: 'Sine.easeInOut',
        duration: 1200,
        yoyo: true,
        repeat: -1,
      })
    } else {
      this.resumeText.setFontSize(`${resumeFontSize}px`)
      this.resumeText.setPosition(width / 2, height / 2 + 50 * scaleFactor)
    }

    // --- Back to Main Menu Button ---
    const buttonFontSize = Math.max(20, 28 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor

    const buttonStyle = {
      fontSize: `${buttonFontSize}px`,
      color: '#00FFFF', // Cyan
      backgroundColor: '#8A2BE2', // Blue Violet
      padding: { x: buttonPaddingX, y: buttonPaddingY },
    }

    if (!this.backToMenuButton) {
      this.backToMenuButton = this.add
        .text(width / 2, height / 2 + 150 * scaleFactor, 'Back to Main Menu', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', this.backToMainMenu, this)
        .on('pointerover', () => this.backToMenuButton?.setStyle({ color: '#FFD700' })) // Gold
        .on('pointerout', () => this.backToMenuButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.backToMenuButton.setPosition(width / 2, height / 2 + 150 * scaleFactor).setStyle(buttonStyle)
    }
  }

  private resumeGame(): void {
    // --- Clean up listeners to prevent multiple triggers ---
    this.input.keyboard?.off('keydown-P', this.resumeGame, this)
    this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this) // Remove resize listener

    // --- Resume the main game scene and stop this pause scene ---
    if (this.scene.manager.keys[SCENE_KEYS.LEVEL1]) {
      this.scene.resume(SCENE_KEYS.LEVEL1)
    }

    this.scene.stop()
  }

  private backToMainMenu(): void {
    // Clean up listeners
    this.input.keyboard?.off('keydown-P', this.resumeGame, this)
    this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this) // Remove resize listener

    // Stop Level1Scene and PauseScene, then start MainMenuScene
    if (this.scene.manager.keys[SCENE_KEYS.LEVEL1]) {
      this.scene.stop(SCENE_KEYS.LEVEL1)
    }
    this.scene.stop(SCENE_KEYS.PAUSE)
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }
}

export default PauseScene
