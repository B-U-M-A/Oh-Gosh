import Phaser from 'phaser'
import { SCENE_KEYS } from '../utils/constants'

class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PAUSE })
  }

  create() {
    // --- Create a semi-transparent background overlay ---
    this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7)
      .setOrigin(0.5)

    // --- "Paused" Text ---
    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 50, 'PAUSED', {
        fontFamily: 'Staatliches',
        fontSize: '96px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)

    // --- "Resume" Instruction Text ---
    const resumeText = this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 50, 'Press P or ESC to Resume', {
        fontFamily: 'Staatliches',
        fontSize: '48px',
        color: '#dddddd',
      })
      .setOrigin(0.5)

    // --- Add a subtle tween to the resume text for better UX ---
    this.tweens.add({
      targets: resumeText,
      alpha: 0.5,
      ease: 'Sine.easeInOut',
      duration: 1200,
      yoyo: true,
      repeat: -1,
    })

    // --- Keyboard listener to resume the game ---
    this.input.keyboard?.on('keydown-P', this.resumeGame, this)
    this.input.keyboard?.on('keydown-ESC', this.resumeGame, this)
  }

  private resumeGame(): void {
    // --- Clean up listeners to prevent multiple triggers ---
    this.input.keyboard?.off('keydown-P', this.resumeGame, this)
    this.input.keyboard?.off('keydown-ESC', this.resumeGame, this)

    // --- Resume the main game scene and stop this pause scene ---
    if (this.scene.manager.keys[SCENE_KEYS.MAIN]) {
      this.scene.resume(SCENE_KEYS.MAIN)
    }

    this.scene.stop()
  }
}

export default PauseScene
