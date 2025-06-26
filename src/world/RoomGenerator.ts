// src/world/RoomGenerator.ts

import Phaser from 'phaser'
import { TileGenerator } from './TileGenerator'
import { RoomType } from '../types/WorldTypes'
import { ROOM_TEMPLATES } from '../data/roomTemplates'
import { TILE_KEYS } from '../utils/constants'

/**
 * Generates Phaser TilemapLayers based on predefined room templates.
 * Handles the creation of the base tile layer and placement of obstacles.
 */
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
   * Generates a tilemap layer for a specific room type at given chunk coordinates.
   * This method creates the base layer and then overlays obstacles defined in the template.
   *
   * @param roomType The type of room to generate.
   * @param chunkX The X-coordinate of the chunk in the level grid.
   * @param chunkY The Y-coordinate of the chunk in the level grid.
   * @param chunkSizeTiles The size of the chunk in tiles (e.g., 10 for 10x10).
   * @returns The created Phaser.Tilemaps.TilemapLayer.
   * @throws Error if the room template is not found or layer creation fails.
   */
  public generateRoomLayer(
    roomType: RoomType,
    chunkX: number,
    chunkY: number,
    chunkSizeTiles: number,
  ): Phaser.Tilemaps.TilemapLayer {
    const template = ROOM_TEMPLATES[roomType]
    if (!template) {
      throw new Error(`Room template not found for type: ${roomType}`)
    }

    // Create a mutable copy of the tiles array to apply obstacles
    const roomTilesData = template.tiles.map((row) => [...row])

    // Overlay obstacles onto the base tile data
    if (template.obstacles) {
      template.obstacles.forEach((obstacle) => {
        if (obstacle.y >= 0 && obstacle.y < chunkSizeTiles && obstacle.x >= 0 && obstacle.x < chunkSizeTiles) {
          roomTilesData[obstacle.y][obstacle.x] = obstacle.tileIndex
        } else {
          console.warn(`Obstacle position out of bounds for room type ${roomType}: (${obstacle.x}, ${obstacle.y})`)
        }
      })
    }

    // Create the tilemap from the processed data
    const map = this.tileGenerator.createTilemap(roomTilesData)

    // Create the layer using the map and the 'world_tileset'
    const layer = this.tileGenerator.createLayer(map, `Room_${roomType}_${chunkX}_${chunkY}`, 'world_tileset')

    // Position the layer correctly in the world based on chunk coordinates
    layer.x = chunkX * chunkSizeTiles * this.tileSize
    layer.y = chunkY * chunkSizeTiles * this.tileSize
    layer.setDepth(0) // Ensure ground layers are at the bottom

    return layer
  }

  /**
   * Places entities defined in a room template into the scene.
   * This method is separate from generateRoomLayer because entities are Phaser.GameObjects,
   * not part of the tilemap layer itself.
   *
   * @param roomType The type of room.
   * @param chunkX The X-coordinate of the chunk.
   * @param chunkY The Y-coordinate of the chunk.
   * @param chunkSizeTiles The size of the chunk in tiles.
   * @param entityGroup The Phaser group to add entities to (e.g., chasers group).
   * @param player The player sprite (needed for enemy targeting).
   */
  public placeEntities(
    roomType: RoomType,
    chunkX: number,
    chunkY: number,
    chunkSizeTiles: number,
    entityGroup: Phaser.Physics.Arcade.Group,
    player: Phaser.Physics.Arcade.Sprite,
  ): void {
    const template = ROOM_TEMPLATES[roomType]
    if (!template || !template.entities) {
      return // No entities defined for this room type
    }

    template.entities.forEach((entityConfig) => {
      const worldX = (chunkX * chunkSizeTiles + entityConfig.x) * this.tileSize + this.tileSize / 2
      const worldY = (chunkY * chunkSizeTiles + entityConfig.y) * this.tileSize + this.tileSize / 2

      // Example: If entityConfig.type is an enemy type
      if (entityConfig.type === TILE_KEYS.WALL) {
        // For now, we're handling walls as part of the tilemap.
        // If you wanted interactive obstacles, you'd create a sprite here.
        // For example, a destructible wall:
        // const wall = this.scene.physics.add.sprite(worldX, worldY, 'wall_texture');
        // wall.setImmovable(true);
        // entityGroup.add(wall); // If you have an 'obstacles' group
      }
      // Add more entity types here (e.g., enemies, items)
      // For enemies, you'd use EnemyFactory:
      // if (entityConfig.type === ENEMY_TYPES.BASIC_CHASER) {
      //   const enemy = EnemyFactory.createEnemy(this.scene, ENEMY_CONFIGS[ENEMY_TYPES.BASIC_CHASER], worldX, worldY);
      //   entityGroup.add(enemy);
      //   this.scene.physics.moveToObject(enemy, player, this.scene.difficultyManager.getChaserSpeed());
      // }
    })
  }
}
