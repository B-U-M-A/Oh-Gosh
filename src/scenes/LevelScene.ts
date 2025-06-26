import Phaser from 'phaser'
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS, AUDIO_KEYS, PLAYER } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
import { TileGenerator } from '../world/TileGenerator'
import { EnemyFactory } from '../game/EnemyFactory'
import { ENEMY_TYPES, ENEMY_CONFIGS } from '../data/enemyData'
import { DifficultyManager } from '../utils/DifficultyManager'
import { RoomGenerator } from '../world/RoomGenerator'
import { type LevelLayoutCell } from '../types/WorldTypes'

export type LevelType = 'procedural' | 'tilemap'

export interface LevelConfig {
  levelType: LevelType
  tilemapKey: string
  musicKey: string
  timeToSurviveMs: number
  levelWidthChunks: number
  levelHeightChunks: number
  initialDifficulty: number
  enemySpawnRate: number
  tilemapJson?: string // Path to tilemap JSON for tilemap levels
}

export abstract class LevelScene extends Phaser.Scene {
  protected player?: Phaser.Physics.Arcade.Sprite
  protected chasers?: Phaser.Physics.Arcade.Group
  protected groundLayers?: Phaser.Physics.Arcade.Group
  protected wasdCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  protected arrowCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  protected chaserSpawnTimer?: Phaser.Time.TimerEvent
  protected winTimerEvent?: Phaser.Time.TimerEvent

  protected startTime: number = 0
  protected score: number = 0
  protected miniMapCamera?: Phaser.Cameras.Scene2D.Camera
  protected miniMapBorder?: Phaser.GameObjects.Graphics
  protected isGameOver: boolean = false
  public isMiniMapVisible: boolean = false

  protected tileGenerator?: TileGenerator
  protected roomGenerator?: RoomGenerator
  protected readonly TILE_SIZE = 64
  protected readonly CHUNK_SIZE_TILES = 10

  protected levelGrid: LevelLayoutCell[][] = []
  protected loadedChunks: Map<string, Phaser.Tilemaps.Tilemap> = new Map()

  protected difficultyManager!: DifficultyManager
  protected winTimeRemaining: number
  protected countdownText?: Phaser.GameObjects.Text
  protected progressBar?: Phaser.GameObjects.Graphics
  protected progressBarBackground?: Phaser.GameObjects.Graphics

  protected abstract getLevelConfig(): LevelConfig

  constructor(sceneKey: string) {
    super({ key: sceneKey })
    const config = this.getLevelConfig()
    this.difficultyManager = new DifficultyManager(this)
    this.winTimeRemaining = config.timeToSurviveMs / 1000
  }

  create(): void {
    const config = this.getLevelConfig()
    const soundConfig = {
      loop: true,
      volume: 0.5,
    }
    this.sound.play(config.musicKey, soundConfig)
    localizationManager.addChangeListener(() => this.updateText())

    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }
    this.isGameOver = false
    this.score = 0
    this.startTime = this.time.now
    this.winTimeRemaining = config.timeToSurviveMs / 1000

    this.tileGenerator = new TileGenerator(this, this.TILE_SIZE)
    this.roomGenerator = new RoomGenerator(this, this.TILE_SIZE)
    this.groundLayers = this.physics.add.group()

    let playerStartX = 0
    let playerStartY = 0
    try {
      ;[playerStartX, playerStartY] = this.generateLevel(config.levelWidthChunks, config.levelHeightChunks)
    } catch (error) {
      console.error('Level generation failed:', error)
      this.showError('CRITICAL ERROR\nCould not start game.')
      return
    }

    try {
      this.initializePlayer(playerStartX, playerStartY)
      this.initializeUI()
      this.initializeInput()
      this.initializeEnemies()
      this.initializeTimers()
    } catch (error) {
      console.error('Initialization failed:', error)
      this.showError('CRITICAL ERROR\nCould not start game.')
      return
    }

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup.bind(this))
  }

  protected generateLevel(widthChunks: number, heightChunks: number): [number, number] {
    const config = this.getLevelConfig()

    if (config.levelType === 'tilemap' && config.tilemapJson) {
      // Use preloaded tilemap
      const map = this.make.tilemap({ key: 'level2_tilemap' })
      const tileset = map.addTilesetImage('world_tileset', TEXTURE_KEYS.WORLD)

      // Create layers and enable collision if needed
      const groundLayer = map.createLayer('Tile Layer 1', tileset as Phaser.Tilemaps.Tileset, 0, 0)
      if (groundLayer) {
        groundLayer.setCollisionByProperty({ collides: true })
      }

      // Set world bounds from tilemap dimensions
      const worldWidth = map.widthInPixels
      const worldHeight = map.heightInPixels
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight)

      // Configure camera to follow player with smooth lerp
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
      if (this.player) {
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
        this.cameras.main.setZoom(1.5) // Adjust zoom as needed
      }

      // Return player starting position (center of map)
      const startX = worldWidth / 2
      const startY = worldHeight / 2

      // Ensure player is properly positioned before camera follows
      if (this.player) {
        this.player.setPosition(startX, startY)
      }

      return [startX, startY]
    } else {
      // Default to procedural generation
      return this.generateProceduralLevel(widthChunks, heightChunks)
    }
  }

  protected abstract generateProceduralLevel(widthChunks: number, heightChunks: number): [number, number]

  protected initializePlayer(x: number, y: number): void {
    this.player = this.physics.add.sprite(x, y, TEXTURE_KEYS.IDLE)
    if (!this.player) return

    this.player.setCollideWorldBounds(true)
    this.player.setScale(1).play(ANIMATION_KEYS.PLAYER_IDLE)
    this.player.setDepth(10)
    this.cameras.main.startFollow(this.player)
    this.updateWorldBounds()
  }

  protected initializeUI(): void {
    this.createMiniMap()
    this.createCountdownUI()
  }

  protected createMiniMap(): void {
    this.miniMapCamera = this.cameras
      .add(this.scale.width - 200, 0, 200, 200, false)
      .setZoom(0.1)
      .setName('miniMap')
    this.miniMapCamera.setBackgroundColor(0x000000)
    if (this.player) {
      this.miniMapCamera.startFollow(this.player)
    }
    this.miniMapCamera.setViewport(this.scale.width - 200, 0, 200, 200)
    this.miniMapCamera.setOrigin(0.5, 0.5)
    this.miniMapCamera.setAlpha(0.7)
    this.miniMapBorder = this.add
      .graphics()
      .setScrollFactor(0)
      .lineStyle(2, 0x00ff00, 1)
      .strokeRect(this.scale.width - 200, 0, 200, 200)
    this.toggleMiniMap(this.isMiniMapVisible)
  }

  protected createCountdownUI(): void {
    this.countdownText = this.add
      .text(10, 15, '', {
        fontFamily: 'Staatliches',
        fontSize: '28px',
        color: '#000000',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(100)

    this.progressBarBackground = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(98)
      .fillStyle(0x333333, 0.8)
      .fillRect(0, 0, this.scale.width, 50)

    this.progressBar = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(99)
      .fillStyle(0x00ff00, 1)
      .fillRect(0, 0, this.scale.width, 50)

    this.updateText()
  }

  protected initializeInput(): void {
    this.wasdCursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Phaser.Types.Input.Keyboard.CursorKeys

    this.arrowCursors = this.input.keyboard?.createCursorKeys()
    this.input.keyboard?.on('keydown-P', () => this.togglePause())
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause())
    this.sys.game.events.on('blur', () => this.handleGameBlur())
  }

  protected initializeEnemies(): void {
    this.chasers = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true,
    })
    if (this.player) {
      this.physics.add.collider(this.player, this.chasers, () => this.gameOver())
    }
  }

  protected initializeTimers(): void {
    const config = this.getLevelConfig()
    this.chaserSpawnTimer = this.time.addEvent({
      delay: config.enemySpawnRate,
      callback: () => this.spawnChaser(),
      callbackScope: this,
      loop: true,
    })
    this.winTimerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => this.updateCountdown(),
      callbackScope: this,
      loop: true,
    })
  }

  protected cleanup(): void {
    const config = this.getLevelConfig()
    this.sound.stopByKey(config.musicKey)
    this.input.keyboard?.off('keydown-P')
    this.input.keyboard?.off('keydown-ESC')
    this.events.off(Phaser.Scenes.Events.RESUME)
    localizationManager.removeChangeListener(() => this.updateText())

    this.wasdCursors = undefined
    this.arrowCursors = undefined

    if (this.chaserSpawnTimer) {
      this.chaserSpawnTimer.destroy()
      this.chaserSpawnTimer = undefined
    }
    if (this.winTimerEvent) {
      this.winTimerEvent.destroy()
      this.winTimerEvent = undefined
    }

    this.loadedChunks.forEach((tilemap) => tilemap.destroy())
    this.loadedChunks.clear()

    this.player = undefined
    this.tileGenerator = undefined
    this.roomGenerator = undefined
    this.groundLayers = undefined
    this.chasers = undefined
    this.miniMapCamera = undefined
    this.miniMapBorder = undefined
    this.countdownText = undefined
    this.progressBar = undefined
    this.progressBarBackground = undefined

    this.sys.game.events.off('blur')
  }

  protected updateWorldBounds(): void {
    const config = this.getLevelConfig()
    let worldWidth, worldHeight

    if (config.levelType === 'tilemap' && config.tilemapJson) {
      // For tilemap levels, use the actual tilemap dimensions
      const map = this.make.tilemap({ key: config.tilemapJson })
      worldWidth = map.widthInPixels
      worldHeight = map.heightInPixels
    } else {
      // For procedural levels, calculate from chunks
      worldWidth = config.levelWidthChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      worldHeight = config.levelHeightChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    }

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
  }

  protected togglePause(): void {
    if (!this.scene.isPaused()) {
      if (this.input.keyboard) {
        this.input.keyboard.enabled = false
      }
      this.scene.pause()

      if (this.chaserSpawnTimer) this.chaserSpawnTimer.paused = true
      if (this.winTimerEvent) this.winTimerEvent.paused = true

      if (this.scene.manager.keys[SCENE_KEYS.PAUSE]) {
        this.scene.launch(SCENE_KEYS.PAUSE)
      } else {
        console.error(`Pause scene key not found: ${SCENE_KEYS.PAUSE}`)
        this.scene.resume()
        if (this.input.keyboard) {
          this.input.keyboard.enabled = true
        }
      }
    }
  }

  protected spawnChaser(): void {
    if (this.scene.isPaused() || !this.scene.isActive(this.scene.key) || !this.chasers || !this.player) {
      return
    }

    const MAX_CHASERS = 20
    if (this.chasers.getLength() >= MAX_CHASERS) {
      return
    }

    const camera = this.cameras.main
    let x = 0
    let y = 0
    const spawnPadding = 100

    const side = Phaser.Math.Between(0, 3)
    switch (side) {
      case 0:
        x = Phaser.Math.Between(camera.worldView.left, camera.worldView.right)
        y = camera.worldView.top - spawnPadding
        break
      case 1:
        x = Phaser.Math.Between(camera.worldView.left, camera.worldView.right)
        y = camera.worldView.bottom + spawnPadding
        break
      case 2:
        x = camera.worldView.left - spawnPadding
        y = Phaser.Math.Between(camera.worldView.top, camera.worldView.bottom)
        break
      case 3:
        x = camera.worldView.right + spawnPadding
        y = Phaser.Math.Between(camera.worldView.top, camera.worldView.bottom)
        break
    }

    const config = this.getLevelConfig()
    let worldWidth, worldHeight

    if (config.levelType === 'tilemap' && config.tilemapJson) {
      const map = this.make.tilemap({ key: config.tilemapJson })
      worldWidth = map.widthInPixels
      worldHeight = map.heightInPixels
    } else {
      worldWidth = config.levelWidthChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      worldHeight = config.levelHeightChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    }
    x = Phaser.Math.Clamp(x, 0, worldWidth)
    y = Phaser.Math.Clamp(y, 0, worldHeight)

    const chaserConfig = ENEMY_CONFIGS[ENEMY_TYPES.BASIC_CHASER]
    const chaser = EnemyFactory.createEnemy(this, chaserConfig, x, y)
    this.chasers.add(chaser)

    this.physics.moveToObject(chaser, this.player, this.difficultyManager.getChaserSpeed())
  }

  update(): void {
    if (!this.player || !this.player.body || !this.wasdCursors || !this.arrowCursors || this.isGameOver) return

    this.score = (this.time.now - this.startTime) / 1000
    this.difficultyManager.updateDifficulty(this.score)

    if (this.winTimeRemaining <= 0 && !this.isGameOver) {
      this.winGame()
      return
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    const left = this.wasdCursors.left.isDown || this.arrowCursors.left.isDown
    const right = this.wasdCursors.right.isDown || this.arrowCursors.right.isDown
    const up = this.wasdCursors.up.isDown || this.arrowCursors.up.isDown
    const down = this.wasdCursors.down.isDown || this.arrowCursors.down.isDown

    const playerSpeed = PLAYER.SPEED

    if (left || right || up || down) {
      if (this.player.anims.currentAnim?.key !== ANIMATION_KEYS.PLAYER_WALK) {
        this.player.play(ANIMATION_KEYS.PLAYER_WALK)
      }
    } else {
      if (this.player.anims.currentAnim?.key !== ANIMATION_KEYS.PLAYER_IDLE) {
        this.player.play(ANIMATION_KEYS.PLAYER_IDLE)
      }
    }

    if (left) {
      body.setVelocityX(-playerSpeed)
      this.player.setFlipX(true)
    } else if (right) {
      body.setVelocityX(playerSpeed)
      this.player.setFlipX(false)
    }

    if (up) {
      body.setVelocityY(-playerSpeed)
    } else if (down) {
      body.setVelocityY(playerSpeed)
    }

    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(playerSpeed)
    }

    this.chasers?.children.each((chaser) => {
      if (chaser instanceof Phaser.Physics.Arcade.Sprite && this.player) {
        const distance = Phaser.Math.Distance.Between(chaser.x, chaser.y, this.player.x, this.player.y)
        const maxDistance = this.cameras.main.worldView.height * 1

        if (distance > maxDistance) {
          chaser.destroy()
          this.spawnChaser()
          return true
        }

        if (chaser.body && ((chaser.body.velocity.x === 0 && chaser.body.velocity.y === 0) || distance > 50)) {
          this.physics.moveToObject(chaser, this.player, this.difficultyManager.getChaserSpeed())
        }
      }
      return true
    })
  }

  protected updateText(): void {
    const level1Strings = localizationManager.getStrings().level1
    if (this.countdownText) {
      this.countdownText.setText(level1Strings.survive.replace('{time}', Math.max(0, this.winTimeRemaining).toFixed(0)))
    }
  }

  protected updateCountdown(): void {
    if (this.isGameOver) return

    this.winTimeRemaining--
    this.updateText()
    this.updateProgressBar()

    if (this.winTimeRemaining <= 0) {
      this.winGame()
    }
  }

  protected updateProgressBar(): void {
    if (this.progressBar) {
      const config = this.getLevelConfig()
      const progress = Math.max(0, this.winTimeRemaining / (config.timeToSurviveMs / 1000))
      const barWidth = this.scale.width * progress
      this.progressBar.clear()
      this.progressBar.fillStyle(0x00ff00, 1)
      this.progressBar.fillRect(0, 0, barWidth, 50)
    }
  }

  protected gameOver(): void {
    if (this.isGameOver) return
    this.isGameOver = true

    this.sound.play(AUDIO_KEYS.COLLISION)

    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }
    this.scene.pause(this.scene.key)

    if (this.chaserSpawnTimer) this.chaserSpawnTimer.destroy()
    if (this.winTimerEvent) this.winTimerEvent.destroy()

    const finalScore = (this.time.now - this.startTime) / 1000

    if (this.scene.manager.keys[SCENE_KEYS.GAME_OVER]) {
      this.scene.stop(this.scene.key)
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore })
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.GAME_OVER}`)
      this.scene.stop()
    }
  }

  protected winGame(): void {
    if (this.isGameOver) return
    this.isGameOver = true

    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }
    this.scene.pause(this.scene.key)

    if (this.chaserSpawnTimer) this.chaserSpawnTimer.destroy()
    if (this.winTimerEvent) this.winTimerEvent.destroy()

    const finalScore = (this.time.now - this.startTime) / 1000

    if (this.scene.manager.keys[SCENE_KEYS.WIN]) {
      this.scene.stop(this.scene.key)
      this.scene.start(SCENE_KEYS.WIN, { score: finalScore })
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.WIN}`)
      this.scene.stop()
    }
  }

  protected handleGameBlur(): void {
    if (!this.scene.isPaused()) {
      this.togglePause()
    }
  }

  protected handleResize(gameSize: Phaser.Structs.Size): void {
    const { width } = gameSize
    if (this.miniMapCamera) {
      this.miniMapCamera.setViewport(width - 200, 0, 200, 200)
    }
    if (this.miniMapBorder) {
      this.miniMapBorder.clear()
      this.miniMapBorder.lineStyle(2, 0x00ff00, 1)
      this.miniMapBorder.strokeRect(width - 200, 0, 200, 200)
    }
    if (this.countdownText) {
      this.countdownText.setPosition(10, 15)
    }
    if (this.progressBarBackground) {
      this.progressBarBackground.clear()
      this.progressBarBackground.fillStyle(0x333333, 0.8)
      this.progressBarBackground.fillRect(0, 0, width, 50)
    }
    if (this.progressBar) {
      this.progressBar.clear()
      this.updateProgressBar()
    }
  }

  protected showError(message: string): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, message, {
        color: 'red',
        fontSize: '32px',
      })
      .setOrigin(0.5)
    this.scene.pause()
  }

  public toggleMiniMap(visible?: boolean): void {
    this.isMiniMapVisible = visible !== undefined ? visible : !this.isMiniMapVisible

    if (this.miniMapCamera) {
      this.miniMapCamera.setVisible(this.isMiniMapVisible)
    }
    if (this.miniMapBorder) {
      this.miniMapBorder.setVisible(this.isMiniMapVisible)
    }
  }
}
