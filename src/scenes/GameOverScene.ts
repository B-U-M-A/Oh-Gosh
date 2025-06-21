import Phaser from "phaser";
import { SCENE_KEYS, TEXTURE_KEYS, ANIMATION_KEYS } from "../utils/constants";

class GameOverScene extends Phaser.Scene {
  private score: number = 0;

  constructor() {
    super({ key: SCENE_KEYS.GAME_OVER });
  }

  // --- NEW: Init method to receive data from the previous scene ---
  init(data: { score: number }) {
    // Set a default score of 0 if nothing is passed
    this.score = data.score || 0;
  }

  create() {
    // --- 1. Styled "Game Over" Text ---
    const gameOverText = this.add
      .text(this.scale.width / 2, 150, "GAME OVER", {
        fontFamily: "Staatliches",
        fontSize: "128px",
        color: "#ffdd00",
        stroke: "#000000",
        strokeThickness: 8,
        shadow: {
          offsetX: 5,
          offsetY: 5,
          color: "#000",
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5);

    const gradient = gameOverText.context.createLinearGradient(
      0,
      0,
      0,
      gameOverText.height
    );
    gradient.addColorStop(0, "#ffdd00");
    gradient.addColorStop(1, "#fbb034");
    gameOverText.setFill(gradient);

    // --- NEW: Display the final score ---
    this.add
      .text(
        this.scale.width / 2,
        250, // Positioned below "GAME OVER"
        `Your Score: ${this.score.toFixed(2)}`,
        {
          fontFamily: "Staatliches",
          fontSize: "64px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 6,
        }
      )
      .setOrigin(0.5);

    // --- 2. Player Sprite with Idle Animation ---
    const player = this.add.sprite(
      this.scale.width / 2,
      this.scale.height / 2 + 50, // Moved down to make space for the score
      TEXTURE_KEYS.PLAYER
    );
    player.setScale(0.35);
    player.play(ANIMATION_KEYS.PLAYER_IDLE);

    // --- 3. Interactive "Restart" Text with Tween ---
    const restartText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 80, // Moved up slightly
        "Click to Restart",
        {
          fontFamily: "Staatliches",
          fontSize: "48px",
          color: "#cccccc",
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: restartText,
      alpha: 0.6,
      ease: "Sine.easeInOut",
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    // --- 4. Restart Logic ---
    restartText.on("pointerdown", () => {
      this.cameras.main.fadeOut(500, 0, 0, 0, (_: any, progress: any) => {
        if (progress === 1) {
          // Restart the main scene without passing any data
          this.scene.start(SCENE_KEYS.MAIN);
        }
      });
    });
  }
}

export default GameOverScene;
