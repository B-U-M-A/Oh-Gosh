import Phaser from "phaser";
import GameOverScene from "./GameOverScene";

// Use constants for keys to avoid typos and improve maintainability
const TEXTURE_KEYS = {
  PLAYER: "player_character",
  CHASER: "chaser_mob",
};

const ANIMATION_KEYS = {
  PLAYER_IDLE: "player_idle",
};

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private chaser!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private readonly speed = 200;
  private readonly chaserSpeed = 100;

  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    // Load assets here
    for (let i = 0; i <= 3; i++) {
      this.load.image(
        `becerrita_idle_${i}`,
        `src/assets/becerrita/idle/${String(i).padStart(2, "0")}_becerrita.png`
      );
    }
  }

  // preload(): void {
  //   // Improvement 1: Use a single spritesheet for the player animation
  //   this.load.spritesheet(
  //     TEXTURE_KEYS.PLAYER,
  //     "src/assets/becerrita/becerrita_idle_strip.png",
  //     {
  //       frameWidth: 256, // Set the actual width of a single frame
  //       frameHeight: 256, // Set the actual height of a single frame
  //     }
  //   );

  //   // this.load.image(TEXTURE_KEYS.CHASER, "src/assets/react.svg");
  // }

  create() {
    const becerrita = this.physics.add.sprite(400, 300, "becerrita_idle_0");
    this.player = becerrita;
    this.player.setCollideWorldBounds(true);
    this.cursors = this.input.keyboard!.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    }) as Phaser.Types.Input.Keyboard.CursorKeys;

    // Create an array of frame objects from your individual image keys
    const idleFrames = [];
    for (let i = 0; i <= 3; i++) {
      idleFrames.push({ key: `becerrita_idle_${i}` });
    }

    this.anims.create({
      key: "idle",
      frames: idleFrames,
      frameRate: 3,
      repeat: -1,
    });

    becerrita.setScale(0.25);
    becerrita.play("idle");

    // Create chaser as text
    const chaserText = this.add.text(100, 100, "C", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: "#FF00FF", // Fuchsia color
    });
    this.physics.add.existing(chaserText); // Add physics to the text object
    this.chaser = chaserText;
    this.chaser.setScale(2); // Same size as becerrita
    if (this.chaser.body instanceof Phaser.Physics.Arcade.Body) {
      this.chaser.body.setCollideWorldBounds(true); // Keep chaser within bounds
    }
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);
    // Game logic per frame
    if (this.player && this.cursors && this.player.body) {
      this.player.setVelocity(0);

      if (this.cursors.left.isDown) {
        this.player.setVelocityX(-160);
      } else if (this.cursors.right.isDown) {
        this.player.setVelocityX(160);
      }

      if (this.cursors.up.isDown) {
        this.player.setVelocityY(-160);
      } else if (this.cursors.down.isDown) {
        this.player.setVelocityY(160);
      }
    }

    // Normalize the velocity vector to prevent faster diagonal movement
    if (body) {
      body.velocity.normalize().scale(this.speed);
    }

    // chaser chasing logic
    if (this.player && this.chaser && this.chaser.body) {
      this.physics.moveToObject(this.chaser, this.player, this.chaserSpeed);
    }

    // Collision detection
    if (this.player && this.chaser) {
      this.physics.overlap(
        this.player,
        this.chaser,
        this.gameOver,
        undefined,
        this
      );
    }
  }

  gameOver() {
    this.scene.start("GameOverScene");
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  scene: [MainScene, GameOverScene],
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
