import Phaser from 'phaser'
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'

class MainMenuScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Sprite
  private titleText?: Phaser.GameObjects.Text
  private fastPlayButton?: Phaser.GameObjects.Text
  private selectLevelButton?: Phaser.GameObjects.Text
  private creditsButton?: Phaser.GameObjects.Text
  private optionsButton?: Phaser.GameObjects.Text

  constructor() {
    super({ key: SCENE_KEYS.MAIN_MENU })
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000') // Ensure black background

    // Listen for language changes to update UI text
    localizationManager.addChangeListener(() => this.updateText())

    // Add player sprite with idle animation
    // Define a base resolution for scaling
    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(this.scale.width / baseWidth, this.scale.height / baseHeight)

    // Add player sprite with idle animation
    const playerScale = 2 * scaleFactor * 2 // Make it bigger, and scale with window
    this.player = this.add.sprite(this.scale.width * 0.25, this.scale.height / 2, TEXTURE_KEYS.IDLE)
    this.player.setScale(playerScale)
    this.player.play(ANIMATION_KEYS.PLAYER_IDLE)
    this.player.setOrigin(0.5)

    // Oh-Gosh Title next to player
    const titleFontSize = Math.max(32, 64 * scaleFactor * 1.5) // Make it bigger, and scale with window, min 32px
    this.titleText = this.add
      .text(
        this.player.x + this.player.displayWidth / 2 + 50 * scaleFactor,
        this.scale.height / 2,
        localizationManager.getStrings().mainMenu.title,
        {
          fontSize: `${titleFontSize}px`,
          color: '#FF69B4', // Hot Pink
          stroke: '#FFFF00', // Yellow stroke
          strokeThickness: 8 * scaleFactor,
          shadow: {
            offsetX: 5 * scaleFactor,
            offsetY: 5 * scaleFactor,
            color: '#000000',
            blur: 10 * scaleFactor,
            fill: true,
          },
        },
      )
      .setOrigin(0, 0.5) // Align left of text with player, center vertically

    // Buttons (initially positioned for bottom-right)
    const buttonXOffset = 150 * scaleFactor // Offset from right edge
    const buttonYOffset = 200 * scaleFactor // Offset from bottom edge
    const buttonSpacing = 70 * scaleFactor // Spacing between buttons

    const buttonFontSize = Math.max(20, 32 * scaleFactor) // Scale button font size, min 20px
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor

    const buttonStyle = {
      fontSize: `${buttonFontSize}px`,
      color: '#00FFFF', // Cyan
      backgroundColor: '#8A2BE2', // Blue Violet
      padding: { x: buttonPaddingX, y: buttonPaddingY },
    }

    this.fastPlayButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        this.scale.height - buttonYOffset,
        localizationManager.getStrings().mainMenu.fastPlay,
        buttonStyle,
      )
      .setOrigin(1, 0.5) // Align right of text with buttonX, center vertically
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.LEVEL1))
      .on('pointerover', () => this.fastPlayButton?.setStyle({ color: '#FFD700' })) // Gold
      .on('pointerout', () => this.fastPlayButton?.setStyle({ color: '#00FFFF' }))

    this.selectLevelButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        this.scale.height - buttonYOffset + buttonSpacing,
        localizationManager.getStrings().mainMenu.selectLevel,
        buttonStyle,
      )
      .setOrigin(1, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.LEVEL1)) // Still goes to Level1 for now
      .on('pointerover', () => this.selectLevelButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.selectLevelButton?.setStyle({ color: '#00FFFF' }))

    this.creditsButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        this.scale.height - buttonYOffset + buttonSpacing * 2,
        localizationManager.getStrings().mainMenu.credits,
        buttonStyle,
      )
      .setOrigin(1, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.CREDITS))
      .on('pointerover', () => this.creditsButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.creditsButton?.setStyle({ color: '#00FFFF' }))

    this.optionsButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        this.scale.height - buttonYOffset + buttonSpacing * 3,
        localizationManager.getStrings().mainMenu.options,
        buttonStyle,
      )
      .setOrigin(1, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.OPTIONS))
      .on('pointerover', () => this.optionsButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.optionsButton?.setStyle({ color: '#00FFFF' }))

    // Add resize event listener
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial text update and layout
    this.updateText()
    this.handleResize(this.scale.gameSize)

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(() => this.updateText())
      // Nullify references to allow garbage collection
      this.player = undefined
      this.titleText = undefined
      this.fastPlayButton = undefined
      this.selectLevelButton = undefined
      this.creditsButton = undefined
      this.optionsButton = undefined
    })
  }

  /**
   * Updates all text elements in the scene based on the current language.
   * This method is called when the language changes via LocalizationManager.
   */
  private updateText(): void {
    const strings = localizationManager.getStrings().mainMenu
    this.titleText?.setText(strings.title)
    this.fastPlayButton?.setText(strings.fastPlay)
    this.selectLevelButton?.setText(strings.selectLevel)
    this.creditsButton?.setText(strings.credits)
    this.optionsButton?.setText(strings.options)

    // Re-apply styles and positions to ensure padding/font size are correct after text change
    this.handleResize(this.scale.gameSize)
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize

    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    // Update player and title positions and scale
    if (this.player) {
      const playerScale = 2 * scaleFactor * 2
      this.player.setScale(playerScale)
      this.player.setPosition(width * 0.25, height / 2)
    }
    if (this.titleText && this.player) {
      const titleFontSize = Math.max(32, 64 * scaleFactor * 1.5)
      this.titleText.setFontSize(`${titleFontSize}px`)
      this.titleText.setStroke('#FFFF00', 8 * scaleFactor)
      this.titleText.setShadow(5 * scaleFactor, 5 * scaleFactor, '#000000', 10 * scaleFactor, true, false)
      this.titleText.setPosition(this.player.x + this.player.displayWidth / 2 + 50 * scaleFactor, height / 2)
    }

    // Update button positions and scale
    const buttonXOffset = 150 * scaleFactor
    const buttonYOffset = 200 * scaleFactor
    const buttonSpacing = 70 * scaleFactor

    const buttonFontSize = Math.max(20, 32 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor

    const newButtonStyle = {
      fontSize: `${buttonFontSize}px`,
      padding: { x: buttonPaddingX, y: buttonPaddingY },
    }

    this.fastPlayButton?.setPosition(width - buttonXOffset, height - buttonYOffset).setStyle(newButtonStyle)
    this.selectLevelButton
      ?.setPosition(width - buttonXOffset, height - buttonYOffset + buttonSpacing)
      .setStyle(newButtonStyle)
    this.creditsButton
      ?.setPosition(width - buttonXOffset, height - buttonYOffset + buttonSpacing * 2)
      .setStyle(newButtonStyle)
    this.optionsButton
      ?.setPosition(width - buttonXOffset, height - buttonYOffset + buttonSpacing * 3)
      .setStyle(newButtonStyle)
  }
}

export default MainMenuScene
