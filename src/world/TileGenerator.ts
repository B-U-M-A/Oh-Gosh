import Phaser from 'phaser'

export class TileGenerator {
  private scene: Phaser.Scene
  private tileSize: number

  constructor(scene: Phaser.Scene, tileSize: number) {
    this.scene = scene
    this.tileSize = tileSize
  }

  public createTilemap(tileMapData: number[][]): Phaser.Tilemaps.Tilemap {
    const map = this.scene.make.tilemap({ data: tileMapData, tileWidth: this.tileSize, tileHeight: this.tileSize })
    map.addTilesetImage('world_tileset', 'world_tileset', this.tileSize, this.tileSize, 0, 0)
    return map
  }

  public createLayer(
    map: Phaser.Tilemaps.Tilemap,
    layerName: string,
    tilesetName: string,
  ): Phaser.Tilemaps.TilemapLayer {
    const layer = map.createLayer(0, tilesetName, 0, 0)
    if (!layer) {
      throw new Error(`Failed to create tilemap layer: ${layerName}`)
    }
    return layer
  }
}
