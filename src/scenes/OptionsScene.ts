// src/scenes/OptionsScene.ts

import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
// Import LevelScene base class for type safety
import { LevelScene } from './LevelScene' // ADDED/MODIFIED IMPORT

/**
 * OptionsScene handles the game's settings and configuration screen.
 * Allows players to adjust:
 * - Language selection (English, Spanish, Portuguese)
 * - Audio volume level
 * - Minimap visibility toggle
 * Provides UI controls for these settings and handles their persistence.
 */
class OptionsScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text
  private languageLabel?: Phaser.GameObjects.Text
  private englishButton?: Phaser.GameObjects.Text
  private spanishButton?: Phaser.GameObjects.Text
  private volumeLabel?: Phaser.GameObjects.Text
  private volumeBar?: Phaser.GameObjects.Graphics
  private volumeHandle?: Phaser.GameObjects.Rectangle
  private toggleMinimapButton?: Phaser.GameObjects.Text
  private backButton?: Phaser.GameObjects.Text
  private portugueseButton?: Phaser.GameObjects.Text

  // ADDED PROPERTY: Bound callback for localization changes
  private localizationUpdateCallback: () => void

  constructor() {
    super({ key: SCENE_KEYS.OPTIONS })
    // Bind the updateText method to this instance for use as a callback
    this.localizationUpdateCallback = () => this.updateText()
  }

  /**
   * Creates and sets up all UI elements for the options screen.
   * Initializes:
   * - Title text
   * - Language selection buttons
   * - Volume control slider
   * - Minimap toggle button
   * - Back to menu button
   * Also sets up event listeners for:
   * - Language changes
   * - Window resizing
   * - Input controls
   */
  create(): void {
    // Set black background for the options screen
    this.cameras.main.setBackgroundColor('#000000')

    // Listen for language changes to update UI text
    localizationManager.addChangeListener(this.localizationUpdateCallback) // MODIFIED: USE BOUND CALLBACK

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.handleResize(this.scale.gameSize) // Initial layout

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(this.localizationUpdateCallback) // MODIFIED: USE BOUND CALLBACK
      if (this.input) {
        this.input.off('drag') // Clean up drag listener for volume handle
      }

      // Nullify references to allow garbage collection
      this.titleText = undefined
      this.languageLabel = undefined
      this.englishButton = undefined
      this.spanishButton = undefined
      this.volumeLabel = undefined
      this.volumeBar = undefined
      this.volumeHandle = undefined
      this.toggleMinimapButton = undefined
      this.backButton = undefined
      this.portugueseButton = undefined
    })
  }

  /**
   * Helper method to find the currently active LevelScene instance.
   * This is necessary because OptionsScene is launched from MainMenuScene,
   * not directly from a LevelScene.
   */
  private getActiveLevelScene(): LevelScene | undefined {
    // Iterate through all active scenes in the game
    for (const scene of this.scene.manager.scenes) {
      // Check if the scene is an instance of LevelScene and is currently active
      // We check for LevelScene specifically because it has the toggleMiniMap method.
      if (scene instanceof LevelScene && scene.scene.isActive()) {
        return scene
      }
    }
    return undefined
  }

  /**
   * Updates all text elements in the scene based on the current language.
   * This method is called when the language changes via LocalizationManager.
   */
  private updateText(): void {
    const optionsStrings = localizationManager.getStrings().options
    const commonStrings = localizationManager.getStrings().common // ADDED: Get common strings

    this.titleText?.setText(optionsStrings.title)
    this.languageLabel?.setText(optionsStrings.language)
    this.volumeLabel?.setText(optionsStrings.volume)
    // MODIFIED: Use common.backButton
    this.backButton?.setText(commonStrings.backButton)

    // Update minimap button text based on current state and new language string
    // MODIFIED: Use getActiveLevelScene()
    const activeLevelScene = this.getActiveLevelScene()
    const minimapState = activeLevelScene?.isMiniMapVisible
      ? commonStrings.minimapState.on // MODIFIED: Use common localization
      : commonStrings.minimapState.off // MODIFIED: Use common localization
    this.toggleMinimapButton?.setText(`${commonStrings.toggleMinimap} ${minimapState}`) // MODIFIED: Use common localization

    // Re-apply styles and positions to ensure padding/font size are correct after text change
    this.handleResize(this.scale.gameSize)
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    const optionsStrings = localizationManager.getStrings().options
    const commonStrings = localizationManager.getStrings().common // ADDED: Get common strings

    // --- Title ---
    const titleFontSize = Math.max(48, 96 * scaleFactor)
    if (!this.titleText) {
      // Add the options title text with gold color and blue violet outline
      this.titleText = this.add
        .text(width / 2, height * 0.15, optionsStrings.title, {
          fontFamily: 'Staatliches',
          fontSize: `${titleFontSize}px`,
          color: '#FFD700', // Gold
          stroke: '#8A2BE2', // Blue Violet
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    } else {
      this.titleText.setFontSize(`${titleFontSize}px`)
      this.titleText.setStroke('#8A2BE2', 6 * scaleFactor)
      this.titleText.setPosition(width / 2, height * 0.15)
      this.titleText.setText(optionsStrings.title) // Update text on resize
    }

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

    let currentY = height * 0.3

    // --- Language Selection ---
    if (!this.languageLabel) {
      // Add "Language" label above the language selection buttons
      this.languageLabel = this.add.text(width / 2, currentY, optionsStrings.language, labelStyle).setOrigin(0.5)
    } else {
      this.languageLabel.setPosition(width / 2, currentY).setStyle(labelStyle)
      this.languageLabel.setText(optionsStrings.language) // Update text on resize
    }
    currentY += 40 * scaleFactor

    const langButtonWidth = 120 * scaleFactor
    const langButtonSpacing = 20 * scaleFactor

    // English Button
    if (!this.englishButton) {
      // Add English language button and make it interactive
      this.englishButton = this.add
        .text(width / 2 - langButtonWidth - langButtonSpacing, currentY, 'English', buttonStyle)
        .setOrigin(0.5)
        .setInteractive() // Makes the text clickable
        .on('pointerdown', () => this.setLanguage('en'))
        .on('pointerover', () => this.englishButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.englishButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.englishButton.setPosition(width / 2 - langButtonWidth - langButtonSpacing, currentY).setStyle(buttonStyle)
    }

    // Spanish Button
    if (!this.spanishButton) {
      // Add Spanish language button and make it interactive
      this.spanishButton = this.add
        .text(width / 2, currentY, 'Español', buttonStyle)
        .setOrigin(0.5)
        .setInteractive() // Makes the text clickable
        .on('pointerdown', () => this.setLanguage('es'))
        .on('pointerover', () => this.spanishButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.spanishButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.spanishButton.setPosition(width / 2, currentY).setStyle(buttonStyle)
    }

    // Portuguese Button
    if (!this.portugueseButton) {
      // Add Portuguese language button and make it interactive
      this.portugueseButton = this.add
        .text(width / 2 + langButtonWidth + langButtonSpacing, currentY, 'Português', buttonStyle)
        .setOrigin(0.5)
        .setInteractive() // Makes the text clickable
        .on('pointerdown', () => this.setLanguage('pt'))
        .on('pointerover', () => this.portugueseButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.portugueseButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.portugueseButton.setPosition(width / 2 + langButtonWidth + langButtonSpacing, currentY).setStyle(buttonStyle)
    }
    currentY += 80 * scaleFactor

    // --- Volume Control ---
    const volumeBarWidth = 300 * scaleFactor
    const volumeBarHeight = 20 * scaleFactor
    const volumeYPos = currentY

    if (!this.volumeLabel) {
      // Add volume control label (retrieved from localization)
      this.volumeLabel = this.add
        .text(width / 2, volumeYPos - 30 * scaleFactor, optionsStrings.volume, labelStyle)
        .setOrigin(0.5)
    } else {
      this.volumeLabel.setPosition(width / 2, volumeYPos - 30 * scaleFactor).setStyle(labelStyle)
      this.volumeLabel.setText(optionsStrings.volume) // Update text on resize
    }

    if (!this.volumeBar) {
      // Create volume bar background graphics
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
      // Create draggable volume handle (white square)
      this.volumeHandle = this.add
        .rectangle(handleX, volumeYPos, handleSize, handleSize, 0xffffff)
        .setInteractive({ draggable: true }) // Allows dragging to adjust volume

      // Handle volume handle dragging to adjust sound volume
      this.input.on('drag', (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
        if (gameObject !== this.volumeHandle) return

        const barStartX = width / 2 - volumeBarWidth / 2
        const barEndX = width / 2 + volumeBarWidth / 2
        this.volumeHandle!.x = Phaser.Math.Clamp(dragX, barStartX, barEndX)

        const volume = (this.volumeHandle!.x - barStartX) / volumeBarWidth
        this.sound.volume = volume
      })
    } else {
      this.volumeHandle.setPosition(handleX, volumeYPos).setSize(handleSize, handleSize)
    }
    currentY += 80 * scaleFactor

    // --- Toggle Minimap Button ---
    // MODIFIED: Use getActiveLevelScene()
    const activeLevelScene = this.getActiveLevelScene()
    const minimapState = activeLevelScene?.isMiniMapVisible
      ? commonStrings.minimapState.on // MODIFIED: Use common localization
      : commonStrings.minimapState.off // MODIFIED: Use common localization

    if (!this.toggleMinimapButton) {
      // MODIFIED: Use common localization
      const initialText = `${commonStrings.toggleMinimap} ${minimapState}`
      // Add toggle minimap button with current state (on/off)
      this.toggleMinimapButton = this.add
        .text(width / 2, currentY, initialText, buttonStyle)
        .setOrigin(0.5)
        .setInteractive() // Makes the text clickable
        .on('pointerdown', this.toggleMinimap, this)
        .on('pointerover', () => this.toggleMinimapButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.toggleMinimapButton?.setStyle({ color: '#00FFFF' }))
    } else {
      // MODIFIED: Use common localization
      this.toggleMinimapButton.setText(`${commonStrings.toggleMinimap} ${minimapState}`)
      this.toggleMinimapButton.setPosition(width / 2, currentY).setStyle(buttonStyle)
    }
    currentY += 80 * scaleFactor

    // --- Back to Main Menu Button ---
    if (!this.backButton) {
      // Add back button to return to main menu
      this.backButton = this.add
        .text(width / 2, height - 50 * scaleFactor, commonStrings.backButton, buttonStyle) // MODIFIED: Use common.backButton
        .setOrigin(0.5)
        .setInteractive() // Makes the text clickable
        .on('pointerdown', this.backToMainMenu, this)
        .on('pointerover', () => this.backButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.backButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.backButton.setPosition(width / 2, height - 50 * scaleFactor).setStyle(buttonStyle)
      this.backButton.setText(commonStrings.backButton) // Update text on resize
    }
  }

  /**
   * Sets the game language using the LocalizationManager.
   * @param langCode The language code (e.g., 'en', 'es').
   */
  private async setLanguage(langCode: string): Promise<void> {
    const success = await localizationManager.setLanguage(langCode)
    if (success) {
      // The updateText method will be called automatically by the change listener
      console.log(`Language set to: ${langCode}`)
    } else {
      console.warn(`Could not set language to: ${langCode}`)
    }
  }

  /**
   * Toggles the minimap visibility in the active LevelScene and updates the button text.
   */
  private toggleMinimap(): void {
    // MODIFIED: Use getActiveLevelScene()
    const activeLevelScene = this.getActiveLevelScene()
    if (activeLevelScene) {
      activeLevelScene.toggleMiniMap()
      const commonStrings = localizationManager.getStrings().common // ADDED: Get common strings
      const minimapState = activeLevelScene.isMiniMapVisible
        ? commonStrings.minimapState.on // MODIFIED: Use common localization
        : commonStrings.minimapState.off // MODIFIED: Use common localization
      this.toggleMinimapButton?.setText(`${commonStrings.toggleMinimap} ${minimapState}`) // MODIFIED: Use common localization
    } else {
      console.warn('No active LevelScene found. Cannot toggle minimap.')
    }
  }

  /**
   * Stops the current scene and returns to the MainMenuScene.
   */
  private backToMainMenu(): void {
    this.scene.stop(SCENE_KEYS.OPTIONS)
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }
}

export default OptionsScene