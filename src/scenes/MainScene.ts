import Phaser from 'phaser'
import { sanitizeText } from '../utils/security'
import { ANIMATION_KEYS, SCENE_KEYS, TEXTURE_KEYS } from '../utils/constants'

class MainScene extends Phaser.Scene {
  private player?: Phaser.Physics.Arcade.Sprite
  private chasers!: Phaser.Physics.Arcade.Group
  private wasdCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private arrowCursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private chaserSpawnTimer?: Phaser.Time.TimerEvent

  private startTime: number = 0

  private readonly speed = 200
  private readonly chaserSpeed = 100
  private readonly MAX_CHASERS = 3

  constructor() {
    super({ key: SCENE_KEYS.MAIN })
  }

  create() {
    try {
      this.player = this.physics.add.sprite(400, 300, TEXTURE_KEYS.PLAYER)
      this.player.setCollideWorldBounds(true)
      this.player.setScale(0.25).play(ANIMATION_KEYS.PLAYER_IDLE)
    } catch (error) {
      console.error('Fatal Error: Could not create player sprite. Check if assets loaded correctly.', error)
      // Fallback: Stop the scene and maybe show an error.
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, 'CRITICAL ERROR\nCould not start game.', {
          color: 'red',
          fontSize: '32px',
        })
        .setOrigin(0.5)
      this.scene.pause()
      return
    }

    this.wasdCursors = this.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Phaser.Types.Input.Keyboard.CursorKeys

    this.arrowCursors = this.input.keyboard?.createCursorKeys()

    // --- Add keyboard listeners for pausing ---
    this.input.keyboard?.on('keydown-P', this.togglePause, this)
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this)

    this.chasers = this.physics.add.group()
    this.physics.add.collider(this.chasers, this.chasers)

    this.chaserSpawnTimer = this.time.addEvent({
      delay: 7000,
      callback: this.spawnChaser,
      callbackScope: this,
      loop: true,
    })

    this.startTime = this.time.now

    // --- Clean up listeners on scene shutdown ---
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-P', this.togglePause, this)
      this.input.keyboard?.off('keydown-ESC', this.togglePause, this)
      if (this.chaserSpawnTimer) {
        this.chaserSpawnTimer.remove()
      }
    })
  }

  private togglePause(): void {
    if (!this.scene.isPaused()) {
      this.scene.pause()

      if (this.scene.manager.keys[SCENE_KEYS.PAUSE]) {
        this.scene.launch(SCENE_KEYS.PAUSE)
      } else {
        console.error(`Pause scene key not found: ${SCENE_KEYS.PAUSE}. Cannot pause game.`)
        this.scene.resume()
      }
    }
  }

  private spawnChaser(): void {
    if (
      this.scene.isPaused() ||
      !this.scene.isActive(SCENE_KEYS.MAIN) ||
      this.chasers.getLength() >= this.MAX_CHASERS
    ) {
      return
    }

    const { width, height } = this.sys.game.config
    const sanitizedChar = sanitizeText('C')

    const x = Phaser.Math.Between(50, (width as number) - 50)
    const y = Phaser.Math.Between(50, (height as number) - 50)

    const chaser = this.add.text(x, y, sanitizedChar, {
      fontFamily: "'Comic Sans MS', 'Arial', sans-serif",
      fontSize: '32px',
      color: '#FF00FF',
    })

    this.chasers.add(chaser)
    chaser.setScale(2)

    if (chaser.body instanceof Phaser.Physics.Arcade.Body) {
      chaser.body.setCollideWorldBounds(true).setBounce(1, 1)
    }
  }

  update() {
    if (!this.player || !this.player.body || !this.wasdCursors || !this.arrowCursors) return

    const body = this.player.body as Phaser.Physics.Arcade.Body
    body.setVelocity(0)

    if (this.wasdCursors.left.isDown || this.arrowCursors.left.isDown) {
      body.setVelocityX(-this.speed)
    } else if (this.wasdCursors.right.isDown || this.arrowCursors.right.isDown) {
      body.setVelocityX(this.speed)
    }

    if (this.wasdCursors.up.isDown || this.arrowCursors.up.isDown) {
      body.setVelocityY(-this.speed)
    } else if (this.wasdCursors.down.isDown || this.arrowCursors.down.isDown) {
      body.setVelocityY(this.speed)
    }

    if (body.velocity.x !== 0 && body.velocity.y !== 0) {
      body.velocity.normalize().scale(this.speed)
    }

    this.chasers.getChildren().forEach((chaser) => {
      if (chaser.body && this.player) {
        this.physics.moveToObject(chaser as Phaser.GameObjects.GameObject, this.player, this.chaserSpeed)
      }
    })

    if (this.chasers.getLength() > 0) {
      this.physics.overlap(this.player, this.chasers, this.gameOver, undefined, this)
    }
  }

  gameOver() {
    this.chaserSpawnTimer?.remove(false)
    const finalScore = (this.time.now - this.startTime) / 1000

    // --- Defensively check if the GameOver scene exists before starting it ---
    if (this.scene.manager.keys[SCENE_KEYS.GAME_OVER]) {
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: finalScore })
    } else {
      console.error(`Scene key not found: ${SCENE_KEYS.GAME_OVER}. Cannot show game over screen.`)
      // As a fallback, just stop the current scene to prevent further updates.
      this.scene.stop()
    }
  }
}

export default MainScene
