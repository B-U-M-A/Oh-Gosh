import Phaser from "phaser";
import { isValidAssetPath } from "../utils/security";
import { TEXTURE_KEYS, ANIMATION_KEYS, SCENE_KEYS } from "../utils/constants";

class PreloaderScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOADER });
  }

  preload(): void {
    // --- Load Player Spritesheet ---
    const playerAssetPath = "src/assets/becerrita/idle/becerrite.png";
    if (isValidAssetPath(playerAssetPath)) {
      this.load.spritesheet(TEXTURE_KEYS.PLAYER, playerAssetPath, {
        frameWidth: 512,
        frameHeight: 512,
      });
    } else {
      console.error(`Security Error: Invalid asset path: ${playerAssetPath}`);
    }
  }

  create() {
    // --- Create Player Animations ---
    this.anims.create({
      key: ANIMATION_KEYS.PLAYER_IDLE,
      frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.PLAYER, {
        start: 0,
        end: 3,
      }),
      frameRate: 3,
      repeat: -1,
    });

    // --- Start the Main Scene ---
    // All assets are now in the cache and animations are created,
    // so we can safely start the main game scene.
    this.scene.start(SCENE_KEYS.MAIN);
  }
}

export default PreloaderScene;
