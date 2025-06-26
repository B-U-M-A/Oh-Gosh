import Phaser from 'phaser'
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS, AUDIO_KEYS, DIFFICULTY, WIN_CONDITION } from '../utils/constants'
import { TileGenerator } from '../world/TileGenerator'
import { EnemyFactory } from '../game/EnemyFactory'
import { ENEMY_TYPES, ENEMY_CONFIGS } from '../data/enemyData' // Add this import

class Level1Scene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite
  private chasers?: Phaser.Physics.Arcade.Group
  private groundLayers?: Phaser.Physics.Arcade.Group // New group for ground layers
  private wasdCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private arrowCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private chaserSpawnTimer?: Phaser.Time.TimerEvent
  private winTimerEvent?: Phaser.Time.TimerEvent // New: Timer for win condition

  private startTime: number = 0
  private score: number = 0
  private miniMapCamera?: Phaser.Cameras.Scene2D.Camera
  private miniMapBorder?: Phaser.GameObjects.Graphics
  private isGameOver: boolean = false
  public isMiniMapVisible: boolean = false

  private tileGenerator?: TileGenerator
  private readonly TILE_SIZE = 64
  private readonly CHUNK_SIZE_TILES = 10 // Each chunk will be 10x10 tiles
  private readonly WORLD_MAX_CHUNKS_X = 10 // Max 10 chunks wide
  private readonly WORLD_MAX_CHUNKS_Y = 10 // Max 10 chunks high
  private loadedChunks: Map<string, Phaser.Tilemaps.Tilemap> = new Map()
  private currentChunkX: number = 0
  private currentChunkY: number = 0

  // Difficulty scaling properties
  private currentChaserSpeed: number
  private currentSpawnDelay: number
  private lastDifficultyUpdateScore: number = 0

  // Win condition properties
  private winTimeRemaining: number
  private countdownText?: Phaser.GameObjects.Text
  private progressBar?: Phaser.GameObjects.Graphics
  private progressBarBackground?: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: SCENE_KEYS.LEVEL1 })
    this.currentChaserSpeed = DIFFICULTY.INITIAL_CHASER_SPEED
    this.currentSpawnDelay = DIFFICULTY.INITIAL_SPAWN_DELAY
    this.winTimeRemaining = WIN_CONDITION.TIME_TO_SURVIVE_MS / 1000 // Convert to seconds
  }

  create(): void {
    // Re-enable keyboard input on scene creation
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }
    this.isGameOver = false // Reset the flag on scene creation
    this.score = 0 // Initialize score
    this.startTime = this.time.startTime // Set start time for score calculation
    this.lastDifficultyUpdateScore = 0 // Reset difficulty tracking
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

      // Configure main camera to follow the player
      this.cameras.main.startFollow(this.player)
      this.updateWorldBounds() // Set initial camera bounds based on the world size

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
        .text(10, 15, `Survive: ${this.winTimeRemaining.toFixed(0)}s`, {
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
    this.physics.add.collider(this.player!, this.chasers, this.gameOver, undefined, this)

    // Chaser spawn timer
    this.chaserSpawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelay,
      callback: this.spawnChaser,
      callbackScope: this,
      loop: true,
    })

    // Win condition timer
    this.winTimerEvent = this.time.addEvent({
      delay: 1000, // Update every second
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true,
    })

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      // 1. Stop processing new input events
      this.input.keyboard?.off('keydown-P', this.togglePause, this)
      this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
      this.events.off(Phaser.Scenes.Events.RESUME) // Clean up resume listener

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

  private handleGameBlur(): void {
    if (!this.scene.isPaused()) {
      this.togglePause()
    }
  }

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

  private updateWorldBounds(): void {
    const worldWidth = this.WORLD_MAX_CHUNKS_X * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    const worldHeight = this.WORLD_MAX_CHUNKS_Y * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
  }

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
    const spawnPadding = 100 // Distance outside camera view

    // Determine spawn side (top, bottom, left, right)
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

    // Get the configuration for the basic chaser enemy
    const chaserConfig = ENEMY_CONFIGS[ENEMY_TYPES.BASIC_CHASER]

    // Use the EnemyFactory to create the chaser sprite
    const chaser = EnemyFactory.createEnemy(this, chaserConfig, x, y)

    // Add the created chaser to the chasers group
    this.chasers.add(chaser)

    // The chaser's speed is still dynamically controlled by difficulty scaling
    // and applied here after creation.
    if (this.player) {
      this.physics.moveToObject(chaser, this.player, this.currentChaserSpeed)
    }
  }

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
    const playerSpeed = 200 // Re-introduce player speed constant here or make it a property

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
      this.player.setFlipX(true) // Flip sprite to face left
    } else if (right) {
      body.setVelocityX(playerSpeed)
      this.player.setFlipX(false) // Face right
    }

    if (up) {
      body.setVelocityY(-playerSpeed)
    } else if (down) {
      body.setVelocityY(playerSpeed)
    }

    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(playerSpeed)
    }

    // Chaser movement logic (chasers always move towards the player)
    this.chasers?.children.each((chaser) => {
      if (chaser instanceof Phaser.Physics.Arcade.Sprite && this.player) {
        // Re-target chasers if they are not moving or if player moved significantly
        // This ensures they keep chasing even if their initial target was slightly off
        if (
          chaser.body &&
          ((chaser.body.velocity.x === 0 && chaser.body.velocity.y === 0) ||
            Phaser.Math.Distance.Between(chaser.x, chaser.y, this.player.x, this.player.y) > 50)
        ) {
          this.physics.moveToObject(chaser, this.player, this.currentChaserSpeed)
        }
      }
      return true // Continue iteration
    })
  }

  private updateCountdown(): void {
    if (this.isGameOver) return // Stop countdown if game is over

    this.winTimeRemaining--
    if (this.countdownText) {
      this.countdownText.setText(`Survive: ${Math.max(0, this.winTimeRemaining).toFixed(0)}s`)
    }
    this.updateProgressBar()

    if (this.winTimeRemaining <= 0) {
      this.winGame()
    }
  }

  private updateDifficulty(): void {
    // Do not update difficulty if the scene is paused
    if (this.scene.isPaused()) {
      return
    }

    // Only update difficulty if score has increased enough since last update
    if (this.score - this.lastDifficultyUpdateScore < DIFFICULTY.DIFFICULTY_UPDATE_INTERVAL_SCORE) {
      return
    }
    this.lastDifficultyUpdateScore = this.score

    // Calculate new chaser speed
    const newChaserSpeed = Math.min(
      DIFFICULTY.INITIAL_CHASER_SPEED +
        Math.floor(this.score / DIFFICULTY.SPEED_INCREASE_INTERVAL_SCORE) * DIFFICULTY.SPEED_INCREASE_AMOUNT,
      DIFFICULTY.MAX_CHASER_SPEED,
    )

    // Calculate new spawn delay
    const newSpawnDelay = Math.max(
      DIFFICULTY.INITIAL_SPAWN_DELAY -
        Math.floor(this.score / DIFFICULTY.SPAWN_DECREASE_INTERVAL_SCORE) * DIFFICULTY.SPAWN_DECREASE_AMOUNT,
      DIFFICULTY.MIN_SPAWN_DELAY,
    )

    // Update chaser speed if it has changed
    if (newChaserSpeed !== this.currentChaserSpeed) {
      this.currentChaserSpeed = newChaserSpeed
      // Update speed of existing chasers (re-target them with new speed)
      this.chasers?.children.each((chaser) => {
        if (chaser instanceof Phaser.Physics.Arcade.Sprite && this.player) {
          this.physics.moveToObject(chaser, this.player, this.currentChaserSpeed)
        }
        return true // Continue iteration
      })
      console.log(`Difficulty: Chaser speed increased to ${this.currentChaserSpeed.toFixed(0)}`)
    }

    // Update spawn delay if it has changed and reset timer
    if (newSpawnDelay !== this.currentSpawnDelay) {
      this.currentSpawnDelay = newSpawnDelay
      this.chaserSpawnTimer?.remove() // Remove old timer
      this.chaserSpawnTimer = this.time.addEvent({
        // Add new timer with updated delay
        delay: this.currentSpawnDelay,
        callback: this.spawnChaser,
        callbackScope: this,
        loop: true,
      })
      console.log(`Difficulty: Chaser spawn delay decreased to ${this.currentSpawnDelay.toFixed(0)}ms`)
    }
  }

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
