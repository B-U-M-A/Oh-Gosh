import Phaser from 'phaser'
import { isValidAssetPath } from '../utils/security'
import { TEXTURE_KEYS, ANIMATION_KEYS, SCENE_KEYS, AUDIO_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'

class PreloaderScene extends Phaser.Scene {
  private loadError: boolean = false
  private errorDetails: string[] = []

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER })
  }

  preload(): void {
    // Error handling
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      const errorMessage = `Error loading asset: ${file.key} - ${file.url}`
      console.error(errorMessage)
      this.errorDetails.push(`[ERROR] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    })

    // Helper functions for specific asset types
    const loadSpriteSheet = (path: string, key: string, frameConfig: { frameWidth: number; frameHeight: number }) => {
      if (isValidAssetPath(path)) {
        this.load.spritesheet(key, path, frameConfig)
      } else {
        console.error(`Invalid asset path: ${path}`)
        this.loadError = true
      }
    }

    const loadAudio = (path: string, key: string) => {
      if (isValidAssetPath(path)) {
        this.load.audio(key, path)
      } else {
        console.error(`Invalid asset path: ${path}`)
        this.loadError = true
      }
    }

    // Load all assets
    // Character sprites
    loadSpriteSheet('src/assets/becerrita/becerrita-idle.png', TEXTURE_KEYS.IDLE, { frameWidth: 64, frameHeight: 64 })
    loadSpriteSheet('src/assets/becerrita/becerrita-walk.png', TEXTURE_KEYS.WALK, { frameWidth: 64, frameHeight: 64 })

    // Level 2 tilemap assets
    loadSpriteSheet('public/assets/tileset/overworld.png', TEXTURE_KEYS.WORLD, { frameWidth: 64, frameHeight: 64 })
    this.load.tilemapTiledJSON('level2_tilemap', 'public/assets/tilemap/oh-gosh-map.tmj')

    loadAudio('src/assets/audio/boing.flac', AUDIO_KEYS.COLLISION)
    loadAudio('public/music/in_game_music.wav', AUDIO_KEYS.IN_GAME_MUSIC)

    // UI assets
  }

  create(): void {
    if (this.loadError) {
      console.error('Assets failed to load')
      this.showErrorScreen()
      return
    }

    this.createAnimations()
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }

  private showErrorScreen(): void {
    const errorMessage =
      localizationManager.getStrings().gameOver?.assetLoadError || 'Error: Failed to load game assets.'
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, `${errorMessage}\nPlease refresh to try again.`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ff0000',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
  }

  private createAnimations(): void {
    this.anims.create({
      key: ANIMATION_KEYS.PLAYER_IDLE,
      frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.IDLE, { start: 0, end: 3 }),
      frameRate: 3,
      repeat: -1,
    })

    this.anims.create({
      key: ANIMATION_KEYS.PLAYER_WALK,
      frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.WALK, { start: 0, end: 3 }),
      frameRate: 5,
      repeat: -1,
    })
  }
}

export default PreloaderScene
