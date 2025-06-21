import Phaser from "phaser";
import GameOverScene from "./GameOverScene";

// --- CONSTANTS --- //

const TEXTURE_KEYS = {
  PLAYER: "player_character",
};

const ANIMATION_KEYS = {
  PLAYER_IDLE: "player_idle",
};

const SCENE_KEYS = {
  MAIN: "MainScene",
  GAME_OVER: "GameOverScene",
};

// --- MAIN SCENE --- //

class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite;
  private chaser?: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private readonly speed = 200;
  private readonly chaserSpeed = 100;

  constructor() {
    super({ key: SCENE_KEYS.MAIN });
  }

  // Preloads game assets like spritesheets.
  preload(): void {
    this.load.spritesheet(
      TEXTURE_KEYS.PLAYER,
      "src/assets/becerrita/idle/becerrite.png",
      {
        frameWidth: 512, // Set the actual width of a single frame
        frameHeight: 512, // Set the actual height of a single frame
      }
    );
  }

  // Creates game objects and initializes the scene.
  create() {
    this.player = this.physics.add.sprite(400, 300, TEXTURE_KEYS.PLAYER);
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard?.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
    }) as Phaser.Types.Input.Keyboard.CursorKeys;

    // Create the animation from the spritesheet
    this.anims.create({
      key: ANIMATION_KEYS.PLAYER_IDLE,
      frames: this.anims.generateFrameNumbers(TEXTURE_KEYS.PLAYER, {
        start: 0,
        end: 3,
      }),
      frameRate: 3,
      repeat: -1,
    });

    this.player.setScale(0.25);
    this.player.play(ANIMATION_KEYS.PLAYER_IDLE);

    // Create chaser as text
    this.chaser = this.add.text(100, 100, "C", {
      fontFamily: "Comic Sans MS",
      fontSize: "32px",
      color: "#FF00FF",
    });

    this.physics.add.existing(this.chaser);
    this.chaser.setScale(2);

    if (this.chaser.body instanceof Phaser.Physics.Arcade.Body) {
      this.chaser.body.setCollideWorldBounds(true);
    }
  }

  update() {
    const body = this.player?.body;

    if (body instanceof Phaser.Physics.Arcade.Body) {
      body.setVelocity(0);
    }

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
