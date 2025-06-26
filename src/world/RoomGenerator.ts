// src/world/RoomGenerator.ts

import Phaser from 'phaser'
import { RoomType, type RoomTemplate, type LevelLayoutCell } from '../types/WorldTypes'
import { ROOM_TEMPLATES } from '../data/roomTemplates' // MODIFIED: Use ROOM_TEMPLATES
import { TileGenerator } from './TileGenerator'
import { ENEMY_TYPES, ENEMY_CONFIGS } from '../data/enemyData'
import { EnemyFactory } from '../game/EnemyFactory'

export class RoomGenerator {
  private scene: Phaser.Scene
  private tileSize: number
  private tileGenerator: TileGenerator

  /**
   * Creates an instance of RoomGenerator.
   * @param scene The Phaser Scene instance.
   * @param tileSize The size of each tile in pixels.
   */
  constructor(scene: Phaser.Scene, tileSize: number) {
    this.scene = scene
    this.tileSize = tileSize
    this.tileGenerator = new TileGenerator(scene, tileSize)
  }

  /**
   * Generates a tilemap layer for a specific room type at a given chunk position.
   * @param roomType The type of room to generate.
   * @param chunkX The X coordinate of the chunk in the level grid.
   * @param chunkY The Y coordinate of the chunk in the level grid.
   * @param chunkSizeTiles The size of each chunk in tiles (e.g., 10 for 10x10 tiles).
   * @returns The generated Phaser.Tilemaps.TilemapLayer.
   */
  public generateRoomLayer(
    roomType: RoomType,
    chunkX: number,
    chunkY: number,
    chunkSizeTiles: number,
  ): Phaser.Tilemaps.TilemapLayer {
    const template: RoomTemplate = ROOM_TEMPLATES[roomType] // MODIFIED: Use ROOM_TEMPLATES

    if (!template) {
      console.warn(`No room template found for type: ${roomType}. Using empty room.`)
      // Fallback to an empty room template if not found
      const emptyTiles = Array(chunkSizeTiles)
        .fill(0)
        .map(() => Array(chunkSizeTiles).fill(0))
      const emptyMap = this.tileGenerator.createTilemap(emptyTiles)
      const emptyLayer = this.tileGenerator.createLayer(
        emptyMap,
        `layer_${roomType}_${chunkX}_${chunkY}`,
        'world_tileset',
        chunkX * chunkSizeTiles * this.tileSize,
        chunkY * chunkSizeTiles * this.tileSize,
      )
      // For empty rooms, assuming tile 0 is always walkable, no collision needed unless a wall tile (3) is explicitly placed.
      emptyLayer.setCollision([3]) // MODIFIED: Ensure tile index 3 is collidable even for fallback layers.
      return emptyLayer
    }

    const map = this.tileGenerator.createTilemap(template.tiles)
    const layer = this.tileGenerator.createLayer(
      map,
      `layer_${roomType}_${chunkX}_${chunkY}`,
      'world_tileset',
      chunkX * chunkSizeTiles * this.tileSize,
      chunkY * chunkSizeTiles * this.tileSize,
    )

    // MODIFIED: Always set collision for wall tiles (index 3) for all generated layers.
    // This ensures that any tile with index 3, which represents a wall in your room templates,
    // is correctly marked as collidable.
    layer.setCollision([3])

    return layer
  }

  /**
   * Places entities (e.g., enemies, items) within a generated room based on its type.
   * @param roomType The type of room where entities are to be placed.
   * @param chunkX The X coordinate of the chunk in the level grid.
   * @param chunkY The Y coordinate of the chunk in the level grid.
   * @param chunkSizeTiles The size of each chunk in tiles.
   * @param entityGroup The Phaser.Physics.Arcade.Group to add entities to.
   * @param player The player sprite, needed for some entity behaviors (e.g., chasing).
   */
  public placeEntities(
    roomType: RoomType,
    chunkX: number,
    chunkY: number,
    chunkSizeTiles: number,
    entityGroup: Phaser.Physics.Arcade.Group,
    player: Phaser.Physics.Arcade.Sprite,
  ): void {
    const template: RoomTemplate = ROOM_TEMPLATES[roomType] // MODIFIED: Use ROOM_TEMPLATES
    if (!template || !template.entities) {
      return // No entities to place for this room type or template not found
    }

    template.entities.forEach((entityConfig) => {
      const worldX = (chunkX * chunkSizeTiles + entityConfig.x) * this.tileSize + this.tileSize / 2
      const worldY = (chunkY * chunkSizeTiles + entityConfig.y) * this.tileSize + this.tileSize / 2

      switch (entityConfig.type) {
        case ENEMY_TYPES.BASIC_CHASER:
          const chaser = EnemyFactory.createEnemy(this.scene, ENEMY_CONFIGS.BASIC_CHASER, worldX, worldY)
          entityGroup.add(chaser)
          // Set chaser to move towards the player immediately upon creation
          this.scene.physics.moveToObject(chaser, player, ENEMY_CONFIGS.BASIC_CHASER.speed)
          break
        // Add cases for other entity types (e.g., TREASURE, NPC)
        default:
          console.warn(`Unknown entity type: ${entityConfig.type}`)
          break
      }
    })
  }
}
