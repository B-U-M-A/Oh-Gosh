import Phaser from "phaser";

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create() {
    this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 50,
        "Game Over",
        {
          fontSize: "64px",
          color: "#FF0000",
          fontFamily: "Arial",
        }
      )
      .setOrigin(0.5);

    const retryButton = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 50,
        "Retry",
        {
          fontSize: "32px",
          color: "#00FF00",
          fontFamily: "Arial",
        }
      )
      .setOrigin(0.5)
      .setInteractive();

    retryButton.on("pointerdown", () => {
      this.scene.start("MainScene");
    });
  }
}

export default GameOverScene;
