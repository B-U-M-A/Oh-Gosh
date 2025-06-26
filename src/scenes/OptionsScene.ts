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
  private titleText!: Phaser.GameObjects.Text
  private languageLabel!: Phaser.GameObjects.Text
  private englishButton!: Phaser.GameObjects.Text
  private spanishButton!: Phaser.GameObjects.Text
  private portugueseButton!: Phaser.GameObjects.Text
  private volumeLabel!: Phaser.GameObjects.Text
  private volumeBar!: Phaser.GameObjects.Graphics
  private volumeHandle!: Phaser.GameObjects.Rectangle
  private toggleMinimapButton!: Phaser.GameObjects.Text
  private backButton!: Phaser.GameObjects.Text

  private boundCallbacks: {
    setEnglish: () => void
    setSpanish: () => void
    setPortuguese: () => void
    toggleMinimap: () => void
    backToMainMenu: () => void
  }

  private localizationUpdateCallback: () => void

  constructor() {
    super({ key: SCENE_KEYS.OPTIONS })
    this.localizationUpdateCallback = () => this.updateText()
    this.boundCallbacks = {
      setEnglish: () => this.setLanguage('en'),
      setSpanish: () => this.setLanguage('es'),
      setPortuguese: () => this.setLanguage('pt'),
      toggleMinimap: this.toggleMinimap.bind(this),
      backToMainMenu: this.backToMainMenu.bind(this),
    }
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
  private onWake(): void {
    // Reset input state
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }

    // Set black background for the options screen
    this.cameras.main.setBackgroundColor('#000000')

    // Clear existing UI elements if any
    this.clearUIElements()

    // Initialize all UI elements
    this.createUIElements()

    // Set initial text values
    this.updateText()

    // Listen for language changes to update UI text
    localizationManager.addChangeListener(this.localizationUpdateCallback)

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    this.handleResize(this.scale.gameSize) // Initial layout

    // Make sure scene is visible
    this.scene.setVisible(true)

    // Set up volume drag handler
    const onDrag = (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
      if (gameObject === this.volumeHandle) {
        const { width } = this.scale.gameSize
        const volumeBarWidth = 300 * Math.min(width / 800, this.scale.gameSize.height / 600)
        const barStartX = width / 2 - volumeBarWidth / 2
        const barEndX = width / 2 + volumeBarWidth / 2
        this.volumeHandle.x = Phaser.Math.Clamp(dragX, barStartX, barEndX)
        this.sound.volume = (this.volumeHandle.x - barStartX) / volumeBarWidth
      }
    }

    this.input.off('drag') // Clear any existing drag handlers
    this.input.on('drag', onDrag)

    // Store drag handler for cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('drag', onDrag)
    })
  }

  create(): void {
    this.onWake()

    // Listen for wake events to reinitialize the scene
    this.events.on(Phaser.Scenes.Events.WAKE, this.onWake, this)

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Remove all listeners first
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(this.localizationUpdateCallback)
      this.events.off(Phaser.Scenes.Events.WAKE, this.onWake, this)

      // Clean up input
      if (this.input) {
        this.input.off('drag')
      }

      // Explicitly destroy all GameObjects
      this.titleText?.destroy()
      this.englishButton?.destroy()
      this.spanishButton?.destroy()
      this.portugueseButton?.destroy()
      this.volumeLabel?.destroy()
      this.volumeBar?.destroy()
      this.volumeHandle?.destroy()
      this.toggleMinimapButton?.destroy()
      this.backButton?.destroy()

      // Nullify references
      this.titleText = null!
      this.englishButton = null!
      this.spanishButton = null!
      this.portugueseButton = null!
      this.volumeLabel = null!
      this.volumeBar = null!
      this.volumeHandle = null!
      this.toggleMinimapButton = null!
      this.backButton = null!
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
      const setEnglishBound = () => this.setLanguage('en')
      this.englishButton = this.add
        .text(width / 2 - langButtonWidth - langButtonSpacing, currentY, 'English', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', setEnglishBound)
        .on('pointerover', () => this.englishButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.englishButton?.setStyle({ color: '#00FFFF' }))

      this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.englishButton?.off('pointerdown', setEnglishBound)
      })
    } else {
      this.englishButton.setPosition(width / 2 - langButtonWidth - langButtonSpacing, currentY).setStyle(buttonStyle)
    }

    // Spanish Button
    if (!this.spanishButton) {
      const setSpanishBound = () => this.setLanguage('es')
      this.spanishButton = this.add
        .text(width / 2, currentY, 'Español', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', setSpanishBound)
        .on('pointerover', () => this.spanishButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.spanishButton?.setStyle({ color: '#00FFFF' }))

      this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.spanishButton?.off('pointerdown', setSpanishBound)
      })
    } else {
      this.spanishButton.setPosition(width / 2, currentY).setStyle(buttonStyle)
    }

    // Portuguese Button
    if (!this.portugueseButton) {
      const setPortugueseBound = () => this.setLanguage('pt')
      this.portugueseButton = this.add
        .text(width / 2 + langButtonWidth + langButtonSpacing, currentY, 'Português', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', setPortugueseBound)
        .on('pointerover', () => this.portugueseButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.portugueseButton?.setStyle({ color: '#00FFFF' }))

      this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.portugueseButton?.off('pointerdown', setPortugueseBound)
      })
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
        .setInteractive({ draggable: true, useHandCursor: true })

      const onDrag = (_: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
        if (!this.volumeHandle || gameObject !== this.volumeHandle) return

        const barStartX = width / 2 - volumeBarWidth / 2
        const barEndX = width / 2 + volumeBarWidth / 2
        this.volumeHandle.x = Phaser.Math.Clamp(dragX, barStartX, barEndX)

        const volume = (this.volumeHandle.x - barStartX) / volumeBarWidth
        this.sound.volume = volume
      }

      this.input.on('drag', onDrag)

      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.off('drag', onDrag)
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
      this.toggleMinimapButton = this.add.text(width / 2, currentY, initialText, buttonStyle).setOrigin(0.5)
      const toggleMinimapBound = this.toggleMinimap.bind(this)
      this.toggleMinimapButton = this.add
        .text(width / 2, currentY, initialText, buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', toggleMinimapBound)

      this.events
        .once(Phaser.Scenes.Events.SHUTDOWN, () => {
          this.toggleMinimapButton?.off('pointerdown', toggleMinimapBound)
        })
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
      const backToMainMenuBound = this.backToMainMenu.bind(this)
      this.backButton = this.add
        .text(width / 2, height - 50 * scaleFactor, commonStrings.backButton, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', backToMainMenuBound)
        .on('pointerover', () => this.backButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.backButton?.setStyle({ color: '#00FFFF' }))

      this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.backButton?.off('pointerdown', backToMainMenuBound)
      })
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
      // REMOVED: Explicitly remove pointerdown listener before disabling interactivity
      // REMOVED: this.toggleMinimapButton?.off('pointerdown', this.toggleMinimap, this)
      // REMOVED: this.toggleMinimapButton?.disableInteractive()

      activeLevelScene.toggleMiniMap()
      // The updateText() call below will trigger handleResize(), which correctly
      // updates the button's text and manages its interactivity state.
      this.updateText()

      // REMOVED: Re-add pointerdown listener after re-enabling interactivity
      // REMOVED: this.toggleMinimapButton?.setInteractive(true)
      // REMOVED: this.toggleMinimapButton?.on('pointerdown', this.toggleMinimap, this)
    } else {
      console.warn('No active LevelScene found. Cannot toggle minimap.')
    }
  }

  /**
   * Stops the current scene and returns to the MainMenuScene.
   */
  private clearUIElements(): void {
    // Remove all existing interactive elements
    this.englishButton?.removeInteractive()
    this.spanishButton?.removeInteractive()
    this.portugueseButton?.removeInteractive()
    this.volumeHandle?.removeInteractive()
    this.toggleMinimapButton?.removeInteractive()
    this.backButton?.removeInteractive()

    // Remove all event listeners
    this.englishButton?.off('pointerdown')
    this.spanishButton?.off('pointerdown')
    this.portugueseButton?.off('pointerdown')
    this.toggleMinimapButton?.off('pointerdown')
    this.backButton?.off('pointerdown')
  }

  private createUIElements(): void {
    const { width, height } = this.scale.gameSize
    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // Create all UI elements upfront with default positions
    const buttonStyle = {
      fontSize: `${Math.max(20, 28 * scaleFactor)}px`,
      color: '#00FFFF',
      backgroundColor: '#8A2BE2',
      padding: { x: 20 * scaleFactor, y: 10 * scaleFactor },
    }

    // Title
    this.titleText = this.add
      .text(width / 2, height * 0.15, '', {
        fontFamily: 'Staatliches',
        fontSize: `${Math.max(48, 96 * scaleFactor)}px`,
        color: '#FFD700',
        stroke: '#8A2BE2',
        strokeThickness: 6 * scaleFactor,
      })
      .setOrigin(0.5)

    // Language selection
    this.languageLabel = this.add
      .text(width / 2, height * 0.3, '', {
        fontSize: `${Math.max(18, 24 * scaleFactor)}px`,
        color: '#FFFFFF',
      })
      .setOrigin(0.5)

    const langButtonWidth = 120 * scaleFactor
    const langButtonSpacing = 20 * scaleFactor
    const langY = height * 0.35

    // Create buttons with full interactivity setup
    this.englishButton = this.add
      .text(width / 2 - langButtonWidth - langButtonSpacing, langY, 'English', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.boundCallbacks.setEnglish)
      .on('pointerover', () => this.englishButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.englishButton?.setStyle({ color: '#00FFFF' }))

    this.spanishButton = this.add
      .text(width / 2, langY, 'Español', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.boundCallbacks.setSpanish)
      .on('pointerover', () => this.spanishButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.spanishButton?.setStyle({ color: '#00FFFF' }))

    this.portugueseButton = this.add
      .text(width / 2 + langButtonWidth + langButtonSpacing, langY, 'Português', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.boundCallbacks.setPortuguese)
      .on('pointerover', () => this.portugueseButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.portugueseButton?.setStyle({ color: '#00FFFF' }))

    // Volume control
    this.volumeLabel = this.add
      .text(width / 2, height * 0.45, '', {
        fontSize: `${Math.max(18, 24 * scaleFactor)}px`,
        color: '#FFFFFF',
      })
      .setOrigin(0.5)

    this.volumeBar = this.add.graphics()
    this.volumeHandle = this.add
      .rectangle(width / 2, height * 0.5, 30 * scaleFactor, 30 * scaleFactor, 0xffffff)
      .setInteractive({ draggable: true, useHandCursor: true })

    // Minimap toggle
    this.toggleMinimapButton = this.add
      .text(width / 2, height * 0.6, '', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.boundCallbacks.toggleMinimap)
      .on('pointerover', () => this.toggleMinimapButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.toggleMinimapButton?.setStyle({ color: '#00FFFF' }))

    // Back button
    this.backButton = this.add
      .text(width / 2, height - 50 * scaleFactor, '', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.boundCallbacks.backToMainMenu)
      .on('pointerover', () => this.backButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.backButton?.setStyle({ color: '#00FFFF' }))
  }

  private updateUI(): void {
    const { width, height } = this.scale.gameSize
    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // Update positions and styles of existing elements
    this.titleText
      .setPosition(width / 2, height * 0.15)
      .setFontSize(`${Math.max(48, 96 * scaleFactor)}px`)
      .setStroke('#8A2BE2', 6 * scaleFactor)

    // Update all other UI elements similarly...
  }

  private backToMainMenu(): void {
    // Clean up our own interactive elements
    this.englishButton.removeInteractive()
    this.spanishButton.removeInteractive()
    this.portugueseButton.removeInteractive()
    this.volumeHandle.removeInteractive()
    this.toggleMinimapButton.removeInteractive()
    this.backButton.removeInteractive()

    // Remove our own input listeners
    this.input.off('drag')

    // Resume and bring MainMenu to front
    this.scene.switch(SCENE_KEYS.MAIN_MENU)
    // Set visibility before stopping
    this.scene.setVisible(false)
    this.scene.stop()
  }
}

export default OptionsScene
