// src/scenes/LevelSelectorScene.ts

import Phaser from 'phaser'
import { SCENE_KEYS, AUDIO_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager' // ADDED IMPORT

interface LevelData {
  id: string
  name: string
  config: {
    levelType: 'procedural' | 'tilemap'
    tilemapKey: string
    musicKey: string
    timeToSurviveMs: number
    levelWidthChunks: number
    levelHeightChunks: number
    initialDifficulty: number
    enemySpawnRate: number
    tilemapJson?: string
  }
}

class LevelSelectorScene extends Phaser.Scene {
  private levels: LevelData[] = []
  private levelButtons: Phaser.GameObjects.Text[] = []
  private backButton?: Phaser.GameObjects.Text

  // ADDED PROPERTY: Bound callback for localization changes
  private localizationUpdateCallback: () => void

  constructor() {
    super({ key: SCENE_KEYS.LEVEL_SELECTOR })
    // ADDED: Bind the updateText method to this instance for use as a callback
    this.localizationUpdateCallback = () => this.updateText()
  }

  init(data: { levels?: LevelData[] }) {
    this.levels = data.levels || [
      {
        id: SCENE_KEYS.LEVEL1,
        name: 'Level 1 (Procedural)',
        config: {
          levelType: 'procedural',
          tilemapKey: 'world',
          musicKey: AUDIO_KEYS.IN_GAME_MUSIC,
          timeToSurviveMs: 40000,
          levelWidthChunks: 5,
          levelHeightChunks: 5,
          initialDifficulty: 1,
          enemySpawnRate: 3,
        },
      },
      {
        id: SCENE_KEYS.LEVEL2, // MODIFIED: Use SCENE_KEYS.LEVEL2 for consistency
        name: 'Level 2 (Tilemap)',
        config: {
          levelType: 'tilemap',
          tilemapKey: 'world',
          tilemapJson: 'assets/tilemap/oh-gosh-map.tmj',
          musicKey: AUDIO_KEYS.IN_GAME_MUSIC,
          timeToSurviveMs: 60000, // MODIFIED: Corrected value
          levelWidthChunks: 0, // Not used for tilemap
          levelHeightChunks: 0, // Not used for tilemap
          initialDifficulty: 2, // MODIFIED: Corrected value
          enemySpawnRate: 5, // MODIFIED: Corrected value
        },
      },
    ]
  }

  create() {
    this.addBackground()
    this.addTitle()
    this.createLevelButtons()
    this.createBackButton()
    this.setupEventListeners()

    // ADDED: Listen for language changes to update UI text
    localizationManager.addChangeListener(this.localizationUpdateCallback)
    this.updateText() // ADDED: Initial text update

    // ADDED: Clean up listeners on scene shutdown
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      localizationManager.removeChangeListener(this.localizationUpdateCallback)
      this.levelButtons = []
      this.backButton = undefined
    })
  }

  private addBackground() {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x222222).setOrigin(0)
  }

  private addTitle() {
    this.add
      .text(this.scale.width / 2, 50, 'Select Level', {
        // This title is not localized, consider adding it to localization
        fontFamily: 'Staatliches',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
  }

  private createLevelButtons() {
    const buttonSpacing = 100
    const startY = this.scale.height * 0.3
    const centerX = this.scale.width / 2

    console.log(`Creating ${this.levels.length} level buttons`)

    this.levels.forEach((level, index) => {
      const x = centerX
      const y = startY + index * buttonSpacing

      const button = this.add
        .text(x, y, level.name, {
          fontFamily: 'Staatliches',
          fontSize: '36px',
          color: '#ffffff',
          backgroundColor: '#333333',
          padding: { x: 20, y: 10 },
        })
        .setInteractive()
        .setData('levelId', level.id)
        .setOrigin(0.5)

      console.log(`Created button for ${level.name} at (${x},${y})`)

      this.levelButtons.push(button)
    })
  }

  private createBackButton() {
    this.backButton = this.add
      .text(50, this.scale.height - 50, localizationManager.getStrings().common.backButton, {
        // MODIFIED: Use common.backButton
        fontFamily: 'Staatliches',
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
      })
      .setInteractive()
  }

  private setupEventListeners() {
    this.levelButtons.forEach((button) => {
      button.on('pointerdown', () => {
        const levelId = button.getData('levelId')
        const levelData = this.levels.find((l) => l.id === levelId)
        if (levelData) {
          this.scene.start(levelId, levelData.config)
        }
      })
    })

    this.backButton?.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MAIN_MENU)
    })
  }

  // ADDED METHOD: Updates all text elements in the scene based on the current language.
  private updateText(): void {
    const commonStrings = localizationManager.getStrings().common
    this.backButton?.setText(commonStrings.backButton)
    // If 'Select Level' title needs localization, add it here too.
  }
}

export default LevelSelectorScene
