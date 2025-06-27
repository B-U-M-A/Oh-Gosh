import { SCENE_KEYS, TEXTURE_KEYS, AUDIO_KEYS } from '../utils/constants'
import { RoomType } from '../types/WorldTypes'
import { LevelScene, type LevelConfig } from './LevelScene' // Import LevelScene and LevelConfig
// RoomGenerator is used via this.roomGenerator from LevelScene

/**
 * The main gameplay scene where the player interacts with the game world, enemies, and collects items.
 * This scene extends the abstract LevelScene, inheriting common game logic and UI.
 * It provides specific configurations and implements procedural level generation.
 */
class Level1Scene extends LevelScene {
  // Keep these properties as they define the specific dimensions of Level1.
  private readonly LEVEL_WIDTH_CHUNKS = 5 // e.g., 5 rooms wide
  private readonly LEVEL_HEIGHT_CHUNKS = 5 // e.g., 5 rooms high

  // Debug constant specific to Level1Scene
  // private readonly DEBUG_DISTANCE = false // Toggles distance debug logging
  // private readonly MAX_DISTANCE_MULTIPLIER = 1 // Max distance enemies can be from player (1x screen width)

  constructor() {
    // Call the base class constructor with the scene key.
    // LevelScene's constructor will handle difficultyManager and winTimeRemaining initialization
    // based on the LevelConfig provided by getLevelConfig().
    super(SCENE_KEYS.LEVEL1)
  }

  /**
   * Provides the specific configuration for Level1Scene.
   * This method is required by the abstract LevelScene base class.
   * @returns The LevelConfig object for Level1.
   */
  protected getLevelConfig(): LevelConfig {
    return {
      levelType: 'procedural', // Level1 is a procedural level
      tilemapKey: TEXTURE_KEYS.WORLD, // Uses the 'world' tileset
      musicKey: AUDIO_KEYS.IN_GAME_MUSIC, // Specific music for Level1
      timeToSurviveMs: 60000, // Player must survive for 60 seconds
      levelWidthChunks: this.LEVEL_WIDTH_CHUNKS, // Use Level1's specific width
      levelHeightChunks: this.LEVEL_HEIGHT_CHUNKS, // Use Level1's specific height
      initialDifficulty: 1, // Initial difficulty setting for Level1
      enemySpawnRate: 2000, // Enemies spawn every 2 seconds initially
    }
  }

  /**
   * Implements the procedural level generation for Level1Scene.
   * This method is required by the abstract LevelScene base class.
   * It generates a grid of rooms and corridors and returns the player's starting position.
   * @param widthChunks The width of the level in chunks (provided by LevelConfig).
   * @param heightChunks The height of the level in chunks (provided by LevelConfig).
   * @returns The starting world coordinates [x, y] for the player.
   */
  protected generateProceduralLevel(widthChunks: number, heightChunks: number): [number, number] {
    // Initialize the level grid with empty cells
    this.levelGrid = Array(heightChunks)
      .fill(0)
      .map((_, y) =>
        Array(widthChunks)
          .fill(0)
          .map((__, x) => ({ type: RoomType.EMPTY, chunkX: x, chunkY: y })),
      )

    // 1. Place Start and End Rooms
    const startX = Phaser.Math.Between(0, widthChunks - 1)
    const startY = Phaser.Math.Between(0, heightChunks - 1)
    this.levelGrid[startY][startX].type = RoomType.START

    let endX, endY
    do {
      endX = Phaser.Math.Between(0, widthChunks - 1)
      endY = Phaser.Math.Between(0, heightChunks - 1)
    } while (endX === startX && endY === startY) // Ensure end is not same as start
    this.levelGrid[endY][endX].type = RoomType.END

    // 2. Simple Pathfinding (Connect Start to End)
    // This is a very basic straight-line path. For more complex paths,
    // you'd use A* or similar algorithms.
    let currentPathX = startX
    let currentPathY = startY

    while (currentPathX !== endX || currentPathY !== endY) {
      const movedX = currentPathX !== endX
      const movedY = currentPathY !== endY

      if (movedX && (!movedY || Phaser.Math.Between(0, 1) === 0)) {
        // Move horizontally
        const nextX = currentPathX + (endX > currentPathX ? 1 : -1)
        if (this.levelGrid[currentPathY][nextX].type === RoomType.EMPTY) {
          this.levelGrid[currentPathY][nextX].type = RoomType.CORRIDOR_H
        }
        currentPathX = nextX
      } else if (movedY) {
        // Move vertically
        const nextY = currentPathY + (endY > currentPathY ? 1 : -1)
        if (this.levelGrid[nextY][currentPathX].type === RoomType.EMPTY) {
          this.levelGrid[nextY][currentPathX].type = RoomType.CORRIDOR_V
        }
        currentPathY = nextY
      }
    }

    // 3. Place other room types randomly in remaining EMPTY cells
    for (let y = 0; y < heightChunks; y++) {
      for (let x = 0; x < widthChunks; x++) {
        if (this.levelGrid[y][x].type === RoomType.EMPTY) {
          const rand = Math.random()
          if (rand < 0.3) {
            this.levelGrid[y][x].type = RoomType.COMBAT
          } else if (rand < 0.4) {
            this.levelGrid[y][x].type = RoomType.TREASURE
          } else if (rand < 0.45) {
            this.levelGrid[y][x].type = RoomType.SHOP
          }
          // Else, it remains EMPTY
        }
      }
    }

    // 4. Generate all tilemap layers based on the level grid
    let playerSpawnWorldX = 0
    let playerSpawnWorldY = 0

    // Ensure roomGenerator is initialized by the base class
    if (!this.roomGenerator) {
      throw new Error('RoomGenerator is not initialized in LevelScene base class.')
    }

    for (let y = 0; y < heightChunks; y++) {
      for (let x = 0; x < widthChunks; x++) {
        const cell = this.levelGrid[y][x]
        try {
          // Use the base class's TILE_SIZE and CHUNK_SIZE_TILES
          const layer = this.roomGenerator.generateRoomLayer(cell.type, cell.chunkX, cell.chunkY, this.CHUNK_SIZE_TILES)
          // Only add to groundLayers if it contains collidable tiles (wall tiles)
          if (layer.layer.data.some((row) => row.some((tile) => tile && tile.index === 3))) {
            this.groundLayers?.add(layer)
          }
          this.loadedChunks.set(`${cell.chunkX}_${cell.chunkY}`, layer.tilemap) // Store the tilemap
        } catch (error) {
          console.error(`Failed to generate layer for room type ${cell.type} at (${x},${y}):`, error)
          // Decide how to handle this error: stop game, skip room, etc.
        }

        if (cell.type === RoomType.START) {
          playerSpawnWorldX = (cell.chunkX * this.CHUNK_SIZE_TILES + this.CHUNK_SIZE_TILES / 2) * this.TILE_SIZE
          playerSpawnWorldY = (cell.chunkY * this.CHUNK_SIZE_TILES + this.CHUNK_SIZE_TILES / 2) * this.TILE_SIZE
        }
      }
    }

    return [playerSpawnWorldX, playerSpawnWorldY]
  }
}

export default Level1Scene
