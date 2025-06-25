import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'

class CreditsScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text
  private purposeText?: Phaser.GameObjects.Text
  private developersTitle?: Phaser.GameObjects.Text
  private developersText?: Phaser.GameObjects.Text
  private artistsTitle?: Phaser.GameObjects.Text
  private artistsText?: Phaser.GameObjects.Text
  private backButton?: Phaser.GameObjects.Text

  constructor() {
    super({ key: SCENE_KEYS.CREDITS })
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000') // Black background

    // Add resize event listener
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial layout
    this.handleResize(this.scale.gameSize)
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // Title
    const titleFontSize = Math.max(32, 48 * scaleFactor * 1.2)
    if (!this.titleText) {
      this.titleText = this.add
        .text(width / 2, 50 * scaleFactor, 'Oh Gosh', {
          fontSize: `${titleFontSize}px`,
          color: '#FF69B4', // Hot Pink
          align: 'center',
          stroke: '#FFFF00', // Yellow stroke
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
      this.titleText.setFontSize(`${titleFontSize}px`)
      this.titleText.setStroke('#FFFF00', 6 * scaleFactor)
      this.titleText.setShadow(3 * scaleFactor, 3 * scaleFactor, '#000000', 6 * scaleFactor, true, false)
      this.titleText.setPosition(width / 2, 50 * scaleFactor)
    }

    // Game Purpose Summary
    const purposeFontSize = Math.max(16, 20 * scaleFactor)
    const gamePurposeText = `
Oh Gosh is an arcade-style, single-player, browser-based video game where players control the character "Juan Becerra" with the objective of escaping from multiple pursuing entities referred to as "C"s. Featuring a distinct pixel art aesthetic, the game focuses on evasion and survival, offering an engaging and challenging experience directly within your web browser.
    `
    if (!this.purposeText) {
      this.purposeText = this.add
        .text(width / 2, 150 * scaleFactor, gamePurposeText.trim(), {
          fontSize: `${purposeFontSize}px`,
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: width - 100 * scaleFactor, useAdvancedWrap: true },
        })
        .setOrigin(0.5)
    } else {
      this.purposeText.setFontSize(`${purposeFontSize}px`)
      this.purposeText.setWordWrapWidth(width - 100 * scaleFactor, true)
      this.purposeText.setPosition(width / 2, 150 * scaleFactor)
    }

    // Developers Section
    const sectionTitleFontSize = Math.max(24, 32 * scaleFactor)
    const sectionTextFontSize = Math.max(18, 24 * scaleFactor)

    if (!this.developersTitle) {
      this.developersTitle = this.add
        .text(width / 2, height / 2 + 100 * scaleFactor, 'Developers', {
          fontSize: `${sectionTitleFontSize}px`,
          color: '#00FFFF', // Cyan
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.developersTitle.setFontSize(`${sectionTitleFontSize}px`)
      this.developersTitle.setPosition(width / 2, height / 2 + 100 * scaleFactor)
    }

    if (!this.developersText) {
      this.developersText = this.add
        .text(width / 2, height / 2 + 150 * scaleFactor, 'jspenaq\nElComeBabillas', {
          fontSize: `${sectionTextFontSize}px`,
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.developersText.setFontSize(`${sectionTextFontSize}px`)
      this.developersText.setPosition(width / 2, height / 2 + 150 * scaleFactor)
    }

    // Artists Section
    if (!this.artistsTitle) {
      this.artistsTitle = this.add
        .text(width / 2, height / 2 + 250 * scaleFactor, 'Artists', {
          fontSize: `${sectionTitleFontSize}px`,
          color: '#00FFFF', // Cyan
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.artistsTitle.setFontSize(`${sectionTitleFontSize}px`)
      this.artistsTitle.setPosition(width / 2, height / 2 + 250 * scaleFactor)
    }

    if (!this.artistsText) {
      this.artistsText = this.add
        .text(width / 2, height / 2 + 300 * scaleFactor, 'Elsapateiro', {
          fontSize: `${sectionTextFontSize}px`,
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5)
    } else {
      this.artistsText.setFontSize(`${sectionTextFontSize}px`)
      this.artistsText.setPosition(width / 2, height / 2 + 300 * scaleFactor)
    }

    // Back Button
    const buttonFontSize = Math.max(20, 28 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor

    const buttonStyle = {
      fontSize: `${buttonFontSize}px`,
      color: '#00FFFF', // Cyan
      backgroundColor: '#8A2BE2', // Blue Violet
      padding: { x: buttonPaddingX, y: buttonPaddingY },
    }

    if (!this.backButton) {
      this.backButton = this.add
        .text(width / 2, height - 50 * scaleFactor, 'Back to Main Menu', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => this.scene.start(SCENE_KEYS.MAIN_MENU))
        .on('pointerover', () => this.backButton?.setStyle({ color: '#FFD700' })) // Gold
        .on('pointerout', () => this.backButton?.setStyle({ color: '#00FFFF' }))
    } else {
      this.backButton.setPosition(width / 2, height - 50 * scaleFactor).setStyle(buttonStyle)
    }
  }
}

export default CreditsScene
