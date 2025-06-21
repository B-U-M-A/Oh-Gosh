import Phaser from "phaser";
import { isValidAssetPath } from "../utils/security";
import { TEXTURE_KEYS, ANIMATION_KEYS, SCENE_KEYS } from "../utils/constants";

class PreloaderScene extends Phaser.Scene {
  private loadError: boolean = false;

  constructor() {
    super({ key: SCENE_KEYS.PRELOADER });
  }

  preload(): void {
    // --- Gracefully handle asset loading errors ---
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`Error loading asset: ${file.key} - ${file.url}`);
      this.loadError = true;
    });

    // --- Load Player Spritesheet ---
    const playerAssetPath = "src/assets/becerrita/idle/becerrite.png";
    if (isValidAssetPath(playerAssetPath)) {
      this.load.spritesheet(TEXTURE_KEYS.PLAYER, playerAssetPath, {
        frameWidth: 512,
        frameHeight: 512,
      });
    } else {
      console.error(`Security Error: Invalid asset path provided: ${playerAssetPath}`);
      this.loadError = true;
    }
  }

  create() {
    if (this.loadError) {
      // --- Display an error message if assets failed to load ---
      this.add.text(
          this.scale.width / 2,
          this.scale.height / 2,
          "Error: Failed to load game assets.\nPlease refresh to try again.",
          {
            fontFamily: 'Arial',
            fontSize: "24px",
            color: "#ff0000",
            align: "center",
            stroke: '#000000',
            strokeThickness: 4,
          }
        ).setOrigin(0.5);

      // --- Stop further scene progression on error ---
      return;
    }


    // --- Create Player Animations ---
    // Defensively check if the texture exists before creating an animation from it.
    if (this.textures.exists(TEXTURE_KEYS.PLAYER)) {
      this.anims.create({
        key: ANIMATION_KEYS.PLAYER_IDLE,
        frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.PLAYER, {
          start: 0,
          end: 3,
        }),
        frameRate: 3,
        repeat: -1,
      });
    } else {
        // This case should be caught by the 'loaderror' event, but serves as a final guard.
        console.error(`Texture key not found: ${TEXTURE_KEYS.PLAYER}. Cannot create idle animation.`);
        return;
    }


    // --- Start the Main Scene ---
    // All assets are now in the cache and animations are created,
    // so we can safely start the main game scene.
    this.scene.start(SCENE_KEYS.MAIN);
  }
}

export default PreloaderScene;