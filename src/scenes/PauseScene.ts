// src/scenes/PauseScene.ts

import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
import { LevelScene } from './LevelScene'

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

  private parentLevelScene?: LevelScene
  private localizationUpdateCallback: () => void
  private isActionInProgress: boolean = false // State guard

  private resumeGameBound: () => void
  private backToMainMenuBound: () => void

  constructor() {
    super({ key: SCENE_KEYS.PAUSE })
    this.localizationUpdateCallback = () => this.updateText()
    this.resumeGameBound = this.resumeGame.bind(this)
    this.backToMainMenuBound = this.backToMainMenu.bind(this)
  }

  init(data: { parentScene: LevelScene }) {
    this.parentLevelScene = data.parentScene
    this.isActionInProgress = false // Reset for new instance
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
    localizationManager.addChangeListener(this.localizationUpdateCallback)
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    this.backgroundRect = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.7).setOrigin(0.5)
    this.pausedText = this.add
      .text(0, 0, '', {
        fontFamily: 'Staatliches',
        fontSize: '1px',
        color: '#FFD700',
        stroke: '#8A2BE2',
        strokeThickness: 1,
      })
      .setOrigin(0.5)

    this.resumeButton = this.add
      .text(0, 0, '', {
        fontSize: '1px',
        color: '#00FFFF',
        backgroundColor: '#8A2BE2',
        padding: { x: 1, y: 1 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', this.resumeGameBound)
      .on('pointerover', () => this.resumeButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.resumeButton?.setStyle({ color: '#00FFFF' }))

    this.volumeLabel = this.add
      .text(0, 0, '', {
        fontSize: '1px',
        color: '#FFFFFF',
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
        fontSize: '1px',
        color: '#00FFFF',
        backgroundColor: '#8A2BE2',
        padding: { x: 1, y: 1 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.parentLevelScene?.toggleMiniMap()
        this.updateText()
      })
      .on('pointerover', () => this.toggleMinimapButton?.setStyle({ color: '#FFD700' }))
      .on('pointerout', () => this.toggleMinimapButton?.setStyle({ color: '#00FFFF' }))

    this.backToMenuButton = this.add
      .text(0, 0, '', {
        fontSize: '1px',
        color: '#00FFFF',
        backgroundColor: '#8A2BE2',
        padding: { x: 1, y: 1 },
      })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', this.backToMainMenuBound)

    this.updateText()
    this.handleResize(this.scale.gameSize)

    // MODIFIED: Add keyboard listeners using the bound callback
    this.input.keyboard?.on('keydown-P', this.resumeGameBound)
    this.input.keyboard?.on('keydown-ESC', this.resumeGameBound)

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(this.localizationUpdateCallback)
      // MODIFIED: Remove specific bound keyboard listeners
      this.input.keyboard?.off('keydown-P', this.resumeGameBound)
      this.input.keyboard?.off('keydown-ESC', this.resumeGameBound)
      // MODIFIED: Remove specific bound pointerdown listeners
      this.backToMenuButton?.off('pointerdown', this.backToMainMenuBound)
      this.resumeButton?.off('pointerdown', this.resumeGameBound)
      this.input.off('drag')

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
      this.parentLevelScene = undefined
    })
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize
    const baseWidth = 800
    const baseHeight = 600
    const scaleFactor = Math.min(width / baseWidth, height / baseHeight)

    const pauseStrings = localizationManager.getStrings().pause
    const commonStrings = localizationManager.getStrings().common

    this.backgroundRect?.setSize(width, height).setPosition(width / 2, height / 2)

    const pausedFontSize = Math.max(48, 96 * scaleFactor)
    if (!this.pausedText) {
      this.pausedText = this.add
        .text(width / 2, height * 0.2, pauseStrings.title, {
          fontFamily: 'Staatliches',
          fontSize: `${pausedFontSize}px`,
          color: '#FFD700',
          stroke: '#8A2BE2',
          strokeThickness: 6 * scaleFactor,
        })
        .setOrigin(0.5)
    }
    this.pausedText.setFontSize(`${pausedFontSize}px`)
    this.pausedText.setStroke('#8A2BE2', 6 * scaleFactor)
    this.pausedText.setPosition(width / 2, height * 0.2)
    this.pausedText.setText(pauseStrings.title)

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

    if (!this.resumeButton) {
      this.resumeButton = this.add
        .text(width / 2, height * 0.4, pauseStrings.resume, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', this.resumeGameBound)
        .on('pointerover', () => this.resumeButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.resumeButton?.setStyle({ color: '#00FFFF' }))
    }
    this.resumeButton.setPosition(width / 2, height * 0.4).setStyle(buttonStyle)
    this.resumeButton.setText(pauseStrings.resume)

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

    const levelScene = this.parentLevelScene
    const minimapButtonYPos = height * 0.7

    if (!this.toggleMinimapButton) {
      const minimapState = levelScene?.isMiniMapVisible ? commonStrings.minimapState.on : commonStrings.minimapState.off
      const initialText = `${commonStrings.toggleMinimap} ${minimapState}`
      this.toggleMinimapButton = this.add
        .text(width / 2, minimapButtonYPos, initialText, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
          levelScene?.toggleMiniMap()
          this.updateText()
        })
        .on('pointerover', () => this.toggleMinimapButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.toggleMinimapButton?.setStyle({ color: '#00FFFF' }))
    }
    const minimapState = levelScene?.isMiniMapVisible ? commonStrings.minimapState.on : commonStrings.minimapState.off
    this.toggleMinimapButton.setText(`${commonStrings.toggleMinimap} ${minimapState}`)
    this.toggleMinimapButton.setPosition(width / 2, minimapButtonYPos).setStyle(buttonStyle)

    const backButtonYPos = height * 0.85

    if (!this.backToMenuButton) {
      this.backToMenuButton = this.add
        .text(width / 2, backButtonYPos, pauseStrings.backToMenu, buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', this.backToMainMenuBound)
        .on('pointerover', () => this.backToMenuButton?.setStyle({ color: '#FFD700' }))
        .on('pointerout', () => this.backToMenuButton?.setStyle({ color: '#00FFFF' }))
    }
    this.backToMenuButton.setPosition(width / 2, backButtonYPos).setStyle(buttonStyle)
    this.backToMenuButton.setText(pauseStrings.backToMenu)
  }

  private updateText(): void {
    const pauseStrings = localizationManager.getStrings().pause
    const commonStrings = localizationManager.getStrings().common

    this.pausedText?.setText(pauseStrings.title)
    this.resumeButton?.setText(pauseStrings.resume)
    this.volumeLabel?.setText(pauseStrings.volume)
    this.backToMenuButton?.setText(pauseStrings.backToMenu)

    const levelScene = this.parentLevelScene
    if (levelScene) {
      const minimapState = levelScene.isMiniMapVisible ? commonStrings.minimapState.on : commonStrings.minimapState.off
      this.toggleMinimapButton?.setText(`${commonStrings.toggleMinimap} ${minimapState}`)
    }
  }

  private resumeGame(): void {
    if (this.isActionInProgress) {
      return
    }
    this.isActionInProgress = true

    // MODIFIED: Removed explicit listener.off calls here.
    // The LevelScene's RESUME event handler will re-add the listeners.

    const levelScene = this.parentLevelScene

    if (levelScene) {
      // MODIFIED: Removed disabling/enabling of levelScene's keyboard input.
      // The LevelScene's RESUME event handler will manage its input state.

      this.scene.resume(levelScene.scene.key)
    } else {
      console.error(`Parent Level scene not found during resume. This PauseScene instance might be stale.`)
    }

    this.scene.stop(SCENE_KEYS.PAUSE)
  }

  private backToMainMenu(): void {
    if (this.isActionInProgress) {
      return
    }
    this.isActionInProgress = true

    // MODIFIED: Removed explicit listener.off calls here.

    if (this.parentLevelScene && this.scene.manager.keys[this.parentLevelScene.scene.key]) {
      this.scene.stop(this.parentLevelScene.scene.key)
    } else {
      console.error(`Parent Level scene not found during backToMainMenu. This PauseScene instance might be stale.`)
    }
    this.scene.stop(SCENE_KEYS.PAUSE)
    this.scene.switch(SCENE_KEYS.MAIN_MENU) // MODIFIED: Use scene.switch
  }
}

export default PauseScene
