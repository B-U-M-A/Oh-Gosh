// src/scenes/OptionsScene.ts

import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
import { LevelScene } from './LevelScene'

/**
 * OptionsScene handles the game's settings and configuration screen.
 * Allows players to adjust:
 * - Language selection (English, Spanish, Portuguese)
 * - Audio volume level
 *
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

  private localizationUpdateCallback: () => void

  constructor() {
    super({ key: SCENE_KEYS.OPTIONS })
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
    localizationManager.addChangeListener(this.localizationUpdateCallback)

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.handleResize(this.scale.gameSize) // Initial layout

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(this.localizationUpdateCallback)
      if (this.input) {
        this.input.off('drag') // Clean up drag listener for volume handle
      }
      // No manual nullification of GameObjects here. Let Phaser handle it.
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
    const commonStrings = localizationManager.getStrings().common

    this.titleText?.setText(optionsStrings.title)
    this.languageLabel?.setText(optionsStrings.language)
    this.volumeLabel?.setText(optionsStrings.volume)
    this.backButton?.setText(commonStrings.backButton)

    // Update minimap button text based on current state and new language string
    const activeLevelScene = this.getActiveLevelScene()
    const minimapState = activeLevelScene?.isMiniMapVisible
      ? commonStrings.minimapState.on
      : commonStrings.minimapState.off
    this.toggleMinimapButton?.setText(
      activeLevelScene ? `${commonStrings.toggleMinimap} ${minimapState}` : `${commonStrings.toggleMinimap} N/A`,
    )

    // Re-apply styles and positions to ensure padding/font size are correct after text change
    this.handleResize(this.scale.gameSize)
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    const optionsStrings = localizationManager.getStrings().options
    const commonStrings = localizationManager.getStrings().common

    // --- Title ---
    const titleFontSize = Math.max(48, 96 * scaleFactor)
    if (!this.titleText) {
      this.titleText = this.add
        .text(width / 2, height * 0.15, optionsStrings.title, {
          fontFamily: 'Staatliches',
          fontSize: `${titleFontSize}px`,
          color: '#FFD700',
          stroke: '#8A2BE2',
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    } else {
      this.titleText.setFontSize(`${titleFontSize}px`)
      this.titleText.setStroke('#8A2BE2', 6 * scaleFactor)
      this.titleText.setPosition(width / 2, height * 0.15)
      this.titleText.setText(optionsStrings.title)
    }

    // --- UI Elements Styling ---
    const buttonFontSize = Math.max(20, 28 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor
    const buttonStyle = {
      fontSize: `${buttonFontSize}px`,
      color: '#00FFFF',
      backgroundColor: '#8A2BE2',
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
      this.languageLabel = this.add.text(width / 2, currentY, optionsStrings.language, labelStyle).setOrigin(0.5)
    } else {
      this.languageLabel.setPosition(width / 2, currentY).setStyle(labelStyle)
      this.languageLabel.setText(optionsStrings.language)
    }
    currentY += 40 * scaleFactor

    const langButtonWidth = 120 * scaleFactor
    const langButtonSpacing = 20 * scaleFactor

    // English Button
    if (!this.englishButton) {
      this.englishButton = this.add
        .text(width / 2 - langButtonWidth - langButtonSpacing, currentY, 'English', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.setLanguage('en'))
        .on('pointerover', () => this.englishButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.englishButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.englishButton.setPosition(width / 2 - langButtonWidth - langButtonSpacing, currentY).setStyle(buttonStyle)
    }

    // Spanish Button
    if (!this.spanishButton) {
      this.spanishButton = this.add
        .text(width / 2, currentY, 'Español', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.setLanguage('es'))
        .on('pointerover', () => this.spanishButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.spanishButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.spanishButton.setPosition(width / 2, currentY).setStyle(buttonStyle)
    }

    // Portuguese Button
    if (!this.portugueseButton) {
      this.portugueseButton = this.add
        .text(width / 2 + langButtonWidth + langButtonSpacing, currentY, 'Português', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
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
      this.volumeLabel = this.add
        .text(width / 2, volumeYPos - 30 * scaleFactor, optionsStrings.volume, labelStyle)
        .setOrigin(0.5)
    } else {
      this.volumeLabel.setPosition(width / 2, volumeYPos - 30 * scaleFactor).setStyle(labelStyle)
      this.volumeLabel.setText(optionsStrings.volume)
    }

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
    } else {
      this.volumeHandle.setPosition(handleX, volumeYPos).setSize(handleSize, handleSize)
    }
    currentY += 80 * scaleFactor

    // --- Toggle Minimap Button ---
    const activeLevelScene = this.getActiveLevelScene()
    const minimapState = activeLevelScene?.isMiniMapVisible
      ? commonStrings.minimapState.on
      : commonStrings.minimapState.off

    if (!this.toggleMinimapButton) {
      const initialText = activeLevelScene
        ? `${commonStrings.toggleMinimap} ${minimapState}`
        : `${commonStrings.toggleMinimap} N/A`
      this.toggleMinimapButton = this.add
        .text(width / 2, currentY, initialText, buttonStyle)
        .setOrigin(0.5)
        .setInteractive(!!activeLevelScene)
        .on('pointerdown', this.toggleMinimap, this)
        .on('pointerover', () => {
          if (this.toggleMinimapButton?.input?.enabled) {
            this.toggleMinimapButton?.setStyle({ color: '#FFD700' })
          }
        })
        .on('pointerout', () => {
          if (this.toggleMinimapButton?.input?.enabled) {
            this.toggleMinimapButton?.setStyle({ color: '#00FFFF' })
          }
        })
    } else {
      this.toggleMinimapButton.setText(
        activeLevelScene ? `${commonStrings.toggleMinimap} ${minimapState}` : `${commonStrings.toggleMinimap} N/A`,
      )
      this.toggleMinimapButton.setPosition(width / 2, currentY).setStyle(buttonStyle)
      this.toggleMinimapButton.setInteractive(!!activeLevelScene)
    }
    currentY += 80 * scaleFactor

    // --- Back to Main Menu Button ---
    if (!this.backButton) {
      this.backButton = this.add
        .text(width / 2, height - 50 * scaleFactor, commonStrings.backButton, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', this.backToMainMenu, this)
        .on('pointerover', () => this.backButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.backButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.backButton.setPosition(width / 2, height - 50 * scaleFactor).setStyle(buttonStyle)
      this.backButton.setText(commonStrings.backButton)
    }
  }

  /**
   * Sets the game language using the LocalizationManager.
   * @param langCode The language code (e.g., 'en', 'es').
   */
  private async setLanguage(langCode: string): Promise<void> {
    const success = await localizationManager.setLanguage(langCode)
    if (success) {
      console.log(`Language set to: ${langCode}`)
    } else {
      console.warn(`Could not set language to: ${langCode}`)
    }
  }

  /**
   * Toggles the minimap visibility in the active LevelScene and updates the button text.
   */
  private toggleMinimap(): void {
    const activeLevelScene = this.getActiveLevelScene()
    if (activeLevelScene) {
      // MODIFIED: Explicitly remove pointerdown listener before disabling interactivity
      this.toggleMinimapButton?.off('pointerdown', this.toggleMinimap, this)
      this.toggleMinimapButton?.disableInteractive()

      activeLevelScene.toggleMiniMap()
      const commonStrings = localizationManager.getStrings().common
      const minimapState = activeLevelScene.isMiniMapVisible
        ? commonStrings.minimapState.on
        : commonStrings.minimapState.off
      this.toggleMinimapButton?.setText(`${commonStrings.toggleMinimap} ${minimapState}`)

      // MODIFIED: Re-add pointerdown listener after re-enabling interactivity
      this.toggleMinimapButton?.setInteractive(true)
      this.toggleMinimapButton?.on('pointerdown', this.toggleMinimap, this)
    } else {
      console.warn('No active LevelScene found. Cannot toggle minimap.')
    }
  }

  /**
   * Stops the current scene and returns to the MainMenuScene.
   */
  private backToMainMenu(): void {
    // MODIFIED: Explicitly remove pointerdown listener before disabling interactivity
    this.backButton?.off('pointerdown', this.backToMainMenu, this)
    this.backButton?.disableInteractive()

    // MODIFIED: Removed delayedCall. The explicit listener removal should be sufficient.
    this.scene.stop(SCENE_KEYS.OPTIONS)
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }
}

export default OptionsScene
