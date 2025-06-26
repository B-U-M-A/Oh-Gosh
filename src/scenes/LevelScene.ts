import Phaser from 'phaser'
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS, AUDIO_KEYS, PLAYER } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
import { TileGenerator } from '../world/TileGenerator'
import { EnemyFactory } from '../game/EnemyFactory'
import { ENEMY_TYPES, ENEMY_CONFIGS } from '../data/enemyData'
import { DifficultyManager } from '../utils/DifficultyManager'
import { RoomGenerator } from '../world/RoomGenerator'
import { type LevelLayoutCell } from '../types/WorldTypes'

/**
 * Defines the type of level generation.
 * - 'procedural': Level is generated dynamically at runtime.
 * - 'tilemap': Level is loaded from a pre-designed tilemap JSON file.
 */
export type LevelType = 'procedural' | 'tilemap'

/**
 * Configuration interface for a game level.
 */
export interface LevelConfig {
  /** The type of level generation (procedural or tilemap). */
  levelType: LevelType
  /** Key for the tilemap asset (if levelType is 'tilemap'). */
  tilemapKey: string
  /** Key for the background music audio asset. */
  musicKey: string
  /** Time in milliseconds the player must survive to win. */
  timeToSurviveMs: number
  /** Width of the level in chunks (for procedural levels). */
  levelWidthChunks: number
  /** Height of the level in chunks (for procedural levels). */
  levelHeightChunks: number
  /** Initial difficulty setting for the level. */
  initialDifficulty: number
  /** Rate at which enemies spawn (in milliseconds). */
  enemySpawnRate: number
  /** Optional path to tilemap JSON for tilemap levels. */
  tilemapJson?: string
}

/**
 * Abstract base class for all game levels in Phaser.
 * Provides common functionality for player control, enemy management, UI,
 * and game state (pause, game over, win).
 * Concrete level scenes should extend this class and implement `getLevelConfig`
 * and `generateProceduralLevel` (if applicable).
 */
export abstract class LevelScene extends Phaser.Scene {
  /** The player character sprite. */
  protected player?: Phaser.Physics.Arcade.Sprite
  /** Group containing all enemy chasers. */
  protected chasers?: Phaser.Physics.Arcade.Group
  /** Group for all ground tile layers, used for collision. */
  protected groundLayers?: Phaser.Physics.Arcade.Group
  /** WASD keyboard controls. */
  protected wasdCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  /** Arrow key controls. */
  protected arrowCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  /** Timer for spawning new enemies. */
  protected chaserSpawnTimer?: Phaser.Time.TimerEvent
  /** Timer tracking win condition progress. */
  protected winTimerEvent?: Phaser.Time.TimerEvent

  /** Timestamp when the scene was created (for score calculation). */
  protected startTime: number = 0
  /** Current score, based on survival time. */
  protected score: number = 0
  /** Camera dedicated to the mini-map. */
  protected miniMapCamera?: Phaser.Cameras.Scene2D.Camera
  /** Graphics object for the mini-map border. */
  protected miniMapBorder?: Phaser.GameObjects.Graphics
  /** Flag indicating if the game is currently over (win or lose). */
  protected isGameOver: boolean = false
  /** Flag indicating if the mini-map is currently visible. */
  public isMiniMapVisible: boolean = false

  /** Utility for generating tiles and tilemaps. */
  protected tileGenerator?: TileGenerator
  /** Utility for generating rooms in procedural levels. */
  protected roomGenerator?: RoomGenerator
  /** The size of each tile in pixels. */
  protected readonly TILE_SIZE = 64
  /** The size of a level chunk in tiles (e.g., 10x10 tiles per chunk). */
  protected readonly CHUNK_SIZE_TILES = 10

  /** 2D array representing the layout of rooms/chunks in a procedural level. */
  protected levelGrid: LevelLayoutCell[][] = []
  /** Map to store loaded tilemaps for each chunk, allowing dynamic loading/unloading. */
  protected loadedChunks: Map<string, Phaser.Tilemaps.Tilemap> = new Map()

  /** Manages game difficulty based on player score/time. */
  protected difficultyManager!: DifficultyManager
  /** Remaining time to survive for the win condition (in seconds). */
  protected winTimeRemaining: number
  /** Text object displaying the countdown timer. */
  protected countdownText?: Phaser.GameObjects.Text
  /** Graphics object for the progress bar indicating time remaining. */
  protected progressBar?: Phaser.GameObjects.Graphics
  /** Background graphics for the progress bar. */
  protected progressBarBackground?: Phaser.GameObjects.Graphics

  /**
   * Abstract method to be implemented by concrete level scenes to provide their specific configuration.
   * @returns The LevelConfig object for the current level.
   */
  protected abstract getLevelConfig(): LevelConfig

  /**
   * Constructs a new LevelScene.
   * @param sceneKey The unique key for this scene.
   */
  constructor(sceneKey: string) {
    super({ key: sceneKey })
    // Retrieve level configuration specific to the concrete scene
    const config = this.getLevelConfig()
    // Initialize difficulty manager with this scene
    this.difficultyManager = new DifficultyManager(this)
    // Set initial win time remaining based on config
    this.winTimeRemaining = config.timeToSurviveMs / 1000
  }

  /**
   * Called when the scene is created. Sets up the game world, player, UI, and input.
   */
  create(): void {
    const config = this.getLevelConfig()

    // Play background music for the level
    const soundConfig = {
      loop: true,
      volume: 0.5,
    }
    this.sound.play(config.musicKey, soundConfig)

    // Register for localization changes to update UI text
    localizationManager.addChangeListener(() => this.updateText())

    // Enable keyboard input
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }

    // Reset game state variables
    this.isGameOver = false
    this.score = 0
    this.startTime = this.time.now
    this.winTimeRemaining = config.timeToSurviveMs / 1000

    // Initialize world generation utilities
    this.tileGenerator = new TileGenerator(this, this.TILE_SIZE)
    this.roomGenerator = new RoomGenerator(this, this.TILE_SIZE)
    // Create a physics group for ground layers (e.g., for collision detection)
    this.groundLayers = this.physics.add.group()

    let playerStartX = 0
    let playerStartY = 0
    // Attempt to generate the level and get player start position
    try {
      ;[playerStartX, playerStartY] = this.generateLevel(config.levelWidthChunks, config.levelHeightChunks)
    } catch (error) {
      console.error('Level generation failed:', error)
      this.showError('CRITICAL ERROR\nCould not start game.')
      return
    }

    // Attempt to initialize game components
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

    // Register cleanup method to be called when the scene shuts down
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup.bind(this))
    // Register resize handler for responsive UI
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
  }

  /**
   * Generates the game level based on the level configuration.
   * Can generate a level from a preloaded tilemap or procedurally.
   * @param widthChunks The width of the level in chunks (for procedural levels).
   * @param heightChunks The height of the level in chunks (for procedural levels).
   * @returns A tuple containing the player's starting X and Y coordinates.
   */
  protected generateLevel(widthChunks: number, heightChunks: number): [number, number] {
    const config = this.getLevelConfig()

    // Check if the level is a tilemap-based level
    if (config.levelType === 'tilemap' && config.tilemapJson) {
      // Create tilemap from preloaded JSON key
      const map = this.make.tilemap({ key: config.tilemapJson })
      // Add the tileset image to the map
      const tileset = map.addTilesetImage('world_tileset', TEXTURE_KEYS.WORLD)

      // Create layers from the tilemap and enable collision for 'Tile Layer 1'
      const groundLayer = map.createLayer('Tile Layer 1', tileset as Phaser.Tilemaps.Tileset, 0, 0)
      if (groundLayer) {
        groundLayer.setCollisionByProperty({ collides: true })
        // Add ground layer to the group for collision detection with player/enemies
        this.groundLayers?.add(groundLayer)
      }

      // Set world bounds based on the tilemap's dimensions
      const worldWidth = map.widthInPixels
      const worldHeight = map.heightInPixels
      this.physics.world.setBounds(0, 0, worldWidth, worldHeight)

      // Configure main camera to follow the player smoothly
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
      if (this.player) {
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
        this.cameras.main.setZoom(1.5) // Adjust zoom level as needed
      }

      // Calculate player starting position (center of the map)
      const startX = worldWidth / 2
      const startY = worldHeight / 2

      // Ensure player is positioned correctly before camera starts following
      if (this.player) {
        this.player.setPosition(startX, startY)
      }

      return [startX, startY]
    } else {
      // If not a tilemap level, default to procedural generation
      return this.generateProceduralLevel(widthChunks, heightChunks)
    }
  }

  /**
   * Abstract method to be implemented by concrete level scenes for procedural level generation.
   * @param widthChunks The width of the level in chunks.
   * @param heightChunks The height of the level in chunks.
   * @returns A tuple containing the player's starting X and Y coordinates.
   */
  protected abstract generateProceduralLevel(widthChunks: number, heightChunks: number): [number, number]

  /**
   * Initializes the player sprite, sets its properties, and configures the camera to follow.
   * @param x The initial X coordinate for the player.
   * @param y The initial Y coordinate for the player.
   */
  protected initializePlayer(x: number, y: number): void {
    this.player = this.physics.add.sprite(x, y, TEXTURE_KEYS.IDLE)
    if (!this.player) return

    this.player.setCollideWorldBounds(true) // Player cannot leave world bounds
    this.player.setScale(1).play(ANIMATION_KEYS.PLAYER_IDLE) // Set scale and initial animation
    this.player.setDepth(10) // Ensure player is rendered above most other objects
    this.cameras.main.startFollow(this.player) // Main camera follows the player
    this.updateWorldBounds() // Update world bounds based on level size
  }

  /**
   * Initializes the game user interface elements.
   */
  protected initializeUI(): void {
    this.createMiniMap() // Create and configure the mini-map
    this.createCountdownUI() // Create the countdown timer and progress bar
  }

  /**
   * Creates and configures the mini-map camera and its border.
   */
  protected createMiniMap(): void {
    // Add a new camera for the mini-map in the top-right corner
    this.miniMapCamera = this.cameras
      .add(this.scale.width - 200, 0, 200, 200, false)
      .setZoom(0.1) // Zoom out to show a larger area
      .setName('miniMap')
    this.miniMapCamera.setBackgroundColor(0x000000) // Black background for the mini-map
    if (this.player) {
      this.miniMapCamera.startFollow(this.player) // Mini-map camera also follows the player
    }
    // Set viewport and origin for the mini-map camera
    this.miniMapCamera.setViewport(this.scale.width - 200, 0, 200, 200)
    this.miniMapCamera.setOrigin(0.5, 0.5)
    this.miniMapCamera.setAlpha(0.7) // Make mini-map slightly transparent

    // Create a border around the mini-map
    this.miniMapBorder = this.add
      .graphics()
      .setScrollFactor(0) // Fixed position on screen
      .lineStyle(2, 0x00ff00, 1) // Green border, 2 pixels thick
      .strokeRect(this.scale.width - 200, 0, 200, 200)
    this.toggleMiniMap(this.isMiniMapVisible) // Set initial visibility
  }

  /**
   * Creates the countdown timer text and the survival progress bar.
   */
  protected createCountdownUI(): void {
    // Create countdown text
    this.countdownText = this.add
      .text(10, 15, '', {
        fontFamily: 'Staatliches',
        fontSize: '28px',
        color: '#000000',
        stroke: '#ffffff',
        strokeThickness: 4,
      })
      .setOrigin(0, 0.5) // Align text to the left-middle
      .setScrollFactor(0) // Fixed position on screen
      .setDepth(100) // Render on top of other UI elements

    // Create progress bar background
    this.progressBarBackground = this.add
      .graphics()
      .setScrollFactor(0) // Fixed position on screen
      .setDepth(98) // Below the progress bar
      .fillStyle(0x333333, 0.8) // Dark grey, semi-transparent
      .fillRect(0, 0, this.scale.width, 50) // Full width, 50px height at top of screen

    // Create progress bar foreground
    this.progressBar = this.add
      .graphics()
      .setScrollFactor(0) // Fixed position on screen
      .setDepth(99) // Above background, below text
      .fillStyle(0x00ff00, 1) // Green, opaque
      .fillRect(0, 0, this.scale.width, 50) // Full width, 50px height at top of screen

    this.updateText() // Initial update of the countdown text
  }

  /**
   * Initializes keyboard input for player movement and game controls.
   */
  protected initializeInput(): void {
    // Add WASD keys for movement
    this.wasdCursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Phaser.Types.Input.Keyboard.CursorKeys

    // Create arrow key cursors
    this.arrowCursors = this.input.keyboard?.createCursorKeys()

    // Register event listeners for pause and game blur
    this.input.keyboard?.on('keydown-P', () => this.togglePause())
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause())
    this.sys.game.events.on('blur', () => this.handleGameBlur()) // Pause game when window loses focus
  }

  /**
   * Initializes the enemy group and sets up collision detection with the player.
   */
  protected initializeEnemies(): void {
    // Create a physics group for chaser enemies
    this.chasers = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite, // Ensure children are Arcade Sprites
      runChildUpdate: true, // Call update on each child in the group
    })
    // Set up collision between player and chasers, triggering game over
    if (this.player) {
      this.physics.add.collider(this.player, this.chasers, () => this.gameOver())
    }
  }

  /**
   * Initializes game timers, including the chaser spawn timer and the win condition timer.
   */
  protected initializeTimers(): void {
    const config = this.getLevelConfig()

    // Timer for spawning new chasers at a defined rate
    this.chaserSpawnTimer = this.time.addEvent({
      delay: config.enemySpawnRate, // Delay between spawns from level config
      callback: () => this.spawnChaser(), // Function to call when timer fires
      callbackScope: this, // Context for the callback
      loop: true, // Repeat indefinitely
    })

    // Timer for the win condition countdown
    this.winTimerEvent = this.time.addEvent({
      delay: 1000, // Update every second
      callback: () => this.updateCountdown(), // Function to update countdown
      callbackScope: this, // Context for the callback
      loop: true, // Repeat indefinitely
    })
  }

  /**
   * Cleans up resources and event listeners when the scene shuts down.
   */
  protected cleanup(): void {
    const config = this.getLevelConfig()
    // Stop background music
    this.sound.stopByKey(config.musicKey)

    // Remove keyboard event listeners
    this.input.keyboard?.off('keydown-P')
    this.input.keyboard?.off('keydown-ESC')
    // Remove scene resume event listener (if any)
    this.events.off(Phaser.Scenes.Events.RESUME)
    // Remove localization change listener
    localizationManager.removeChangeListener(() => this.updateText())
    // Remove resize event listener
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this)

    // Clear cursor references
    this.wasdCursors = undefined
    this.arrowCursors = undefined

    // Destroy and clear timers
    if (this.chaserSpawnTimer) {
      this.chaserSpawnTimer.destroy()
      this.chaserSpawnTimer = undefined
    }
    if (this.winTimerEvent) {
      this.winTimerEvent.destroy()
      this.winTimerEvent = undefined
    }

    // Destroy loaded tilemaps for procedural levels
    this.loadedChunks.forEach((tilemap) => tilemap.destroy())
    this.loadedChunks.clear()

    // Clear object references to aid garbage collection
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

    // Remove game blur event listener
    this.sys.game.events.off('blur')
  }

  /**
   * Updates the physics world bounds and main camera bounds based on the level dimensions.
   * This is crucial for keeping entities within the playable area and camera tracking.
   */
  protected updateWorldBounds(): void {
    const config = this.getLevelConfig()
    let worldWidth, worldHeight

    // Determine world dimensions based on level type
    if (config.levelType === 'tilemap' && config.tilemapJson) {
      // For tilemap levels, use the actual tilemap dimensions
      // Note: This creates a new tilemap object, but only for its dimensions.
      // The actual map layers are already created in generateLevel.
      const map = this.make.tilemap({ key: config.tilemapJson })
      worldWidth = map.widthInPixels
      worldHeight = map.heightInPixels
    } else {
      // For procedural levels, calculate from chunks and tile size
      worldWidth = config.levelWidthChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      worldHeight = config.levelHeightChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    }

    // Set the physics world boundaries
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
    // Set the main camera boundaries to match the world
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
  }

  /**
   * Toggles the game's pause state.
   * When paused, input is disabled, and timers are paused.
   * Launches the PauseScene if available.
   */
  protected togglePause(): void {
    if (!this.scene.isPaused()) {
      // Disable keyboard input to prevent actions while paused
      if (this.input.keyboard) {
        this.input.keyboard.enabled = false
      }
      this.scene.pause() // Pause the current scene

      // Pause active timers
      if (this.chaserSpawnTimer) this.chaserSpawnTimer.paused = true
      if (this.winTimerEvent) this.winTimerEvent.paused = true

      // Attempt to launch the PauseScene
      if (this.scene.manager.keys[SCENE_KEYS.PAUSE]) {
        this.scene.launch(SCENE_KEYS.PAUSE)
      } else {
        // Fallback if PauseScene is not found (e.g., development error)
        console.error(`Pause scene key not found: ${SCENE_KEYS.PAUSE}`)
        this.scene.resume() // Resume game if pause scene can't be launched
        if (this.input.keyboard) {
          this.input.keyboard.enabled = true
        }
      }
    }
  }

  /**
   * Spawns a new chaser enemy at a random location outside the camera view.
   * Limits the maximum number of active chasers.
   */
  protected spawnChaser(): void {
    // Do not spawn if scene is paused, inactive, or groups/player are not initialized
    if (this.scene.isPaused() || !this.scene.isActive(this.scene.key) || !this.chasers || !this.player) {
      return
    }

    const MAX_CHASERS = 20 // Maximum number of chasers allowed on screen
    if (this.chasers.getLength() >= MAX_CHASERS) {
      return // Do not spawn if max chasers reached
    }

    const camera = this.cameras.main
    let x = 0
    let y = 0
    const spawnPadding = 100 // Distance outside camera view to spawn enemies

    // Randomly choose a side (top, bottom, left, right) to spawn the chaser
    const side = Phaser.Math.Between(0, 3)
    switch (side) {
      case 0: // Top
        x = Phaser.Math.Between(camera.worldView.left, camera.worldView.right)
        y = camera.worldView.top - spawnPadding
        break
      case 1: // Bottom
        x = Phaser.Math.Between(camera.worldView.left, camera.worldView.right)
        y = camera.worldView.bottom + spawnPadding
        break
      case 2: // Left
        x = camera.worldView.left - spawnPadding
        y = Phaser.Math.Between(camera.worldView.top, camera.worldView.bottom)
        break
      case 3: // Right
        x = camera.worldView.right + spawnPadding
        y = Phaser.Math.Between(camera.worldView.top, camera.worldView.bottom)
        break
    }

    const config = this.getLevelConfig()
    let worldWidth, worldHeight

    // Get world dimensions to clamp spawn position within bounds
    if (config.levelType === 'tilemap' && config.tilemapJson) {
      const map = this.make.tilemap({ key: config.tilemapJson })
      worldWidth = map.widthInPixels
      worldHeight = map.heightInPixels
    } else {
      worldWidth = config.levelWidthChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      worldHeight = config.levelHeightChunks * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    }
    // Clamp spawn coordinates to ensure they are within the actual world bounds
    x = Phaser.Math.Clamp(x, 0, worldWidth)
    y = Phaser.Math.Clamp(y, 0, worldHeight)

    // Create a basic chaser enemy using the EnemyFactory
    const chaserConfig = ENEMY_CONFIGS[ENEMY_TYPES.BASIC_CHASER]
    const chaser = EnemyFactory.createEnemy(this, chaserConfig, x, y)
    this.chasers.add(chaser) // Add the new chaser to the group

    // Set the chaser to move towards the player
    this.physics.moveToObject(chaser, this.player, this.difficultyManager.getChaserSpeed())
  }

  /**
   * The main update loop for the scene, called every frame.
   * Handles player movement, score updates, difficulty adjustments, and enemy behavior.
   */
  update(): void {
    // Exit early if player or input cursors are not ready, or if game is over
    if (!this.player || !this.player.body || !this.wasdCursors || !this.arrowCursors || this.isGameOver) return

    // Update score based on survival time
    this.score = (this.time.now - this.startTime) / 1000
    // Update difficulty based on current score
    this.difficultyManager.updateDifficulty(this.score)

    // Check for win condition
    if (this.winTimeRemaining <= 0 && !this.isGameOver) {
      this.winGame()
      return
    }

    // Player movement logic
    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0) // Reset player velocity each frame

    // Check input for movement
    const left = this.wasdCursors.left.isDown || this.arrowCursors.left.isDown
    const right = this.wasdCursors.right.isDown || this.arrowCursors.right.isDown
    const up = this.wasdCursors.up.isDown || this.arrowCursors.up.isDown
    const down = this.wasdCursors.down.isDown || this.arrowCursors.down.isDown

    const playerSpeed = PLAYER.SPEED

    // Update player animation based on movement
    if (left || right || up || down) {
      if (this.player.anims.currentAnim?.key !== ANIMATION_KEYS.PLAYER_WALK) {
        this.player.play(ANIMATION_KEYS.PLAYER_WALK)
      }
    } else {
      if (this.player.anims.currentAnim?.key !== ANIMATION_KEYS.PLAYER_IDLE) {
        this.player.play(ANIMATION_KEYS.PLAYER_IDLE)
      }
    }

    // Apply velocity based on input
    if (left) {
      body.setVelocityX(-playerSpeed)
      this.player.setFlipX(true) // Flip sprite for left movement
    } else if (right) {
      body.setVelocityX(playerSpeed)
      this.player.setFlipX(false) // Reset flip for right movement
    }

    if (up) {
      body.setVelocityY(-playerSpeed)
    } else if (down) {
      body.setVelocityY(playerSpeed)
    }

    // Normalize diagonal movement to prevent faster movement
    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(playerSpeed)
    }

    // Chaser enemy behavior update
    this.chasers?.children.each((chaser) => {
      if (chaser instanceof Phaser.Physics.Arcade.Sprite && this.player) {
        const distance = Phaser.Math.Distance.Between(chaser.x, chaser.y, this.player.x, this.player.y)
        const maxDistance = this.cameras.main.worldView.height * 1.5 // Chasers despawn if too far from camera

        // If chaser is too far from camera, destroy it and spawn a new one
        if (distance > maxDistance) {
          chaser.destroy()
          this.spawnChaser() // Replace the despawned chaser
          return true // Continue iteration
        }

        // If chaser has stopped or is far from player, re-target it
        if (chaser.body && ((chaser.body.velocity.x === 0 && chaser.body.velocity.y === 0) || distance > 50)) {
          this.physics.moveToObject(chaser, this.player, this.difficultyManager.getChaserSpeed())
        }
      }
      return true // Continue iteration
    })
  }

  /**
   * Updates the countdown text displayed on the UI.
   */
  protected updateText(): void {
    const level1Strings = localizationManager.getStrings().level1
    if (this.countdownText) {
      // Update text with remaining time, clamped at 0
      this.countdownText.setText(level1Strings.survive.replace('{time}', Math.max(0, this.winTimeRemaining).toFixed(0)))
    }
  }

  /**
   * Decrements the win time remaining and updates the UI.
   * Triggers winGame() if time runs out.
   */
  protected updateCountdown(): void {
    if (this.isGameOver) return // Stop countdown if game is already over

    this.winTimeRemaining-- // Decrement time
    this.updateText() // Update text with new time
    this.updateProgressBar() // Update progress bar

    // Check for win condition
    if (this.winTimeRemaining <= 0) {
      this.winGame()
    }
  }

  /**
   * Updates the visual progress bar based on the remaining survival time.
   */
  protected updateProgressBar(): void {
    if (this.progressBar) {
      const config = this.getLevelConfig()
      // Calculate progress as a ratio, clamped between 0 and 1
      const progress = Math.max(0, this.winTimeRemaining / (config.timeToSurviveMs / 1000))
      const barWidth = this.scale.width * progress // Calculate bar width based on progress
      this.progressBar.clear() // Clear previous drawing
      this.progressBar.fillStyle(0x00ff00, 1) // Set fill color (green)
      this.progressBar.fillRect(0, 0, barWidth, 50) // Draw the filled rectangle
    }
  }

  /**
   * Handles the game over state.
   * Disables input, pauses the scene, stops timers, plays sound, and transitions to the Game Over scene.
   */
  protected gameOver(): void {
    // State guard: Ensure this method's logic only runs once
    if (this.isGameOver) return
    this.isGameOver = true // Set game over flag

    this.sound.play(AUDIO_KEYS.COLLISION) // Play collision sound

    // Disable input to prevent further actions
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }
    this.scene.pause(this.scene.key) // Pause the current level scene

    // Destroy active timers
    if (this.chaserSpawnTimer) this.chaserSpawnTimer.destroy()
    if (this.winTimerEvent) this.winTimerEvent.destroy()

    const finalScore = (this.time.now - this.startTime) / 1000 // Calculate final score

    // Transition to the Game Over scene
    if (this.scene.manager.keys[SCENE_KEYS.GAME_OVER]) {
      this.scene.stop(this.scene.key) // Stop the current scene
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore }) // Start Game Over scene with score
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.GAME_OVER}`)
      this.scene.stop() // Fallback: just stop the current scene
    }
  }

  /**
   * Handles the win game state.
   * Disables input, pauses the scene, stops timers, and transitions to the Win scene.
   */
  protected winGame(): void {
    // State guard: Ensure this method's logic only runs once
    if (this.isGameOver) return
    this.isGameOver = true // Set game over flag (used as a general game-ended flag)

    // Disable input immediately
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }
    this.scene.pause(this.scene.key) // Pause the current level scene

    // Destroy active timers
    if (this.chaserSpawnTimer) this.chaserSpawnTimer.destroy()
    if (this.winTimerEvent) this.winTimerEvent.destroy()

    const finalScore = (this.time.now - this.startTime) / 1000 // Calculate final score

    // Transition to the Win scene
    if (this.scene.manager.keys[SCENE_KEYS.WIN]) {
      this.scene.stop(this.scene.key) // Stop the current scene
      this.scene.start(SCENE_KEYS.WIN, { score: finalScore }) // Start Win scene with score
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.WIN}`)
      this.scene.stop() // Fallback: just stop the current scene
    }
  }

  /**
   * Handles the game window losing focus (blur event).
   * Pauses the game if it's not already paused.
   */
  protected handleGameBlur(): void {
    if (!this.scene.isPaused()) {
      this.togglePause() // Automatically pause when game window loses focus
    }
  }

  /**
   * Handles game window resize events to adjust UI elements.
   * @param gameSize The new size of the game canvas.
   */
  protected handleResize(gameSize: Phaser.Structs.Size): void {
    const { width } = gameSize
    // Adjust mini-map camera viewport
    if (this.miniMapCamera) {
      this.miniMapCamera.setViewport(width - 200, 0, 200, 200)
    }
    // Redraw mini-map border
    if (this.miniMapBorder) {
      this.miniMapBorder.clear()
      this.miniMapBorder.lineStyle(2, 0x00ff00, 1)
      this.miniMapBorder.strokeRect(width - 200, 0, 200, 200)
    }
    // Reposition countdown text (if needed, though origin handles most)
    if (this.countdownText) {
      this.countdownText.setPosition(10, 15)
    }
    // Redraw progress bar background
    if (this.progressBarBackground) {
      this.progressBarBackground.clear()
      this.progressBarBackground.fillStyle(0x333333, 0.8)
      this.progressBarBackground.fillRect(0, 0, width, 50)
    }
    // Update progress bar width
    if (this.progressBar) {
      this.progressBar.clear()
      this.updateProgressBar() // Recalculate and redraw based on current progress
    }
  }

  /**
   * Displays a critical error message on the screen and pauses the game.
   * @param message The error message to display.
   */
  protected showError(message: string): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, message, {
        color: 'red',
        fontSize: '32px',
      })
      .setOrigin(0.5) // Center the text
    this.scene.pause() // Pause the scene to prevent further interaction
  }

  /**
   * Toggles the visibility of the mini-map.
   * @param visible Optional boolean to explicitly set visibility. If undefined, toggles current state.
   */
  public toggleMiniMap(visible?: boolean): void {
    // Set visibility state: if 'visible' is provided, use it; otherwise, invert current state
    this.isMiniMapVisible = visible !== undefined ? visible : !this.isMiniMapVisible

    // Apply visibility to mini-map camera and border
    if (this.miniMapCamera) {
      this.miniMapCamera.setVisible(this.isMiniMapVisible)
    }
    if (this.miniMapBorder) {
      this.miniMapBorder.setVisible(this.isMiniMapVisible)
    }
  }
}
