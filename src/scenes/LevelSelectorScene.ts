import Phaser from 'phaser'
import { SCENE_KEYS, AUDIO_KEYS } from '../utils/constants'

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

  constructor() {
    super({ key: SCENE_KEYS.LEVEL_SELECTOR })
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
        id: 'Level2Scene',
        name: 'Level 2 (Tilemap)',
        config: {
          levelType: 'tilemap',
          tilemapKey: 'world',
          tilemapJson: 'assets/tilemap/oh-gosh-map.tmj',
          musicKey: AUDIO_KEYS.IN_GAME_MUSIC,
          timeToSurviveMs: 40000,
          levelWidthChunks: 0, // Not used for tilemap
          levelHeightChunks: 0, // Not used for tilemap
          initialDifficulty: 1,
          enemySpawnRate: 3,
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
  }

  private addBackground() {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x222222).setOrigin(0)
  }

  private addTitle() {
    this.add
      .text(this.scale.width / 2, 50, 'Select Level', {
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
      .text(50, this.scale.height - 50, 'Back', {
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
}

export default LevelSelectorScene
