import { LevelScene, type LevelType } from './LevelScene'
import { SCENE_KEYS, TEXTURE_KEYS, AUDIO_KEYS } from '../utils/constants'

class Level2Scene extends LevelScene {
  constructor() {
    super(SCENE_KEYS.LEVEL2)
  }

  preload() {
    // Preload the tilemap JSON and the tileset image for Level 2
    this.load.tilemapTiledJSON('level2_tilemap', 'assets/tilemap/oh-gosh-map.tmj')
    this.load.image(TEXTURE_KEYS.WORLD, 'assets/tileset/overworld.png')
  }

  /**
   * Provides the specific configuration for Level2Scene.
   * This method is required by the abstract LevelScene base class.
   * @returns The LevelConfig object for Level2.
   */
  protected getLevelConfig() {
    return {
      levelType: 'tilemap' as LevelType, // Level2 uses a pre-designed tilemap
      tilemapKey: TEXTURE_KEYS.WORLD, // Key for the tileset image
      tilemapJson: 'level2_tilemap', // Key for the loaded tilemap JSON
      musicKey: AUDIO_KEYS.IN_GAME_MUSIC, // Music track for Level2
      timeToSurviveMs: 60000, // Player must survive for 60 seconds
      levelWidthChunks: 0, // Not used for tilemap levels
      levelHeightChunks: 0, // Not used for tilemap levels
      initialDifficulty: 2, // Starting difficulty for Level2
      enemySpawnRate: 5, // Enemies spawn very frequently in Level2
    }
  }

  /**
   * Generates the level layout for Level2Scene.
   * For tilemap-based levels, this involves finding the starting position within the map.
   * This method is required by the abstract LevelScene base class.
   * @returns The starting world coordinates [x, y] for the player.
   */
  protected generateProceduralLevel(): [number, number] {
    // Access the tilemap to find its dimensions and a potential starting point.
    // The actual tilemap layer creation and collision setup are handled in the base class's create() method.
    const map = this.make.tilemap({ key: 'level2_tilemap' })
    // Calculate the center of the map as the player's starting position.
    const startX = map.widthInPixels / 2
    const startY = map.heightInPixels / 2
    return [startX, startY]
  }
}

export default Level2Scene
