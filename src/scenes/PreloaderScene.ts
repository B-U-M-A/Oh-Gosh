import Phaser from 'phaser'
import { isValidAssetPath } from '../utils/security'
import { TEXTURE_KEYS, ANIMATION_KEYS, SCENE_KEYS, AUDIO_KEYS } from '../utils/constants'
import { localizationManager } from '../localization/LocalizationManager'

/**
 * The PreloaderScene is responsible for loading all game assets (images, audio, etc.)
 * before transitioning to the main menu. It handles asset loading with security checks
 * and provides error handling for failed loads.
 */
class PreloaderScene extends Phaser.Scene {
  private loadError: boolean = false
  private errorDetails: string[] = []

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER })
  }

  /**
   * Loads all game assets including sprites, tilesets, and audio files.
   * Performs security validation on all asset paths before loading.
   */
  preload(): void {
    // --- Gracefully handle asset loading errors ---
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      const errorMessage = `Error loading asset: ${file.key} - ${file.url}`
      console.error(errorMessage)
      this.errorDetails.push(`[ERROR] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    })

    // --- Load Player Spritesheet ---
    // Load the player character's idle animation spritesheet with fallback
    const idleAssetPath = 'src/assets/becerrita/becerrita-idle.png'
    if (isValidAssetPath(idleAssetPath)) {
      this.load.spritesheet(TEXTURE_KEYS.IDLE, idleAssetPath, {
        frameWidth: 64,
        frameHeight: 64,
      })
    } else {
      const errorMessage = `Security Error: Invalid asset path provided: ${idleAssetPath}`
      console.error(errorMessage)
      this.errorDetails.push(`[SECURITY] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    }

    // --- Load Player Spritesheet ---
    // Load the player character's walk animation spritesheet with fallback
    const walkAssetPath = 'src/assets/becerrita/becerrita-walk.png'
    if (isValidAssetPath(walkAssetPath)) {
      this.load.spritesheet(TEXTURE_KEYS.WALK, walkAssetPath, {
        frameWidth: 64,
        frameHeight: 64,
      })
    } else {
      const errorMessage = `Security Error: Invalid asset path provided: ${walkAssetPath}`
      console.error(errorMessage)
      this.errorDetails.push(`[SECURITY] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    }

    // Load the world tileset image used for level backgrounds and terrain
    const worldTilesetPath = 'src/assets/tiles/world.png'
    console.log(`PreloaderScene: isValidAssetPath(${worldTilesetPath}):`, isValidAssetPath(worldTilesetPath))
    if (isValidAssetPath(worldTilesetPath)) {
      this.load.spritesheet('world_tileset', worldTilesetPath, {
        frameWidth: 64,
        frameHeight: 64,
      })
    } else {
      const errorMessage = `Security Error: Invalid asset path provided: ${worldTilesetPath}`
      console.error(errorMessage)
      this.errorDetails.push(`[SECURITY] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    }

    // --- Load Audio ---
    // Load the collision sound effect played when objects interact
    const collisionSoundPath = 'src/assets/audio/boing.flac'
    if (isValidAssetPath(collisionSoundPath)) {
      this.load.audio(AUDIO_KEYS.COLLISION, collisionSoundPath)
    } else {
      const errorMessage = `Security Error: Invalid asset path provided: ${collisionSoundPath}`
      console.error(errorMessage)
      this.errorDetails.push(`[SECURITY] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    }

    // Load the background music track for the main game
    const inGameMusicPath = 'public/music/in_game_music.wav'
    if (isValidAssetPath(inGameMusicPath)) {
      this.load.audio(AUDIO_KEYS.IN_GAME_MUSIC, inGameMusicPath)
    } else {
      const errorMessage = `Security Error: Invalid asset path provided: ${inGameMusicPath}`
      console.error(errorMessage)
      this.errorDetails.push(`[SECURITY] ${new Date().toISOString()} - ${errorMessage}`)
      this.loadError = true
    }
  }

  /**
   * Initializes game elements after assets are loaded and transitions to the main menu.
   * Creates player animations and handles any loading errors that occurred.
   */
  create(): void {
    if (this.loadError) {
      console.error('PreloaderScene: Assets failed to load. Displaying error message.')
      console.log('PreloaderScene: world_tileset texture exists:', this.textures.exists('world_tileset'))

      // Log all error details
      this.errorDetails.forEach((detail) => console.error(detail))

      // --- Display a localized error message if assets failed to load ---
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

      // --- Stop further scene progression on error ---
      return
    }

    // --- Create Player Animations ---
    // Defensively check if the texture exists before creating an animation from it.
    // Use fallback if the main texture is not available
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
    } else if (this.textures.exists(`${TEXTURE_KEYS.IDLE}_fallback`)) {
      // Use the fallback texture
      console.warn(`Using fallback texture for ${TEXTURE_KEYS.IDLE}`)
      this.anims.create({
        key: ANIMATION_KEYS.PLAYER_IDLE,
        frames: this.anims.generateFrameNumbers(`${TEXTURE_KEYS.IDLE}_fallback`, {
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
    // Use fallback if the main texture is not available
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
    } else if (this.textures.exists(`${TEXTURE_KEYS.WALK}_fallback`)) {
      // Use the fallback texture
      console.warn(`Using fallback texture for ${TEXTURE_KEYS.WALK}`)
      this.anims.create({
        key: ANIMATION_KEYS.PLAYER_WALK,
        frames: this.anims.generateFrameNumbers(`${TEXTURE_KEYS.WALK}_fallback`, {
          start: 0,
          end: 3,
        }),
        frameRate: 5,
        repeat: -1,
      })
    } else {
      // This case should be caught by the 'loaderror' event, but serves as a final guard.
      console.error(`Texture key not found: ${TEXTURE_KEYS.WALK}. Cannot create walk animation.`)
      return
    }

    // --- Start the Main Scene ---
    // All assets are now in the cache and animations are created,
    // so we can safely start the main game scene.
    // Transition to the main menu scene after all assets are loaded
    this.scene.start(SCENE_KEYS.MAIN_MENU)
  }
}

export default PreloaderScene
