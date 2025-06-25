import Phaser from 'phaser'
import { sanitizeText } from '../utils/security'
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS, TILE_KEYS } from '../utils/constants'
import { TileGenerator } from '../world/TileGenerator'

class Level1Scene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite
  private chasers?: Phaser.Physics.Arcade.Group
  private groundLayers?: Phaser.Physics.Arcade.Group // New group for ground layers
  private wasdCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private arrowCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private chaserSpawnTimer?: Phaser.Time.TimerEvent
  private activeKeys?: Set<number>
  private wasdCursorsValues: Array<number> = []
  private arrowCursorsValues: Array<number> = []

  private startTime: number = 0
  private miniMapCamera?: Phaser.Cameras.Scene2D.Camera
  private miniMapBorder?: Phaser.GameObjects.Graphics

  private readonly speed = 200
  private readonly chaserSpeed = 100
  private readonly MAX_CHASERS = 3
  private tileGenerator?: TileGenerator
  private readonly TILE_SIZE = 64
  private readonly CHUNK_SIZE_TILES = 10 // Each chunk will be 10x10 tiles
  private readonly WORLD_MAX_CHUNKS_X = 10 // Max 10 chunks wide
  private readonly WORLD_MAX_CHUNKS_Y = 10 // Max 10 chunks high
  private loadedChunks: Map<string, Phaser.Tilemaps.Tilemap> = new Map()
  private currentChunkX: number = 0
  private currentChunkY: number = 0

  constructor() {
    super({ key: SCENE_KEYS.LEVEL1 })
  }

  create(): void {
    // Re-enable keyboard input on scene creation
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true
    }
    this.activeKeys = new Set() // Re-initialize activeKeys on scene creation
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
      this.miniMapCamera.setScroll(playerX - this.miniMapCamera.width / 2, playerY - this.miniMapCamera.height / 2)
      this.miniMapCamera.setViewport(this.scale.width - 200, 0, 200, 200) // Ensure correct viewport after setting zoom
      this.miniMapCamera.setOrigin(0.5, 0.5) // Set origin to center for easier positioning
      this.miniMapCamera.setAlpha(0.7) // Add opacity to the minimap
      this.miniMapBorder = this.add
        .graphics()
        .setScrollFactor(0) // Make the border fixed on the camera
        .lineStyle(2, 0x00ff00, 1) // Green border, 2 pixels thick
        .strokeRect(this.scale.width - 200, 0, 200, 200) // Draw border around minimap viewport
      // this.miniMapCamera.ignore(this.chasers) // Don't show chasers on mini-map

      // Add resize event listener
      this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this)

      // Collisions with the world bounds are handled by setCollideWorldBounds(true) on the player.
      // Individual tile collisions are not needed for a fully walkable floor.
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
    this.wasdCursorsValues = Object.values(this.wasdCursors ?? {}).map((key) => key.keyCode)
    this.arrowCursors = this.input.keyboard?.createCursorKeys()
    this.arrowCursorsValues = Object.values(this.arrowCursors ?? {}).map((key) => key.keyCode)

    // --- Add keyboard listeners for pausing ---
    this.input.keyboard?.on('keydown-P', this.togglePause, this)
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this)
    this.input.keyboard?.on('keydown', this.handleKeyDown, this)
    this.input.keyboard?.on('keyup', this.handleKeyUp, this)

    // Add event listener for when the game loses focus (blurs)
    this.sys.game.events.on('blur', this.handleGameBlur, this)

    this.chasers = this.physics.add.group()
    this.chasers.clear(true, true) // Ensure the group is empty and its children are destroyed on restart
    this.physics.add.collider(this.chasers, this.chasers)

    // Removed: Collision with groundLayers group, as individual tiles should not block movement.

    this.chaserSpawnTimer = this.time.addEvent({
      delay: 7000,
      callback: this.spawnChaser,
      callbackScope: this,
      loop: true,
    })

    this.startTime = this.time.now

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      // 1. Stop processing new input events
      this.input.keyboard?.off('keydown-P', this.togglePause, this)
      this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
      this.input.keyboard?.off('keydown', this.handleKeyDown, this)
      this.input.keyboard?.off('keyup', this.handleKeyUp, this)

      // 2. Nullify input-related properties immediately after removing listeners
      this.activeKeys = undefined
      this.wasdCursors = undefined
      this.arrowCursors = undefined

      // 3. Stop timers
      if (this.chaserSpawnTimer) {
        this.chaserSpawnTimer.remove()
        this.chaserSpawnTimer = undefined // Nullify here too
      }

      // 4. Explicitly destroy Tilemap objects from loadedChunks
      // Destroying the Tilemap should also destroy its associated layers.
      this.loadedChunks.forEach((tilemap) => {
        tilemap.destroy()
      })
      this.loadedChunks.clear() // Clear the map itself

      // 5. Nullify remaining references (Phaser's scene manager should handle destruction)
      this.player = undefined
      this.tileGenerator = undefined
      this.groundLayers = undefined
      this.chasers = undefined
      this.miniMapCamera = undefined // Nullify miniMapCamera reference
      this.miniMapBorder = undefined // Nullify miniMapBorder reference

      // Remove blur event listener on shutdown
      this.sys.game.events.off('blur', this.handleGameBlur, this)
    })
  }

  private handleGameBlur(): void {
    // Pause the scene when the game window loses focus
    if (!this.scene.isPaused()) {
      this.togglePause()
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.activeKeys) return // Defensive check
    this.activeKeys.add(event.keyCode)
  }

  private generateChunk(chunkX: number, chunkY: number): Phaser.Tilemaps.Tilemap {
    const chunkKey = `${chunkX}_${chunkY}`
    if (this.loadedChunks.has(chunkKey)) {
      return this.loadedChunks.get(chunkKey)!
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

    const map = this.tileGenerator!.createTilemap(tileMapData)
    const groundLayer = this.tileGenerator!.createLayer(map, `Ground_${chunkKey}`, 'world_tileset')
    groundLayer.setDepth(0) // Ensure ground layers are at the bottom
    // Removed: setCollisionByProperty as all tiles are walkable.
    groundLayer.x = chunkX * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    groundLayer.y = chunkY * this.CHUNK_SIZE_TILES * this.TILE_SIZE
    this.groundLayers!.add(groundLayer) // Add the newly created layer to the group

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

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.activeKeys) return // Defensive check
    if (this.activeKeys.has(event.keyCode)) {
      this.activeKeys.delete(event.keyCode)
    }
  }

  private togglePause(): void {
    if (!this.scene.isPaused()) {
      this.scene.pause()

      if (this.scene.manager.keys[SCENE_KEYS.PAUSE]) {
        this.scene.launch(SCENE_KEYS.PAUSE)
      } else {
        console.error(`Pause scene key not found: ${SCENE_KEYS.PAUSE}. Cannot pause game.`)
        this.scene.resume()
      }
    }
  }

  private spawnChaser(): void {
    if (
      this.scene.isPaused() ||
      !this.scene.isActive(SCENE_KEYS.LEVEL1) ||
      (this.chasers && this.chasers.getLength() >= this.MAX_CHASERS) // Explicit check for chasers
    ) {
      return
    }

    const { width, height } = this.sys.game.config
    const sanitizedChar = sanitizeText('C')

    const x = Phaser.Math.Between(50, (width as number) - 50)
    const y = Phaser.Math.Between(50, (height as number) - 50)

    const chaser = this.add.text(x, y, sanitizedChar, {
      fontFamily: "'Comic Sans MS', 'Arial', sans-serif",
      fontSize: '32px',
      color: '#FF00FF',
    })

    this.chasers!.add(chaser)
    chaser.setScale(2)
    chaser.setDepth(5) // Ensure chasers are in front of ground layers but behind the player

    if (chaser.body instanceof Phaser.Physics.Arcade.Body) {
      chaser.body.setCollideWorldBounds(true).setBounce(1, 1)
    }
  }

  update(): void {
    if (!this.player || !this.player.body || !this.wasdCursors || !this.arrowCursors) return

    const playerChunkX = Math.floor(this.player.x / (this.CHUNK_SIZE_TILES * this.TILE_SIZE))
    const playerChunkY = Math.floor(this.player.y / (this.CHUNK_SIZE_TILES * this.TILE_SIZE))

    if (playerChunkX !== this.currentChunkX || playerChunkY !== this.currentChunkY) {
      this.currentChunkX = playerChunkX
      this.currentChunkY = playerChunkY
      this.generateSurroundingChunks(this.currentChunkX, this.currentChunkY)
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    if (
      Array.from(this.activeKeys?.values() ?? []).some(
        (key) => this.wasdCursorsValues.includes(key) || this.arrowCursorsValues.includes(key),
      )
    ) {
      if (this.player.anims.currentAnim?.key !== ANIMATION_KEYS.PLAYER_WALK) {
        this.player.play(ANIMATION_KEYS.PLAYER_WALK)
      }
    } else {
      if (this.player.anims.currentAnim?.key !== ANIMATION_KEYS.PLAYER_IDLE) {
        this.player.play(ANIMATION_KEYS.PLAYER_IDLE)
      }
    }

    if (this.wasdCursors.left.isDown || this.arrowCursors.left.isDown) {
      body.setVelocityX(-this.speed)
    } else if (this.wasdCursors.right.isDown || this.arrowCursors.right.isDown) {
      body.setVelocityX(this.speed)
    }

    if (this.wasdCursors.up.isDown || this.arrowCursors.up.isDown) {
      body.setVelocityY(-this.speed)
    } else if (this.wasdCursors.down.isDown || this.arrowCursors.down.isDown) {
      body.setVelocityY(this.speed)
    }

    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(this.speed)
    }

    if (this.chasers) {
      // Explicit check for chasers
      this.chasers.getChildren().forEach((chaser) => {
        if (chaser.body && this.player) {
          this.physics.moveToObject(chaser as Phaser.GameObjects.GameObject, this.player, this.chaserSpeed)
        }
      })

      if (this.chasers.getLength() > 0) {
        // No optional chaining needed here due to outer if
        this.physics.overlap(this.player, this.chasers, this.gameOver, undefined, this)
      }
    }
  }

  gameOver() {
    // 1. Disable input immediately
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false
    }

    // 2. Pause the scene to stop update() loop and other scene processing
    this.scene.pause(SCENE_KEYS.LEVEL1) // Explicitly pause this scene

    // 3. Remove chaser spawn timer
    this.chaserSpawnTimer?.remove(false)

    const finalScore = (this.time.now - this.startTime) / 1000

    // 4. Stop Level1Scene and start GameOverScene
    // Stopping the scene will trigger the SHUTDOWN event, which handles further cleanup.
    if (this.scene.manager.keys[SCENE_KEYS.GAME_OVER]) {
      this.scene.stop(SCENE_KEYS.LEVEL1)
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore })
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.GAME_OVER}. Cannot show game over screen.`)
      this.scene.stop() // Fallback: just stop the current scene
    }
  }
  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize
    if (this.miniMapCamera) {
      this.miniMapCamera.setViewport(width - 200, 0, 200, 200)
      this.miniMapCamera.setScroll(
        this.player!.x - this.miniMapCamera.width / 2,
        this.player!.y - this.miniMapCamera.height / 2,
      )
    }
    if (this.miniMapBorder) {
      this.miniMapBorder.clear()
      this.miniMapBorder.lineStyle(2, 0x00ff00, 1)
      this.miniMapBorder.strokeRect(width - 200, 0, 200, 200)
    }
  }
}

export default Level1Scene
