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
  private buttons: Phaser.GameObjects.Text[] = []
  private selectedButtonIndex: number = 0
  private keyboardCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private enterKey?: Phaser.Input.Keyboard.Key // Add this line
  private updateTextBound: () => void // To store the bound function for listener removal
  private lastUpDownTime: number = 0 // For keyboard debounce
  private readonly KEY_DEBOUNCE_MS = 150 // Debounce time in milliseconds

  constructor() {
    super({ key: SCENE_KEYS.MAIN_MENU })
    this.updateTextBound = this.updateText.bind(this) // Bind once for consistent reference
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000') // Ensure black background

    this.keyboardCursors = this.input.keyboard?.createCursorKeys()
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) // Add this line

    // Listen for language changes to update UI text
    localizationManager.addChangeListener(this.updateTextBound)

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

    // Calculate maximum title width to prevent button overlap
    const minTitleButtonGap = 150 * scaleFactor
    const buttonsWidth = 200 * scaleFactor
    const maxTitleWidth = this.scale.width * 0.5 - minTitleButtonGap - buttonsWidth

    // Oh-Gosh Title next to player
    let titleFontSize = Math.max(32, 64 * scaleFactor * 1.5) // Start with base size
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

    // Adjust title size if it would overlap buttons
    if (this.titleText.displayWidth > maxTitleWidth) {
      titleFontSize = titleFontSize * (maxTitleWidth / this.titleText.displayWidth)
      this.titleText.setFontSize(`${titleFontSize}px`)
    }
    
    // Title width check is now handled by the font size adjustment above

    // Buttons (initially positioned for bottom-right)
    const buttonXOffset = 150 * scaleFactor // Offset from right edge
    const buttonSpacing = 70 * scaleFactor // Spacing between buttons
    const minPadding = 20 * scaleFactor // Minimum padding from edges
    
    // Define a base style for buttons to ensure they are visible from creation
    const baseButtonStyle = this.getButtonBaseStyle(scaleFactor)

    // Calculate the vertical span of the button centers
    const verticalSpanOfCenters = (4 - 1) * buttonSpacing // For 4 buttons, this is 3 * buttonSpacing

    // Estimate button height for accurate total space calculation
    const tempButtonFontSize = Math.max(20, 32 * scaleFactor)
    const tempButtonPaddingY = 10 * scaleFactor
    const estimatedButtonHeight = tempButtonFontSize + 2 * tempButtonPaddingY

    // Total vertical space required from the top edge of the first button to the bottom edge of the last button
    const requiredTotalVerticalSpace = verticalSpanOfCenters + estimatedButtonHeight

    let firstButtonCenterY: number // This will be the Y coordinate for the center of the first button

    // Check if the entire button block fits when aligned to the bottom, respecting minPadding from top and bottom.
    // The top edge of the first button would be at `(this.scale.height - minPadding) - requiredTotalVerticalSpace`.
    // If this top edge is greater than or equal to `minPadding` from the top, then it fits at the bottom.
    if ((this.scale.height - minPadding) - requiredTotalVerticalSpace >= minPadding) {
      // It fits at the bottom. Calculate the Y for the center of the first button.
      // The center of the last button would be `(this.scale.height - minPadding) - estimatedButtonHeight / 2`.
      firstButtonCenterY = (this.scale.height - minPadding) - estimatedButtonHeight / 2 - verticalSpanOfCenters
    } else {
      // It does not fit at the bottom, so align to the top.
      // The center of the first button would be `minPadding + estimatedButtonHeight / 2`.
      firstButtonCenterY = minPadding + estimatedButtonHeight / 2
    }

    this.fastPlayButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        firstButtonCenterY,
        localizationManager.getStrings().mainMenu.fastPlay,
        baseButtonStyle, // Pass the base style here
      )
      .setOrigin(1, 0.5) // Align right of text with buttonX, center vertically
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.LEVEL1))
      .on('pointerover', () => {
        this.updateSelectionVisuals() // Trigger update to apply hover style
      })
      .on('pointerout', () => {
        this.updateSelectionVisuals() // Trigger update to revert hover style
      })

    this.selectLevelButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        firstButtonCenterY + buttonSpacing,
        localizationManager.getStrings().mainMenu.selectLevel,
        baseButtonStyle, // Pass the base style here
      )
      .setOrigin(1, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.LEVEL1)) // Still goes to Level1 for now
      .on('pointerover', () => {
        this.updateSelectionVisuals()
      })
      .on('pointerout', () => {
        this.updateSelectionVisuals()
      })

    this.creditsButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        firstButtonCenterY + buttonSpacing * 2,
        localizationManager.getStrings().mainMenu.credits,
        baseButtonStyle, // Pass the base style here
      )
      .setOrigin(1, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.CREDITS))
      .on('pointerover', () => {
        this.updateSelectionVisuals()
      })
      .on('pointerout', () => {
        this.updateSelectionVisuals()
      })

    this.optionsButton = this.add
      .text(
        this.scale.width - buttonXOffset,
        firstButtonCenterY + buttonSpacing * 3,
        localizationManager.getStrings().mainMenu.options,
        baseButtonStyle, // Pass the base style here
      )
      .setOrigin(1, 0.5)
      .setInteractive()
      .on('pointerdown', () => this.scene.start(SCENE_KEYS.OPTIONS))
      .on('pointerover', () => {
        this.updateSelectionVisuals()
      })
      .on('pointerout', () => {
        this.updateSelectionVisuals()
      })

    this.buttons = [
      this.fastPlayButton!, // Use ! to assert non-null, as they are initialized above
      this.selectLevelButton!,
      this.creditsButton!,
      this.optionsButton!,
    ]

    // Add resize event listener
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Initial text update and layout
    this.updateText()
    this.handleResize(this.scale.gameSize)
    this.updateSelectionVisuals() // Apply initial selection highlight

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      localizationManager.removeChangeListener(this.updateTextBound)
      // Nullify references to allow garbage collection
      this.player = undefined
      this.titleText = undefined
      this.fastPlayButton = undefined
      this.selectLevelButton = undefined
      this.creditsButton = undefined
      this.optionsButton = undefined
      this.keyboardCursors = undefined
      this.enterKey = undefined // Add this line
    })
  }

  update(): void {
    this.handleKeyboardInput()
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
    this.updateSelectionVisuals() // Re-apply selection visuals after text update
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
      // Calculate maximum title width to prevent button overlap
      const minTitleButtonGap = 150 * scaleFactor
      const buttonsWidth = 200 * scaleFactor
      const maxTitleWidth = width * 0.5 - minTitleButtonGap - buttonsWidth

      let titleFontSize = Math.max(32, 64 * scaleFactor * 1.5)
      this.titleText.setFontSize(`${titleFontSize}px`)
      this.titleText.setStroke('#FFFF00', 8 * scaleFactor)
      this.titleText.setShadow(5 * scaleFactor, 5 * scaleFactor, '#000000', 10 * scaleFactor, true, false)
      this.titleText.setPosition(this.player.x + this.player.displayWidth / 2 + 50 * scaleFactor, height / 2)

      // Adjust title size if it would overlap buttons
      if (this.titleText.displayWidth > maxTitleWidth) {
        titleFontSize = titleFontSize * (maxTitleWidth / this.titleText.displayWidth)
        this.titleText.setFontSize(`${titleFontSize}px`)
      }
    }

    // Update button positions and scale
    const buttonXOffset = 150 * scaleFactor
    const buttonSpacing = 70 * scaleFactor
    const minPadding = 20 * scaleFactor // Minimum padding from edges
    
    // Re-apply base style properties that are dynamic with scaleFactor
    const baseButtonStyle = this.getButtonBaseStyle(scaleFactor)

    // Calculate the vertical span of the button centers
    const verticalSpanOfCenters = (this.buttons.length - 1) * buttonSpacing // For 4 buttons, this is 3 * buttonSpacing

    // Estimate button height for accurate total space calculation
    const tempButtonFontSize = Math.max(20, 32 * scaleFactor)
    const tempButtonPaddingY = 10 * scaleFactor
    const estimatedButtonHeight = tempButtonFontSize + 2 * tempButtonPaddingY

    // Total vertical space required from the top edge of the first button to the bottom edge of the last button
    const requiredTotalVerticalSpace = verticalSpanOfCenters + estimatedButtonHeight

    let firstButtonCenterY: number // This will be the Y coordinate for the center of the first button

    // Check if the entire button block fits when aligned to the bottom, respecting minPadding from top and bottom.
    // The top edge of the first button would be at `(height - minPadding) - requiredTotalVerticalSpace`.
    // If this top edge is greater than or equal to `minPadding` from the top, then it fits at the bottom.
    if ((height - minPadding) - requiredTotalVerticalSpace >= minPadding) {
      // It fits at the bottom. Calculate the Y for the center of the first button.
      // The center of the last button would be `(height - minPadding) - estimatedButtonHeight / 2`.
      firstButtonCenterY = (height - minPadding) - estimatedButtonHeight / 2 - verticalSpanOfCenters
    } else {
      // It does not fit at the bottom, so align to the top.
      // The center of the first button would be `minPadding + estimatedButtonHeight / 2`.
      firstButtonCenterY = minPadding + estimatedButtonHeight / 2
    }

    this.fastPlayButton?.setPosition(width - buttonXOffset, firstButtonCenterY).setStyle(baseButtonStyle)
    this.selectLevelButton
      ?.setPosition(width - buttonXOffset, firstButtonCenterY + buttonSpacing)
      .setStyle(baseButtonStyle)
    this.creditsButton
      ?.setPosition(width - buttonXOffset, firstButtonCenterY + buttonSpacing * 2)
      .setStyle(baseButtonStyle)
    this.optionsButton
      ?.setPosition(width - buttonXOffset, firstButtonCenterY + buttonSpacing * 3)
      .setStyle(baseButtonStyle)

    this.updateSelectionVisuals() // Re-apply selection visuals after resize
  }

  /**
   * Handles keyboard input for menu navigation and selection.
   */
  private handleKeyboardInput(): void {
    if (!this.keyboardCursors || !this.buttons.length || !this.enterKey) return // Update the guard to also check for this.enterKey

    const currentTime = this.time.now

    // Debounce for Up/Down arrow keys
    if (currentTime - this.lastUpDownTime > this.KEY_DEBOUNCE_MS) {
      if (this.keyboardCursors.down.isDown) {
        this.selectedButtonIndex = (this.selectedButtonIndex + 1) % this.buttons.length
        this.updateSelectionVisuals()
        this.lastUpDownTime = currentTime
      } else if (this.keyboardCursors.up.isDown) {
        this.selectedButtonIndex = (this.selectedButtonIndex - 1 + this.buttons.length) % this.buttons.length
        this.updateSelectionVisuals()
        this.lastUpDownTime = currentTime
      }
    }

    // Handle Enter/Space for activation (no debounce needed for JustDown)
    if (
      Phaser.Input.Keyboard.JustDown(this.enterKey) || // Change this line
      Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE))
    ) {
      this.activateSelectedButton()
    }
  }

  /**
   * Returns the base style for menu buttons, dynamically scaled.
   */
  private getButtonBaseStyle(scaleFactor: number): Phaser.Types.GameObjects.Text.TextStyle {
    const buttonFontSize = Math.max(20, 32 * scaleFactor)
    const buttonPaddingX = 20 * scaleFactor
    const buttonPaddingY = 10 * scaleFactor

    return {
      fontSize: `${buttonFontSize}px`,
      color: '#00FFFF', // Cyan
      backgroundColor: '#8A2BE2', // Blue Violet
      padding: { x: buttonPaddingX, y: buttonPaddingY },
      stroke: '#000000',
      strokeThickness: 0,
    }
  }

  /**
   * Updates the visual appearance of all menu buttons based on the current selection and hover state.
   */
  private updateSelectionVisuals(): void {
    const scaleFactor = Math.min(this.scale.width / 800, this.scale.height / 600)
    const defaultStyle = this.getButtonBaseStyle(scaleFactor) // Use the helper for default style
    const strokeThickness = 4 * scaleFactor

    const selectedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      ...defaultStyle, // Start with default properties
      color: '#FFD700', // Gold for selected text
      stroke: '#FFFFFF', // White stroke for selection
      strokeThickness: strokeThickness,
    }

    const hoverStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      ...defaultStyle,
      color: '#FFD700', // Gold for hover text
      // You could add a subtle stroke or shadow for hover if desired, e.g.:
      // stroke: '#AAAAAA',
      // strokeThickness: strokeThickness / 2,
    }

    this.buttons.forEach((button, index) => {
      const isHovered = button.input?.pointerOver // Check if the mouse is currently over this button
      
      if (index === this.selectedButtonIndex) {
        button.setStyle(selectedStyle)
      } else {
        // If not selected, apply default style.
        // If it's hovered AND not the selected button, apply a hover color
        if (isHovered) {
          button.setStyle(hoverStyle)
        } else {
          button.setStyle(defaultStyle)
        }
      }
    })
  }

  /**
   * Activates the currently selected button, simulating a pointerdown event.
   */
  private activateSelectedButton(): void {
    if (this.buttons[this.selectedButtonIndex]) {
      this.buttons[this.selectedButtonIndex].emit('pointerdown')
    }
  }
}

export default MainMenuScene
