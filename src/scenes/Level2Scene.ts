import { LevelScene, type LevelType } from './LevelScene'
import { SCENE_KEYS, TEXTURE_KEYS, AUDIO_KEYS } from '../utils/constants'

class Level2Scene extends LevelScene {
  constructor() {
    super(SCENE_KEYS.LEVEL2)
  }

  preload() {
    this.load.tilemapTiledJSON('level2_tilemap', 'assets/tilemap/oh-gosh-map.tmj')
    this.load.image(TEXTURE_KEYS.WORLD, 'assets/tileset/overworld.png')
  }

  protected getLevelConfig() {
    return {
      levelType: 'tilemap' as LevelType,
      tilemapKey: TEXTURE_KEYS.WORLD,
      tilemapJson: 'level2_tilemap',
      musicKey: AUDIO_KEYS.IN_GAME_MUSIC,
      timeToSurviveMs: 60000,
      levelWidthChunks: 0,
      levelHeightChunks: 0,
      initialDifficulty: 2,
      enemySpawnRate: 5,
    }
  }

  protected generateProceduralLevel(): [number, number] {
    const map = this.make.tilemap({ key: 'level2_tilemap' })
    const startX = map.widthInPixels / 2
    const startY = map.heightInPixels / 2
    return [startX, startY]
  }

  create() {
    super.create()

    // Additional tilemap setup
    const map = this.make.tilemap({ key: 'level2_tilemap' })
    const tileset = map.addTilesetImage('world_tileset', TEXTURE_KEYS.WORLD)

    // Set collision for ground layer
    const groundLayer = map.createLayer('Tile Layer 1', tileset as Phaser.Tilemaps.Tileset, 0, 0)
    if (groundLayer) {
      groundLayer.setCollisionByProperty({ collides: true })
      this.physics.add.collider(this.player!, groundLayer)
    }

    // Configure camera follow with smoothing
    this.cameras.main.startFollow(this.player!, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)
  }
}

export default Level2Scene
