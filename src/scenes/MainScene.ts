import Phaser from "phaser";
import { sanitizeText } from "../utils/security";
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS } from "../utils/constants";

class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite;
  private chasers!: Phaser.Physics.Arcade.Group;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private chaserSpawnTimer?: Phaser.Time.TimerEvent;

  // --- NEW: Property to track start time ---
  private startTime: number = 0;

  private readonly speed = 200;
  private readonly chaserSpeed = 100;
  private readonly MAX_CHASERS = 3;

  constructor() {
    super({ key: SCENE_KEYS.MAIN });
  }

  create() {
    this.player = this.physics.add.sprite(400, 300, TEXTURE_KEYS.PLAYER);
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Phaser.Types.Input.Keyboard.CursorKeys;

    this.player.setScale(0.25).play(ANIMATION_KEYS.PLAYER_IDLE);

    this.chasers = this.physics.add.group();
    this.physics.add.collider(this.chasers, this.chasers);

    this.chaserSpawnTimer = this.time.addEvent({
      delay: 7000,
      callback: this.spawnChaser,
      callbackScope: this,
      loop: true,
    });

    // --- NEW: Record the start time ---
    this.startTime = this.time.now;
  }

  private spawnChaser(): void {
    if (
      !this.scene.isActive(SCENE_KEYS.MAIN) ||
      this.chasers.getLength() >= this.MAX_CHASERS
    ) {
      this.chaserSpawnTimer?.remove();
      return;
    }

    const { width, height } = this.sys.game.config;
    const sanitizedChar = sanitizeText("C");

    const x = Phaser.Math.Between(50, (width as number) - 50);
    const y = Phaser.Math.Between(50, (height as number) - 50);

    const chaser = this.add.text(x, y, sanitizedChar, {
      fontFamily: "'Comic Sans MS', 'Arial', sans-serif",
      fontSize: "32px",
      color: "#FF00FF",
    });

    this.chasers.add(chaser);
    chaser.setScale(2);

    if (chaser.body instanceof Phaser.Physics.Arcade.Body) {
      chaser.body.setCollideWorldBounds(true).setBounce(1, 1);
    }
  }

  update() {
    if (!this.player || !this.player.body || !this.cursors) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (this.cursors.left.isDown) body.setVelocityX(-this.speed);
    else if (this.cursors.right.isDown) body.setVelocityX(this.speed);

    if (this.cursors.up.isDown) body.setVelocityY(-this.speed);
    else if (this.cursors.down.isDown) body.setVelocityY(this.speed);

    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(this.speed);
    }

    this.chasers.getChildren().forEach((chaser) => {
      if (chaser.body && this.player) {
        this.physics.moveToObject(
          chaser as Phaser.GameObjects.GameObject,
          this.player,
          this.chaserSpeed
        );
      }
    });

    if (this.chasers.getLength() > 0) {
      this.physics.overlap(
        this.player,
        this.chasers,
        this.gameOver,
        undefined,
        this
      );
    }
  }

  gameOver() {
    this.chaserSpawnTimer?.remove(false);

    // --- NEW: Calculate the final score ---
    const finalScore = (this.time.now - this.startTime) / 1000;

    // --- NEW: Pass the score to the GameOverScene ---
    this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore });
  }
}

export default MainScene;
