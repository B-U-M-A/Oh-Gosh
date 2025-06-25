import Phaser from 'phaser'
import { isValidAssetPath } from '../utils/security'
import { TEXTURE_KEYS, ANIMATION_KEYS, SCENE_KEYS, AUDIO_KEYS } from '../utils/constants'

class PreloaderScene extends Phaser.Scene {
  private loadError: boolean = false

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER })
  }

  preload(): void {
    // --- Gracefully handle asset loading errors ---
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`Error loading asset: ${file.key} - ${file.url}`)
      this.loadError = true
    })

    // --- Load Player Spritesheet ---
    const idleAssetPath = 'src/assets/becerrita/becerrita-idle.png'
    if (isValidAssetPath(idleAssetPath)) {
      this.load.spritesheet(TEXTURE_KEYS.IDLE, idleAssetPath, {
        frameWidth: 64,
        frameHeight: 64,
      })
    } else {
      console.error(`Security Error: Invalid asset path provided: ${idleAssetPath}`)
      this.loadError = true
    }
    // --- Load Player Spritesheet ---
    const walkAssetPath = 'src/assets/becerrita/becerrita-walk.png'
    if (isValidAssetPath(walkAssetPath)) {
      this.load.spritesheet(TEXTURE_KEYS.WALK, walkAssetPath, {
        frameWidth: 64,
        frameHeight: 64,
      })
    } else {
      console.error(`Security Error: Invalid asset path provided: ${walkAssetPath}`)
      this.loadError = true
    }

    const worldTilesetPath = 'src/assets/tiles/world.png'
    console.log(`PreloaderScene: isValidAssetPath(${worldTilesetPath}):`, isValidAssetPath(worldTilesetPath))
    if (isValidAssetPath(worldTilesetPath)) {
      this.load.spritesheet('world_tileset', worldTilesetPath, {
        frameWidth: 64,
        frameHeight: 64,
      })
    } else {
      console.error(`Security Error: Invalid asset path provided: ${worldTilesetPath}`)
      this.loadError = true
    }

    // --- Load Audio ---
    const collisionSoundPath = 'src/assets/audio/boing.flac'
    if (isValidAssetPath(collisionSoundPath)) {
      this.load.audio(AUDIO_KEYS.COLLISION, collisionSoundPath)
    } else {
      console.error(`Security Error: Invalid asset path provided: ${collisionSoundPath}`)
      this.loadError = true
    }
  }

  create(): void {
    if (this.loadError) {
      console.error('PreloaderScene: Assets failed to load. Displaying error message.')
      console.log('PreloaderScene: world_tileset texture exists:', this.textures.exists('world_tileset'))
      // --- Display an error message if assets failed to load ---
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2,
          'Error: Failed to load game assets.\nPlease refresh to try again.',
          {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ff0000',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4,
          },
        )
        .setOrigin(0.5)

      // --- Stop further scene progression on error ---
      return
    }

    // --- Create Player Animations ---
    // Defensively check if the texture exists before creating an animation from it.
    if (this.textures.exists(TEXTURE_KEYS.IDLE)) {
      this.anims.create({
        key: ANIMATION_KEYS.PLAYER_IDLE,
        frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.IDLE, {
          start: 0,
          end: 3,
        }),
        frameRate: 3,
        repeat: -1,
      })
    } else {
      // This case should be caught by the 'loaderror' event, but serves as a final guard.
      console.error(`Texture key not found: ${TEXTURE_KEYS.IDLE}. Cannot create idle animation.`)
      return
    }

    // --- Create Player Animations ---
    // Defensively check if the texture exists before creating an animation from it.
    if (this.textures.exists(TEXTURE_KEYS.WALK)) {
      this.anims.create({
        key: ANIMATION_KEYS.PLAYER_WALK,
        frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.WALK, {
          start: 0,
          end: 3,
        }),
        frameRate: 5,
        repeat: -1,
      })
    } else {
      // This case should be caught by the 'loaderror' event, but serves as a final guard.
      console.error(`Texture key not found: ${TEXTURE_KEYS.WALK}. Cannot create idle animation.`)
      return
    }

    // --- Start the Main Scene ---
    // All assets are now in the cache and animations are created,
    // so we can safely start the main game scene.
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }
}

export default PreloaderScene
