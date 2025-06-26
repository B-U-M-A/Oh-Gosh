// src/scenes/CreditsScene.ts

import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'
// REMOVED: import localization from '../localization/en'
import { localizationManager } from '../localization/LocalizationManager' // ADDED IMPORT

/**
 * The CreditsScene displays game credits including developers, artists, and game purpose.
 * It provides a way to return to the main menu via button click or ESC key.
 */
class CreditsScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text
  private purposeText?: Phaser.GameObjects.Text
  private developersTitle?: Phaser.GameObjects.Text
  private developersText?: Phaser.GameObjects.Text
  private artistsTitle?: Phaser.GameObjects.Text
  private artistsText?: Phaser.GameObjects.Text
  private backButton?: Phaser.GameObjects.Text

  // ADDED PROPERTY: Bound callback for localization changes
  private localizationUpdateCallback: () => void

  constructor() {
    super({ key: SCENE_KEYS.CREDITS })
    // ADDED: Bind the updateText method to this instance for use as a callback
    this.localizationUpdateCallback = () => this.updateText()
  }

  /**
   * Creates and sets up all UI elements for the credits scene including:
   * - Title and purpose text
   * - Developer and artist credits
   * - Interactive back button
   * - ESC key listener for returning to main menu
   */
  create(): void {
    this.cameras.main.setBackgroundColor('#000000')
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
    // ADDED: Listen for language changes to update UI text
    localizationManager.addChangeListener(this.localizationUpdateCallback)
    this.handleResize(this.scale.gameSize)
    this.updateText() // ADDED: Initial text update

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      // ADDED: Remove language change listener
      localizationManager.removeChangeListener(this.localizationUpdateCallback)
      this.titleText = undefined
      this.purposeText = undefined
      this.developersTitle = undefined
      this.developersText = undefined
      this.artistsTitle = undefined
      this.artistsText = undefined
      this.backButton = undefined
    })
  }

  // ADDED METHOD: Updates all text elements in the scene based on the current language.
  private updateText(): void {
    const creditsStrings = localizationManager.getStrings().credits
    const commonStrings = localizationManager.getStrings().common

    this.titleText?.setText(creditsStrings.title)
    this.purposeText?.setText(creditsStrings.purpose)
    this.developersTitle?.setText(creditsStrings.developersTitle)
    this.developersText?.setText(creditsStrings.developers)
    this.artistsTitle?.setText(creditsStrings.artistsTitle)
    this.artistsText?.setText(creditsStrings.artists)
    this.backButton?.setText(commonStrings.backButton) // MODIFIED: Use common string
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize
    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    const creditsStrings = localizationManager.getStrings().credits // MODIFIED: Get strings here
    const commonStrings = localizationManager.getStrings().common // ADDED: Get common strings here

    // Title
    const titleFontSize = Math.max(32, 48 * scaleFactor * 1.2)
    if (!this.titleText) {
      // Add the credits title with styled text
      this.titleText = this.add
        .text(width / 2, 50 * scaleFactor, creditsStrings.title, {
          // MODIFIED: Use creditsStrings
          fontSize: titleFontSize + 'px',
          color: '#FF69B4',
          align: 'center',
          stroke: '#FFFF00',
          strokeThickness: 6 * scaleFactor,
          shadow: {
            offsetX: 3 * scaleFactor,
            offsetY: 3 * scaleFactor,
            color: '#000000',
            blur: 6 * scaleFactor,
            fill: true,
          },
        })
        .setOrigin(0.5)
    } else {
      this.titleText.setFontSize(titleFontSize + 'px')
      this.titleText.setStroke('#FFFF00', 6 * scaleFactor)
      this.titleText.setShadow(3 * scaleFactor, 3 * scaleFactor, '#000000', 6 * scaleFactor, true, false)
      this.titleText.setPosition(width / 2, 50 * scaleFactor)
      this.titleText.setText(creditsStrings.title) // ADDED: Update text on resize
    }

    // Game Purpose Summary
    const purposeFontSize = Math.max(16, 20 * scaleFactor)
    if (!this.purposeText) {
      // Add the game purpose description text
      this.purposeText = this.add
        .text(width / 2, 150 * scaleFactor, creditsStrings.purpose, {
          // MODIFIED: Use creditsStrings
          fontSize: purposeFontSize + 'px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: width - 100 * scaleFactor, useAdvancedWrap: true },
        })
        .setOrigin(0.5)
    } else {
      this.purposeText.setFontSize(purposeFontSize + 'px')
      this.purposeText.setWordWrapWidth(width - 100 * scaleFactor, true)
      this.purposeText.setPosition(width / 2, 150 * scaleFactor)
      this.purposeText.setText(creditsStrings.purpose) // ADDED: Update text on resize
    }

    // Developers Section
    const sectionTitleFontSize = Math.max(24, 32 * scaleFactor)
    const sectionTextFontSize = Math.max(18, 24 * scaleFactor)

    if (!this.developersTitle) {
      // Add the developers section title
      this.developersTitle = this.add
        .text(width / 2, height / 2 + 100 * scaleFactor, creditsStrings.developersTitle, {
          // MODIFIED: Use creditsStrings
          fontSize: sectionTitleFontSize + 'px',
          color: '#00FFFF',
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.developersTitle.setFontSize(sectionTitleFontSize + 'px')
      this.developersTitle.setPosition(width / 2, height / 2 + 100 * scaleFactor)
      this.developersTitle.setText(creditsStrings.developersTitle) // ADDED: Update text on resize
    }

    if (!this.developersText) {
      // Add the developers list text
      this.developersText = this.add
        .text(width / 2, height / 2 + 150 * scaleFactor, creditsStrings.developers, {
          // MODIFIED: Use creditsStrings
          fontSize: sectionTextFontSize + 'px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.developersText.setFontSize(sectionTextFontSize + 'px')
      this.developersText.setPosition(width / 2, height / 2 + 150 * scaleFactor)
      this.developersText.setText(creditsStrings.developers) // ADDED: Update text on resize
    }

    // Artists Section
    if (!this.artistsTitle) {
      // Add the artists section title
      this.artistsTitle = this.add
        .text(width / 2, height / 2 + 250 * scaleFactor, creditsStrings.artistsTitle, {
          // MODIFIED: Use creditsStrings
          fontSize: sectionTitleFontSize + 'px',
          color: '#00FFFF',
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.artistsTitle.setFontSize(sectionTitleFontSize + 'px')
      this.artistsTitle.setPosition(width / 2, height / 2 + 250 * scaleFactor)
      this.artistsTitle.setText(creditsStrings.artistsTitle) // ADDED: Update text on resize
    }

    if (!this.artistsText) {
      // Add the artists list text
      this.artistsText = this.add
        .text(width / 2, height / 2 + 300 * scaleFactor, creditsStrings.artists, {
          // MODIFIED: Use creditsStrings
          fontSize: sectionTextFontSize + 'px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.artistsText.setFontSize(sectionTextFontSize + 'px')
      this.artistsText.setPosition(width / 2, height / 2 + 300 * scaleFactor)
      this.artistsText.setText(creditsStrings.artists) // ADDED: Update text on resize
    }

    // Back Button
    const buttonFontSize = Math.max(20, 28 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor

    const buttonStyle = {
      fontSize: buttonFontSize + 'px',
      color: '#00FFFF',
      backgroundColor: '#8A2BE2',
      padding: { x: buttonPaddingX, y: buttonPaddingY },
    }

    if (!this.backButton) {
      // Add interactive back button that returns to main menu when clicked
      this.backButton = this.add
        .text(width / 2, height - 50 * scaleFactor, commonStrings.backButton, buttonStyle) // MODIFIED: Use commonStrings.backButton
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU)) // Transition back to main menu on click
        .on('pointerover', () => this.backButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.backButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.backButton.setPosition(width / 2, height - 50 * scaleFactor).setStyle(buttonStyle)
      this.backButton.setText(commonStrings.backButton) // ADDED: Update text on resize
    }
  }
}

export default CreditsScene
