import Phaser from 'phaser'
import GameOverScene from './scenes/GameOverScene'
import MainScene from './scenes/MainScene'
import PreloaderScene from './scenes/PreloaderScene'
import PauseScene from './scenes/PauseScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  parent: 'game-container',
  scene: [PreloaderScene, MainScene, GameOverScene, PauseScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      // Set to true to see physics bodies for debugging
      debug: false,
    },
  },
}

// --- Game Initialization ---
// We wrap the game creation in a try-catch block to handle
// potential browser/WebGL context creation errors.
let game: Phaser.Game

try {
  game = new Phaser.Game(config)
} catch (error) {
  console.error('Failed to create Phaser game instance:', error)
  // You could display a user-friendly error message on the page here
  const errorElement = document.createElement('div')
  errorElement.innerHTML = `
    <h1 style="color: red;">Phaser Game Error</h1>
    <p>Sorry, the game could not be started. This might be due to an unsupported browser or a graphics driver issue.</p>
    <p>Please try updating your browser or graphics drivers.</p>
  `
  document.body.appendChild(errorElement)
  // Re-throw or handle as needed
  throw error
}

export default game
