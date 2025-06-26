// src/scenes/PauseScene.ts

import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
// Import LevelScene base class for type safety
import { LevelScene } from './LevelScene' // ADDED/MODIFIED IMPORT

/**
 * The pause scene displayed when the game is paused, providing options to:
 * - Resume the game
 * - Adjust volume
 * - Toggle minimap visibility
 * - Return to main menu
 */
class PauseScene extends Phaser.Scene {
  private pausedText?: Phaser.GameObjects.Text
  private resumeButton?: Phaser.GameObjects.Text
  private backToMenuButton?: Phaser.GameObjects.Text
  private backgroundRect?: Phaser.GameObjects.Rectangle

  // New UI Elements
  private volumeLabel?: Phaser.GameObjects.Text
  private volumeBar?: Phaser.GameObjects.Graphics
  private volumeHandle?: Phaser.GameObjects.Rectangle
  private toggleMinimapButton?: Phaser.GameObjects.Text

  // ADDED PROPERTY: Reference to the LevelScene that launched this pause menu
  private parentLevelScene?: LevelScene
  // ADDED PROPERTY: Bound callback for localization changes
  private localizationUpdateCallback: () => void

  constructor() {
    super({ key: SCENE_KEYS.PAUSE })
    // Bind the updateText method to this instance for use as a callback
    this.localizationUpdateCallback = () => this.updateText()
  }

  // ADDED METHOD: To receive the parent scene reference
  init(data: { parentScene: LevelScene }) {
    this.parentLevelScene = data.parentScene
  }

  /**
   * Sets up the pause menu UI including:
   * - Background overlay
   * - Title text
   * - Interactive buttons (resume, back to menu)
   * - Volume control slider
   * - Minimap toggle button
   * - Event listeners for keyboard and UI interactions
   */
  create() {
    // Listen for language changes to update UI text
    localizationManager.addChangeListener(this.localizationUpdateCallback) // MODIFIED: USE BOUND CALLBACK

    // Add resize event listener to handle window resizing
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Create all UI elements for the pause menu
    // Add semi-transparent background overlay for the pause menu
    this.backgroundRect = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.7).setOrigin(0.5)

    // Add the "Paused" title text (text content will be set by updateText())
    this.pausedText = this.add
      .text(0, 0, '', {
        fontFamily: 'Staatliches',
        fontSize: '1px',
        color: '#FFD700', // Gold color
        stroke: '#8A2BE2', // Blue Violet outline
        strokeThickness: 1,
      })
      .setOrigin(0.5)
    // Add "Resume" button with interactive hover effects
    this.resumeButton = this.add
      .text(0, 0, '', {
        fontSize: '1px',
        color: '#00FFFF', // Cyan color
        backgroundColor: '#8A2BE2', // Blue Violet background
        padding: { x: 1, y: 1 },
      })
      .setOrigin(0.5)
      .setInteractive() // Make the text clickable
      .on('pointerdown', this.resumeGame, this) // Resume game when clicked
      .on('pointerover', () => this.resumeButton?.setStyle({ color: '#FFD700' })) // Gold on hover
      .on('pointerout', () => this.resumeButton?.setStyle({ color: '#00FFFF' })) // Cyan on mouse out
    // Add volume label (text content will be set by updateText())
    this.volumeLabel = this.add
      .text(0, 0, '', {
        fontSize: '1px',
        color: '#FFFFFF', // White color
      })
      .setOrigin(0.5)
    this.volumeBar = this.add.graphics()
    this.volumeHandle = this.add.rectangle(0, 0, 1, 1, 0xffffff).setInteractive({ draggable: true })
    this.input.on('drag', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
      if (gameObject !== this.volumeHandle) return
      const { width } = this.scale.gameSize
      const baseWidth = 800
      const scaleFactor = Math.min(width / baseWidth, this.scale.gameSize.height / 600)
      const volumeBarWidth = 300 * scaleFactor
      const barStartX = width / 2 - volumeBarWidth / 2
      const barEndX = width / 2 + volumeBarWidth / 2
      this.volumeHandle!.x = Phaser.Math.Clamp(dragX, barStartX, barEndX)
      const volume = (this.volumeHandle!.x - barStartX) / volumeBarWidth
      this.sound.volume = volume
    })
    this.toggleMinimapButton = this.add
      .text(0, 0, '', {
        // Initial text will be set by updateText()
        fontSize: '1px',
        color: '#00FFFF',
        backgroundColor: '#8A2BE2',
        padding: { x: 1, y: 1 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        // MODIFIED: Use parentLevelScene instead of directly getting Level1Scene
        this.parentLevelScene?.toggleMiniMap()
        this.updateText() // Update text after toggling minimap
      })
      .on('pointerover', () => this.toggleMinimapButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.toggleMinimapButton?.setStyle({ color: '#00FFFF' }))
    this.backToMenuButton = this.add
      .text(0, 0, '', {
        // Initial text will be set by updateText()
        fontSize: '1px',
        color: '#00FFFF',
        backgroundColor: '#8A2BE2',
        padding: { x: 1, y: 1 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', this.backToMainMenu, this)
      .on('pointerover', () => this.backToMenuButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.backToMenuButton?.setStyle({ color: '#00FFFF' }))
    this.updateText() // Initial text update
    this.handleResize(this.scale.gameSize)

    // --- Keyboard listener to resume the game ---
    this.input.keyboard?.on('keydown-P', this.resumeGame, this)
    // Enable resuming the game with ESC key
    this.input.keyboard?.on('keydown-ESC', this.resumeGame, this)

    // --- Clean up listeners and objects on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this) // Remove resize listener
      localizationManager.removeChangeListener(this.localizationUpdateCallback) // MODIFIED: USE BOUND CALLBACK
      this.input.keyboard?.off('keydown-P', this.resumeGame, this)
      this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)
      this.input.off('drag') // Clean up drag listener

      // Destroy game objects and nullify references
      this.backgroundRect?.destroy()
      this.pausedText?.destroy()
      this.resumeButton?.destroy()
      this.backToMenuButton?.destroy()
      this.volumeLabel?.destroy()
      this.volumeBar?.destroy()
      this.volumeHandle?.destroy()
      this.toggleMinimapButton?.destroy()

      this.backgroundRect = undefined
      this.pausedText = undefined
      this.resumeButton = undefined
      this.backToMenuButton = undefined
      this.volumeLabel = undefined
      this.volumeBar = undefined
      this.volumeHandle = undefined
      this.toggleMinimapButton = undefined
      this.parentLevelScene = undefined // ADDED: NULLIFY REFERENCE
    })
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    const pauseStrings = localizationManager.getStrings().pause
    const commonStrings = localizationManager.getStrings().common // ADDED: Get common strings

    // --- Create a semi-transparent background overlay ---
    if (!this.backgroundRect) {
      this.backgroundRect = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setOrigin(0.5)
    }
    this.backgroundRect.setSize(width, height).setPosition(width / 2, height / 2)

    // --- "Paused" Text ---
    const pausedFontSize = Math.max(48, 96 * scaleFactor)
    if (!this.pausedText) {
      this.pausedText = this.add
        .text(width / 2, height * 0.2, pauseStrings.title, {
          fontFamily: 'Staatliches',
          fontSize: `${pausedFontSize}px`,
          color: '#FFD700', // Gold
          stroke: '#8A2BE2', // Blue Violet
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    }
    this.pausedText.setFontSize(`${pausedFontSize}px`)
    this.pausedText.setStroke('#8A2BE2', 6 * scaleFactor)
    this.pausedText.setPosition(width / 2, height * 0.2)
    this.pausedText.setText(pauseStrings.title) // Update text on resize

    // --- UI Elements Styling ---
    const buttonFontSize = Math.max(20, 28 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor
    const buttonStyle = {
      fontSize: `${buttonFontSize}px`,
      color: '#00FFFF', // Cyan
      backgroundColor: '#8A2BE2', // Blue Violet
      padding: { x: buttonPaddingX, y: buttonPaddingY },
    }
    const labelFontSize = Math.max(18, 24 * scaleFactor)
    const labelStyle = {
      fontSize: `${labelFontSize}px`,
      color: '#FFFFFF',
    }

    // --- Resume Button ---
    if (!this.resumeButton) {
      this.resumeButton = this.add
        .text(width / 2, height * 0.4, pauseStrings.resume, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', this.resumeGame, this)
        .on('pointerover', () => this.resumeButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.resumeButton?.setStyle({ color: '#00FFFF' }))
    }
    this.resumeButton.setPosition(width / 2, height * 0.4).setStyle(buttonStyle)
    this.resumeButton.setText(pauseStrings.resume) // Update text on resize

    // --- Volume Control ---
    const volumeBarWidth = 300 * scaleFactor
    const volumeBarHeight = 20 * scaleFactor
    const volumeYPos = height * 0.55

    if (!this.volumeLabel) {
      this.volumeLabel = this.add
        .text(width / 2, volumeYPos - 30 * scaleFactor, pauseStrings.volume, labelStyle)
        .setOrigin(0.5)
    }
    this.volumeLabel.setPosition(width / 2, volumeYPos - 30 * scaleFactor).setStyle(labelStyle)
    this.volumeLabel.setText(pauseStrings.volume)

    if (!this.volumeBar) {
      this.volumeBar = this.add.graphics()
    }
    this.volumeBar.clear()
    this.volumeBar.fillStyle(0x555555)
    this.volumeBar.fillRect(
      width / 2 - volumeBarWidth / 2,
      volumeYPos - volumeBarHeight / 2,
      volumeBarWidth,
      volumeBarHeight,
    )

    const handleSize = 30 * scaleFactor
    const handleX = width / 2 - volumeBarWidth / 2 + this.sound.volume * volumeBarWidth

    if (!this.volumeHandle) {
      this.volumeHandle = this.add
        .rectangle(handleX, volumeYPos, handleSize, handleSize, 0xffffff)
        .setInteractive({ draggable: true })

      this.input.on('drag', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
        if (gameObject !== this.volumeHandle) return

        const barStartX = width / 2 - volumeBarWidth / 2
        const barEndX = width / 2 + volumeBarWidth / 2
        this.volumeHandle!.x = Phaser.Math.Clamp(dragX, barStartX, barEndX)

        const volume = (this.volumeHandle!.x - barStartX) / volumeBarWidth
        this.sound.volume = volume
      })
    }
    this.volumeHandle.setPosition(handleX, volumeYPos).setSize(handleSize, handleSize)

    // --- Toggle Minimap Button ---
    // MODIFIED: Use parentLevelScene instead of directly getting Level1Scene
    const levelScene = this.parentLevelScene
    const minimapButtonYPos = height * 0.7

    if (!this.toggleMinimapButton) {
      // MODIFIED: Use commonStrings for minimap text
      const minimapState = levelScene?.isMiniMapVisible ? commonStrings.minimapState.on : commonStrings.minimapState.off
      const initialText = `${commonStrings.toggleMinimap} ${minimapState}`
      this.toggleMinimapButton = this.add
        .text(width / 2, minimapButtonYPos, initialText, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
          levelScene?.toggleMiniMap() // MODIFIED: Use levelScene
          this.updateText() // Update text after toggling minimap
        })
        .on('pointerover', () => this.toggleMinimapButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.toggleMinimapButton?.setStyle({ color: '#00FFFF' }))
    }
    // MODIFIED: Use commonStrings for minimap text
    const minimapState = levelScene?.isMiniMapVisible ? commonStrings.minimapState.on : commonStrings.minimapState.off
    this.toggleMinimapButton.setText(`${commonStrings.toggleMinimap} ${minimapState}`)
    this.toggleMinimapButton.setPosition(width / 2, minimapButtonYPos).setStyle(buttonStyle)

    // --- Back to Main Menu Button ---
    const backButtonYPos = height * 0.85

    if (!this.backToMenuButton) {
      this.backToMenuButton = this.add
        .text(width / 2, backButtonYPos, pauseStrings.backToMenu, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', this.backToMainMenu, this)
        .on('pointerover', () => this.backToMenuButton?.setStyle({ color: '#FFD700' })) // Gold
        .on('pointerout', () => this.backToMenuButton?.setStyle({ color: '#00FFFF' }))
    }
    this.backToMenuButton.setPosition(width / 2, backButtonYPos).setStyle(buttonStyle)
    this.backToMenuButton.setText(pauseStrings.backToMenu)
  }

  /**
   * Updates all text elements in the scene based on the current language.
   * This method is called when the language changes via LocalizationManager.
   */
  private updateText(): void {
    const pauseStrings = localizationManager.getStrings().pause
    const commonStrings = localizationManager.getStrings().common // ADDED: Get common strings

    this.pausedText?.setText(pauseStrings.title)
    this.resumeButton?.setText(pauseStrings.resume)
    this.volumeLabel?.setText(pauseStrings.volume)
    this.backToMenuButton?.setText(pauseStrings.backToMenu)

    // MODIFIED: Use parentLevelScene instead of directly getting Level1Scene
    const levelScene = this.parentLevelScene
    if (levelScene) {
      // MODIFIED: Use commonStrings for minimap text
      const minimapState = levelScene.isMiniMapVisible ? commonStrings.minimapState.on : commonStrings.minimapState.off
      this.toggleMinimapButton?.setText(`${commonStrings.toggleMinimap} ${minimapState}`)
    }
  }

  private resumeGame(): void {
    // --- Clean up listeners to prevent multiple triggers ---
    this.input.keyboard?.off('keydown-P', this.resumeGame, this)
    this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.input.off('drag') // Clean up drag listener

    // MODIFIED: Use parentLevelScene instead of directly getting Level1Scene
    const levelScene = this.parentLevelScene

    if (levelScene) {
      // Temporarily disable keyboard input in LevelScene
      // This prevents the 'P' or 'ESC' key, if still held down, from immediately re-pausing the game.
      if (levelScene.input.keyboard) {
        levelScene.input.keyboard.enabled = false
      }

      // Resume the main game scene
      this.scene.resume(levelScene.scene.key) // MODIFIED: Resume the parent scene's key

      // Re-enable keyboard input in LevelScene after a short delay (e.g., 200ms)
      // This gives the user time to release the pause key.
      this.time.delayedCall(
        200,
        () => {
          if (levelScene.input.keyboard) {
            levelScene.input.keyboard.enabled = true
          }
        },
        [],
        this,
      )
    } else {
      console.error(`Parent Level scene not found. Cannot resume game.`)
    }

    // Stop this pause scene
    this.scene.stop(SCENE_KEYS.PAUSE)
  }

  private backToMainMenu(): void {
    // Clean up listeners
    this.input.keyboard?.off('keydown-P', this.resumeGame, this)
    this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.input.off('drag') // Clean up drag listener

    // MODIFIED: Stop the parent scene if it exists
    if (this.parentLevelScene && this.scene.manager.keys[this.parentLevelScene.scene.key]) {
      this.scene.stop(this.parentLevelScene.scene.key)
    }
    this.scene.stop(SCENE_KEYS.PAUSE)
    // Transition back to the main menu scene
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }
}

export default PauseScene