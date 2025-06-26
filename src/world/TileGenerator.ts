import Phaser from 'phaser'

/**
 * Utility class for creating and managing tilemaps and layers in a Phaser scene.
 * Handles the generation of tilemaps from data and creation of tilemap layers.
 */
export class TileGenerator {
  /** The Phaser scene instance where the tilemap will be created */
  private scene: Phaser.Scene
  /** The size (width and height) of each tile in pixels */
  private tileSize: number

  /**
   * Creates a new TileGenerator instance
   * @param scene - The Phaser scene where the tilemap will be created
   * @param tileSize - The size (width and height) of each tile in pixels
   */
  constructor(scene: Phaser.Scene, tileSize: number) {
    this.scene = scene
    this.tileSize = tileSize
  }

  /**
   * Creates a Phaser tilemap from the provided 2D array data
   * @param tileMapData - 2D array representing the tilemap data
   * @returns The created Phaser.Tilemaps.Tilemap instance
   */
  public createTilemap(tileMapData: number[][]): Phaser.Tilemaps.Tilemap {
    // Create a new tilemap using the scene's tilemap factory
    const map = this.scene.make.tilemap({ data: tileMapData, tileWidth: this.tileSize, tileHeight: this.tileSize })
    // Add the tileset image to the map using the default tileset name
    map.addTilesetImage('world_tileset', 'world_tileset', this.tileSize, this.tileSize, 0, 0)
    return map
  }

  /**
   * Creates a tilemap layer from the given tilemap
   * @param map - The tilemap to create the layer from
   * @param layerName - Name of the layer (used for error messages)
   * @param tilesetName - Name of the tileset to use for the layer
   * @returns The created Phaser.Tilemaps.TilemapLayer
   * @throws Error if the layer creation fails
   */
  public createLayer(
    map: Phaser.Tilemaps.Tilemap,
    layerName: string,
    tilesetName: string,
  ): Phaser.Tilemaps.TilemapLayer {
    // Create a new layer at index 0 with the specified tileset
    const layer = map.createLayer(0, tilesetName, 0, 0)
    // Throw an error if layer creation fails
    if (!layer) {
      throw new Error(`Failed to create tilemap layer: ${layerName}`)
    }
    return layer
  }
}
