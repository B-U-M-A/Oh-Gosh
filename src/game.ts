import Phaser from "phaser";
import GameOverScene from "./scenes/GameOverScene";
import MainScene from "./scenes/MainScene";
import PreloaderScene from "./scenes/PreloaderScene"; // Import the new

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  // PreloaderScene is now the first scene to start
  scene: [PreloaderScene, MainScene, GameOverScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

export default game;
