import Phaser from 'phaser'
import {
  ANIMATION_KEYS,
  SCENE_KEYS,
  TEXTURE_KEYS,
  AUDIO_KEYS,
  DIFFICULTY,
  WIN_CONDITION,
  PLAYER,
} from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'
import { TileGenerator } from '../world/TileGenerator'
import { EnemyFactory } from '../game/EnemyFactory'
import { ENEMY_TYPES, ENEMY_CONFIGS } from '../data/enemyData'
import { DifficultyManager } from '../utils/DifficultyManager'

/**
 * The main gameplay scene where the player interacts with the game world, enemies, and collects items.
 * Handles core game mechanics including:
 * - Player movement and controls
 * - Enemy spawning and AI behavior
 * - World generation and chunk loading
 * - Difficulty scaling
 * - Win/lose conditions
 * - UI elements like score and timer
 */
class Level1Scene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite // The player character sprite
  private chasers?: Phaser.Physics.Arcade.Group // Group containing all enemy chasers
  private groundLayers?: Phaser.Physics.Arcade.Group // Group for all ground tile layers
  private wasdCursors?: Phaser.Types.Input.Keyboard.CursorKeys // WASD keyboard controls
  private arrowCursors?: Phaser.Types.Input.Keyboard.CursorKeys // Arrow key controls
  private chaserSpawnTimer?: Phaser.Time.TimerEvent // Timer for spawning new enemies
  private winTimerEvent?: Phaser.Time.TimerEvent // Timer tracking win condition progress

  private startTime: number = 0 // Timestamp when scene was created (for score calculation)
  private score: number = 0 // Current player score (time survived in seconds)
  private miniMapCamera?: Phaser.Cameras.Scene2D.Camera // Camera for the mini-map display
  private miniMapBorder?: Phaser.GameObjects.Graphics // Border around the mini-map
  private isGameOver: boolean = false // Flag indicating if game has ended
  public isMiniMapVisible: boolean = false // Controls mini-map visibility

  private tileGenerator?: TileGenerator // Handles procedural world generation
  private readonly TILE_SIZE = 64 // Size of each tile in pixels
  private readonly CHUNK_SIZE_TILES = 10 // Each chunk is 10x10 tiles
  private readonly WORLD_MAX_CHUNKS_X = 10 // World width in chunks
  private readonly WORLD_MAX_CHUNKS_Y = 10 // World height in chunks
  private loadedChunks: Map<string, Phaser.Tilemaps.Tilemap> = new Map() // Cache of generated chunks
  private currentChunkX: number = 0 // Player's current chunk X coordinate
  private currentChunkY: number = 0 // Player's current chunk Y coordinate

  // Difficulty manager
  private difficultyManager!: DifficultyManager

  // Debug and distance constants
  private readonly DEBUG_DISTANCE = false // Toggles distance debug logging
  private readonly MAX_DISTANCE_MULTIPLIER = 1 // Max distance enemies can be from player (1x screen width)

  // Win condition properties
  private winTimeRemaining: number // Time remaining to survive (seconds)
  private countdownText?: Phaser.GameObjects.Text // UI text showing time remaining
  private progressBar?: Phaser.GameObjects.Graphics // Visual progress bar for time remaining
  private progressBarBackground?: Phaser.GameObjects.Graphics // Background for progress bar

  constructor() {
    super({ key: SCENE_KEYS.LEVEL1 })
    this.difficultyManager = new DifficultyManager(this)
    this.winTimeRemaining = WIN_CONDITION.TIME_TO_SURVIVE_MS / 1000 // Convert to seconds
  }

  /**
   * Initializes the game world, player, enemies, UI, and game logic.
   * Called automatically by Phaser when the scene starts.
   */
  create(): void {
    // Play background music with looping and reduced volume
    this.sound.play(AUDIO_KEYS.IN_GAME_MUSIC, { loop: true, volume: 0.5 })

    // Listen for language changes to update UI text
    localizationManager.addChangeListener(() => this.updateText())

    // Re-enable keyboard input on scene creation
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }
    this.isGameOver = false // Reset the flag on scene creation
    this.score = 0 // Initialize score
    this.startTime = this.time.startTime // Set start time for score calculation
    this.winTimeRemaining = WIN_CONDITION.TIME_TO_SURVIVE_MS / 1000 // Reset win timer

    this.tileGenerator = new TileGenerator(this, this.TILE_SIZE)

    // Initial chunk generation around the player's starting position
    this.groundLayers = this.physics.add.group() // Initialize the ground layers group
    this.currentChunkX = Math.floor(this.WORLD_MAX_CHUNKS_X / 2)
    this.currentChunkY = Math.floor(this.WORLD_MAX_CHUNKS_Y / 2)
    this.generateSurroundingChunks(this.currentChunkX, this.currentChunkY)

    // Calculate player starting position based on the initial chunk
    const playerX = (this.currentChunkX * this.CHUNK_SIZE_TILES + this.CHUNK_SIZE_TILES / 2) * this.TILE_SIZE
    const playerY = (this.currentChunkY * this.CHUNK_SIZE_TILES + this.CHUNK_SIZE_TILES / 2) * this.TILE_SIZE
    try {
      this.player = this.physics.add.sprite(playerX, playerY, TEXTURE_KEYS.IDLE)
      this.player.setCollideWorldBounds(true)
      this.player.setScale(1).play(ANIMATION_KEYS.PLAYER_IDLE)
      this.player.setDepth(10) // Ensure player is always on top of the tiles

      // Make camera follow player and set bounds to world dimensions
      this.cameras.main.startFollow(this.player)
      this.updateWorldBounds() // Sets camera bounds to match world size

      // Create mini-map camera
      this.miniMapCamera = this.cameras
        .add(
          this.scale.width - 200, // X position (top right)
          0, // Y position
          200, // Width
          200, // Height
          false, // Not main camera
        )
        .setZoom(0.1)
        .setName('miniMap') // Zoom out to show more of the world
      this.miniMapCamera.setBackgroundColor(0x000000) // Black background for mini-map
      this.miniMapCamera.startFollow(this.player) // Mini-map also follows the player
      this.miniMapCamera.setViewport(this.scale.width - 200, 0, 200, 200) // Ensure correct viewport after setting zoom
      this.miniMapCamera.setOrigin(0.5, 0.5) // Set origin to center for easier positioning
      this.miniMapCamera.setAlpha(0.7) // Add opacity to the minimap
      this.miniMapBorder = this.add
        .graphics()
        .setScrollFactor(0) // Make the border fixed on the camera
        .lineStyle(2, 0x00ff00, 1) // Green border, 2 pixels thick
        .strokeRect(this.scale.width - 200, 0, 200, 200) // Draw border around minimap viewport
      this.toggleMiniMap(this.isMiniMapVisible) // Set initial visibility based on the property

      // Add countdown text for win condition
      this.countdownText = this.add
        .text(10, 15, '', {
          // Initial text will be set by updateText()
          fontFamily: 'Staatliches',
          fontSize: '28px', // Adjusted for better fit inside bar
          color: '#000000', // Black text for contrast
          stroke: '#ffffff', // White stroke for contrast
          strokeThickness: 4,
        })
        .setOrigin(0, 0.5) // Left-aligned, vertically centered
        .setScrollFactor(0) // Fixed on camera
        .setDepth(100) // Highest depth

      // Add progress bar background
      this.progressBarBackground = this.add
        .graphics()
        .setScrollFactor(0)
        .setDepth(98) // Below countdown text
        .fillStyle(0x333333, 0.8) // Dark grey, semi-transparent
        .fillRect(0, 0, this.scale.width, 50) // Full width, at the very top, thicker

      // Add progress bar
      this.progressBar = this.add
        .graphics()
        .setScrollFactor(0)
        .setDepth(99) // Below countdown text, above background
        .fillStyle(0x00ff00, 1) // Green, opaque
        .fillRect(0, 0, this.scale.width, 50) // Initial full width, at the very top, thicker

      // Add resize event listener
      this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)
      this.updateText() // Initial text update
    } catch (error) {
      console.error('Fatal Error: Could not create player sprite. Check if assets loaded correctly.', error)
      // Fallback: Stop the scene and maybe show an error.
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, 'CRITICAL ERROR\nCould not start game.', {
          color: 'red',
          fontSize: '32px',
        })
        .setOrigin(0.5)
      this.scene.pause()
      return
    }

    this.wasdCursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Phaser.Types.Input.Keyboard.CursorKeys

    this.arrowCursors = this.input.keyboard?.createCursorKeys()

    // --- Add keyboard listeners for pausing ---
    this.input.keyboard?.on('keydown-P', this.togglePause, this)
    // Bind ESC key to pause functionality
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this)

    // Add event listener for when the game loses focus (blurs)
    this.sys.game.events.on('blur', this.handleGameBlur, this)

    // Add event listener for when the scene resumes
    this.events.on(
      Phaser.Scenes.Events.RESUME,
      () => {
        if (this.input.keyboard) {
          this.input.keyboard.enabled = true
          // Re-add pause keyboard listeners when the scene resumes
          this.input.keyboard.on('keydown-P', this.togglePause, this)
          this.input.keyboard.on('keydown-ESC', this.togglePause, this)
        }
        // Resume timers
        if (this.chaserSpawnTimer) this.chaserSpawnTimer.paused = false
        if (this.winTimerEvent) this.winTimerEvent.paused = false
      },
      this,
    )

    // Initialize chasers group correctly for physics sprites
    this.chasers = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite, // Ensure children are sprites
      runChildUpdate: true, // Allow children to have their own update logic if needed
    })

    // Add collider between player and chasers
    // Set up collision detection between player and enemies
    this.physics.add.collider(this.player!, this.chasers, this.gameOver, undefined, this)

    // Chaser spawn timer
    this.chaserSpawnTimer = this.difficultyManager.createSpawnTimer(this.spawnChaser, this)

    // Win condition timer
    this.winTimerEvent = this.time.addEvent({
      delay: 1000, // Update every second
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true,
    })

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Stop in-game music
      this.sound.stopByKey(AUDIO_KEYS.IN_GAME_MUSIC)

      // 1. Stop processing new input events
      this.input.keyboard?.off('keydown-P', this.togglePause, this)
      this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
      this.events.off(Phaser.Scenes.Events.RESUME) // Clean up resume listener
      localizationManager.removeChangeListener(() => this.updateText()) // Remove language change listener

      // 2. Nullify input-related properties immediately after removing listeners
      this.wasdCursors = undefined
      this.arrowCursors = undefined

      // 3. Stop timers
      if (this.chaserSpawnTimer) {
        this.chaserSpawnTimer.remove()
        this.chaserSpawnTimer = undefined // Nullify here too
      }
      if (this.winTimerEvent) {
        this.winTimerEvent.remove()
        this.winTimerEvent = undefined
      }

      // 4. Explicitly destroy Tilemap objects from loadedChunks
      this.loadedChunks.forEach((tilemap) => {
        tilemap.destroy()
      })
      this.loadedChunks.clear()

      // 5. Nullify remaining references
      this.player = undefined
      this.tileGenerator = undefined
      this.groundLayers = undefined
      this.chasers = undefined
      this.miniMapCamera = undefined
      this.miniMapBorder = undefined
      this.countdownText = undefined
      this.progressBar = undefined
      this.progressBarBackground = undefined

      // Remove blur event listener on shutdown
      this.sys.game.events.off('blur', this.handleGameBlur, this)
    })
  }

  /**
   * Handles game blur event (when window loses focus)
   * Automatically pauses the game if not already paused
   */
  private handleGameBlur(): void {
    if (!this.scene.isPaused()) {
      this.togglePause()
    }
  }

  /**
   * Generates a new world chunk at specified coordinates
   * @param chunkX - X coordinate of chunk in world space
   * @param chunkY - Y coordinate of chunk in world space
   * @returns The generated tilemap for the chunk
   */
  private generateChunk(chunkX: number, chunkY: number): Phaser.Tilemaps.Tilemap {
    const chunkKey = `${chunkX}_${chunkY}`
    if (this.loadedChunks.has(chunkKey)) {
      return this.loadedChunks.get(chunkKey)! // This '!' is safe due to the has() check
    }

    const tileMapData: number[][] = []
    for (let y = 0; y < this.CHUNK_SIZE_TILES; y++) {
      const row: number[] = []
      for (let x = 0; x < this.CHUNK_SIZE_TILES; x++) {
        // Simple procedural generation: mostly grass, with some dirt and dirt paths
        if (Math.random() < 0.1) {
          row.push(1) // Dirt path
        } else if (Math.random() < 0.3) {
          row.push(2) // Dirt
        } else {
          row.push(0) // Grass
        }
      }
      tileMapData.push(row)
    }

    // Explicit checks for tileGenerator and groundLayers
    if (!this.tileGenerator) {
      console.error('Level1Scene: TileGenerator is not initialized. Cannot generate chunk.')
      this.gameOver() // Trigger game over on critical initialization error
      return this.make.tilemap({ data: [], tileWidth: this.TILE_SIZE, tileHeight: this.TILE_SIZE }) // Return dummy
    }

    let map: Phaser.Tilemaps.Tilemap
    try {
      map = this.tileGenerator.createTilemap(tileMapData)
    } catch (error) {
      console.error(`Level1Scene: Failed to create tilemap for chunk ${chunkKey}.`, error)
      this.gameOver() // Trigger game over
      return this.make.tilemap({ data: [], tileWidth: this.TILE_SIZE, tileHeight: this.TILE_SIZE }) // Return dummy
    }

    if (!this.groundLayers) {
      console.error('Level1Scene: GroundLayers group is not initialized. Cannot add ground layer.')
      this.gameOver() // Trigger game over on critical initialization error
      return map // Return the map that was created, even if layer failed
    }

    try {
      const groundLayer = this.tileGenerator.createLayer(map, `Ground_${chunkKey}`, 'world_tileset')
      groundLayer.setDepth(0)
      groundLayer.x = chunkX * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      groundLayer.y = chunkY * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      this.groundLayers.add(groundLayer)
    } catch (error) {
      console.error(`Level1Scene: Failed to create ground layer for chunk ${chunkKey}.`, error)
      this.gameOver() // Trigger game over
      return map // Return the map that was created, even if layer failed
    }

    this.loadedChunks.set(chunkKey, map)
    return map
  }

  /**
   * Generates chunks around the specified center coordinates
   * Based on current viewport size to ensure proper loading
   * @param centerX - Center X coordinate in world space
   * @param centerY - Center Y coordinate in world space
   */
  private generateSurroundingChunks(centerX: number, centerY: number): void {
    const chunksNeededX = Math.ceil(this.scale.width / (this.CHUNK_SIZE_TILES * this.TILE_SIZE)) + 2
    const chunksNeededY = Math.ceil(this.scale.height / (this.CHUNK_SIZE_TILES * this.TILE_SIZE)) + 2

    const startX = Math.max(0, centerX - Math.floor(chunksNeededX / 2))
    const endX = Math.min(this.WORLD_MAX_CHUNKS_X - 1, centerX + Math.ceil(chunksNeededX / 2))
    const startY = Math.max(0, centerY - Math.floor(chunksNeededY / 2))
    const endY = Math.min(this.WORLD_MAX_CHUNKS_Y - 1, centerY + Math.ceil(chunksNeededY / 2))

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        this.generateChunk(x, y)
      }
    }
    this.updateWorldBounds()
  }

  /**
   * Updates world bounds to match current world dimensions
   * Ensures physics and camera stay within proper limits
   */
  private updateWorldBounds(): void {
    const worldWidth = this.WORLD_MAX_CHUNKS_X * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    const worldHeight = this.WORLD_MAX_CHUNKS_Y * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
  }

  /**
   * Toggles game pause state
   * Handles pausing/resuming timers and showing/hiding pause menu
   */
  private togglePause(): void {
    if (!this.scene.isPaused()) {
      // Disable keyboard before pausing to prevent input issues on resume
      if (this.input.keyboard) {
        this.input.keyboard.enabled = false
      }
      this.scene.pause()

      // Pause timers
      if (this.chaserSpawnTimer) this.chaserSpawnTimer.paused = true
      if (this.winTimerEvent) this.winTimerEvent.paused = true

      if (this.scene.manager.keys[SCENE_KEYS.PAUSE]) {
        this.scene.launch(SCENE_KEYS.PAUSE)
      } else {
        console.error(`Pause scene key not found: ${SCENE_KEYS.PAUSE}. Cannot pause game.`)
        this.scene.resume()
        if (this.input.keyboard) {
          this.input.keyboard.enabled = true
        }
      }
    }
  }

  private spawnChaser(): void {
    if (this.scene.isPaused() || !this.scene.isActive(SCENE_KEYS.LEVEL1)) {
      return
    }

    // Ensure chasers group exists before checking its length or adding to it
    if (!this.chasers) {
      console.error('Level1Scene: Chasers group is not initialized. Cannot spawn chaser.')
      return
    }

    // Limit the number of active chasers to prevent performance issues
    const MAX_CHASERS = 20 // Adjust as needed
    if (this.chasers.getLength() >= MAX_CHASERS) {
      return
    }

    // Spawn chaser at a random position outside the camera view but within world bounds
    const camera = this.cameras.main
    let x, y
    const spawnPadding = 100 // Fixed padding
    console.log('Attempting to spawn chaser') // Debug log

    // Determine spawn side (top, bottom, left, right)
    const side = Phaser.Math.Between(0, 3)

    // Try up to 5 times to find a good spawn position
    for (let i = 0; i < 5; i++) {
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
        default:
          x = camera.worldView.centerX
          y = camera.worldView.centerY
          break
      }

      // Ensure spawn position is within world bounds
      const worldWidth = this.WORLD_MAX_CHUNKS_X * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      const worldHeight = this.WORLD_MAX_CHUNKS_Y * this.CHUNK_SIZE_TILES * this.TILE_SIZE
      x = Phaser.Math.Clamp(x, 0, worldWidth)
      y = Phaser.Math.Clamp(y, 0, worldHeight)

      // Simple spawn position validation
      if (this.player) {
        console.log(`Spawning at x: ${x}, y: ${y}`) // Debug log
      }
      break // Accept this position
    }

    // Get the configuration for the basic chaser enemy
    const chaserConfig = ENEMY_CONFIGS[ENEMY_TYPES.BASIC_CHASER]

    // Ensure valid spawn coordinates
    const spawnX = x !== undefined ? x : camera.worldView.centerX
    const spawnY = y !== undefined ? y : camera.worldView.centerY

    // Use the EnemyFactory to create the chaser sprite
    const chaser = EnemyFactory.createEnemy(this, chaserConfig, spawnX, spawnY)

    // Add the created chaser to the chasers group
    this.chasers.add(chaser)

    // The chaser's speed is dynamically controlled by the DifficultyManager
    if (this.player) {
      this.physics.moveToObject(chaser, this.player, this.difficultyManager.getChaserSpeed())
    }
  }

  /**
   * Handles continuous game logic updates.
   * Called automatically by Phaser every frame.
   * Manages:
   * - Player movement and input
   * - Enemy AI updates
   * - Score tracking
   * - World chunk loading
   */
  update(): void {
    if (!this.player || !this.player.body || !this.wasdCursors || !this.arrowCursors || this.isGameOver) return

    // Update score based on time survived
    this.score = (this.time.now - this.startTime) / 1000 // Score is seconds survived
    this.updateDifficulty() // Call difficulty scaling logic

    // Check win condition
    if (this.winTimeRemaining <= 0 && !this.isGameOver) {
      this.winGame()
      return // Stop further updates if game is won
    }

    const playerChunkX = Math.floor(this.player.x / (this.CHUNK_SIZE_TILES * this.TILE_SIZE))
    const playerChunkY = Math.floor(this.player.y / (this.CHUNK_SIZE_TILES * this.TILE_SIZE))

    if (playerChunkX !== this.currentChunkX || playerChunkY !== this.currentChunkY) {
      this.currentChunkX = playerChunkX
      this.currentChunkY = playerChunkY
      this.generateSurroundingChunks(this.currentChunkX, this.currentChunkY)
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    // --- Unified Input and Animation ---
    const left = this.wasdCursors.left.isDown || this.arrowCursors.left.isDown
    const right = this.wasdCursors.right.isDown || this.arrowCursors.right.isDown
    const up = this.wasdCursors.up.isDown || this.arrowCursors.up.isDown
    const down = this.wasdCursors.down.isDown || this.arrowCursors.down.isDown

    // Player speed (can be a fixed value or scaled later if needed)
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
      this.player.setFlipX(true) // Flip sprite to face left when moving left
    } else if (right) {
      body.setVelocityX(playerSpeed)
      this.player.setFlipX(false) // Face right when moving right
    }

    if (up) {
      body.setVelocityY(-playerSpeed) // Move up
    } else if (down) {
      body.setVelocityY(playerSpeed) // Move down
    }

    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(playerSpeed)
    }

    // Chaser movement logic (chasers always move towards the player)
    this.chasers?.children.each((chaser) => {
      if (chaser instanceof Phaser.Physics.Arcade.Sprite && this.player) {
        const distance = Phaser.Math.Distance.Between(chaser.x, chaser.y, this.player.x, this.player.y)
        const maxDistance = this.cameras.main.worldView.height * this.MAX_DISTANCE_MULTIPLIER

        if (this.DEBUG_DISTANCE) {
          console.log(
            `Enemy distance: ${distance}px, Max allowed: ${maxDistance}px, Window width: ${this.cameras.main.worldView.width}px`,
          )
        }

        // If chaser is too far away, destroy and respawn it
        if (distance > maxDistance) {
          chaser.destroy()
          this.spawnChaser()
          return true // Continue iteration
        }

        // Re-target chasers if they are not moving or if player moved significantly
        // This ensures they keep chasing even if their initial target was slightly off
        if (chaser.body && ((chaser.body.velocity.x === 0 && chaser.body.velocity.y === 0) || distance > 50)) {
          this.physics.moveToObject(chaser, this.player, this.difficultyManager.getChaserSpeed())
        }
      }
      return true // Continue iteration
    })
  }

  /**
   * Updates all text elements in the scene based on the current language.
   * This method is called when the language changes via LocalizationManager.
   */
  /**
   * Updates all UI text elements based on current language
   * Called when language changes or text needs refreshing
   */
  private updateText(): void {
    const level1Strings = localizationManager.getStrings().level1
    if (this.countdownText) {
      this.countdownText.setText(level1Strings.survive.replace('{time}', Math.max(0, this.winTimeRemaining).toFixed(0)))
    }
  }

  /**
   * Updates the win condition countdown timer
   * Decrements remaining time and checks for win condition
   */
  private updateCountdown(): void {
    if (this.isGameOver) return // Stop countdown if game is over

    this.winTimeRemaining--
    this.updateText() // Update text with new time
    this.updateProgressBar()

    if (this.winTimeRemaining <= 0) {
      this.winGame()
    }
  }

  /**
   * Updates game difficulty based on player's score
   * Increases enemy speed and reduces spawn delay progressively
   */
  private updateDifficulty(): void {
    // Do not update difficulty if the scene is paused
    if (this.scene.isPaused()) {
      return
    }

    // Update difficulty using the DifficultyManager
    const difficultyUpdated = this.difficultyManager.updateDifficulty(this.score)

    // Update spawn delay if it has changed and reset timer
    if (difficultyUpdated) {
      this.chaserSpawnTimer?.remove() // Remove old timer
      this.chaserSpawnTimer = this.difficultyManager.createSpawnTimer(this.spawnChaser, this)

      // Update speed of existing chasers
      this.difficultyManager.updateChasersSpeed(this.chasers!, this.player!)
    }
  }

  /**
   * Handles game over state when player collides with enemy.
   * Stops gameplay, plays sound effects, and transitions to game over scene.
   */
  gameOver() {
    // State guard: Ensure this method's logic only runs once
    if (this.isGameOver) {
      return
    }
    this.isGameOver = true

    // Play sound immediately on collision
    this.sound.play(AUDIO_KEYS.COLLISION)

    // 1. Disable input immediately
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }

    // 2. Pause the scene to stop update() loop and other scene processing
    this.scene.pause(SCENE_KEYS.LEVEL1) // Explicitly pause this scene

    // 3. Remove timers
    this.chaserSpawnTimer?.remove(false)
    this.winTimerEvent?.remove(false) // Remove win timer too

    const finalScore = (this.time.now - this.startTime) / 1000

    // 4. Stop Level1Scene and start GameOverScene
    // Stopping the scene will trigger the SHUTDOWN event, which handles further cleanup.
    if (this.scene.manager.keys[SCENE_KEYS.GAME_OVER]) {
      this.scene.stop(SCENE_KEYS.LEVEL1)
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore }) // Pass the final score
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.GAME_OVER}. Cannot show game over screen.`)
      this.scene.stop() // Fallback: just stop the current scene
    }
  }

  winGame() {
    // State guard: Ensure this method's logic only runs once
    if (this.isGameOver) {
      return
    }
    this.isGameOver = true // Use isGameOver as a general game-ended flag

    // 1. Disable input immediately
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }

    // 2. Pause the scene to stop update() loop and other scene processing
    this.scene.pause(SCENE_KEYS.LEVEL1)

    // 3. Remove timers
    this.chaserSpawnTimer?.remove(false)
    this.winTimerEvent?.remove(false)

    const finalScore = (this.time.now - this.startTime) / 1000

    // 4. Stop Level1Scene and start WinScene
    if (this.scene.manager.keys[SCENE_KEYS.WIN]) {
      this.scene.stop(SCENE_KEYS.LEVEL1)
      this.scene.start(SCENE_KEYS.WIN, { score: finalScore }) // Pass the final score
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.WIN}. Cannot show win screen.`)
      this.scene.stop() // Fallback: just stop the current scene
    }
  }

  /**
   * Handles game window resize events
   * Adjusts UI elements and camera viewports
   * @param gameSize - New game dimensions after resize
   */
  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width } = gameSize
    if (this.miniMapCamera) {
      this.miniMapCamera.setViewport(width - 200, 0, 200, 200)
    }
    if (this.miniMapBorder) {
      this.miniMapBorder.clear()
      this.miniMapBorder.lineStyle(2, 0x00ff00, 1)
      this.miniMapBorder.strokeRect(width - 200, 0, 200, 200)
      this.miniMapBorder.strokeRect(width - 200, 0, 200, 200)
    }
    if (this.countdownText) {
      this.countdownText.setPosition(10, 15) // Fixed position, left-aligned, top of scene
    }
    if (this.progressBarBackground) {
      this.progressBarBackground.clear()
      this.progressBarBackground.fillStyle(0x333333, 0.8)
      this.progressBarBackground.fillRect(0, 0, width, 50) // Full width, thicker
    }
    if (this.progressBar) {
      this.progressBar.clear()
      this.updateProgressBar() // Recalculate and redraw progress bar
    }
  }

  /**
   * Updates progress bar visualization based on remaining time
   * Shows percentage of time survived toward win condition
   */
  private updateProgressBar(): void {
    if (this.progressBar) {
      const progress = Math.max(0, this.winTimeRemaining / (WIN_CONDITION.TIME_TO_SURVIVE_MS / 1000))
      const barWidth = this.scale.width * progress
      this.progressBar.clear()
      this.progressBar.fillStyle(0x00ff00, 1)
      this.progressBar.fillRect(0, 0, barWidth, 50) // Full width, thicker
    }
  }

  /**
   * Toggles the visibility of the minimap.
   * If a 'visible' boolean is provided, it sets the visibility to that state.
   * Otherwise, it toggles the current visibility state.
   * @param visible - Optional boolean to set the minimap's visibility.
   */
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

export default Level1Scene
