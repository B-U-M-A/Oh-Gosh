import { initiateDiscordSDK } from './utils/discordSdk';

import Phaser from 'phaser'
import GameOverScene from './scenes/GameOverScene'
import Level1Scene from './scenes/Level1Scene'
import Level2Scene from './scenes/Level2Scene'
import PreloaderScene from './scenes/PreloaderScene'
import PauseScene from './scenes/PauseScene'
import CreditsScene from './scenes/CreditsScene'
import MainMenuScene from './scenes/MainMenuScene'
import WinScene from './scenes/WinScene'
import OptionsScene from './scenes/OptionsScene'
import LevelSelectorScene from './scenes/LevelSelectorScene'

let game: Phaser.Game

(async () => {
  await initiateDiscordSDK();

  /**
   * Main Phaser game configuration object.
   * Defines core settings for the game including display, scaling, scenes, and physics.
   */
  const config: Phaser.Types.Core.GameConfig = {
    // Determines the renderer type (AUTO chooses between WebGL and Canvas)
    type: Phaser.AUTO,
    // Game width set to browser window width
    width: window.innerWidth,
    // Game height set to browser window height
    height: window.innerHeight,
    // Scaling configuration to handle responsive resizing
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // DOM element ID where the game canvas will be inserted
    parent: 'game-container',
    // Array of scenes that make up the game, in order of execution
    scene: [
      PreloaderScene,
      MainMenuScene,
      LevelSelectorScene,
      Level1Scene,
      Level2Scene,
      GameOverScene,
      PauseScene,
      CreditsScene,
      WinScene,
      OptionsScene,
    ],
    physics: {
      default: 'arcade',
      arcade: {
        // Physics gravity settings (x,y) - zero means no gravity
        gravity: { x: 0, y: 0 },
        // When true, shows physics body outlines for debugging collisions
        debug: false,
      },
    },
  }

  // --- Game Initialization ---
  // We wrap the game creation in a try-catch block to handle
  // potential browser/WebGL context creation errors.
  /**
   * The main Phaser game instance.
   * This is the root object that manages the game loop, scenes, and all Phaser systems.
   */
  try {
    // Attempt to create the Phaser game instance with our configuration
    // This can fail if WebGL isn't supported or other initialization errors occur
    game = new Phaser.Game(config)
  } catch (error) {
    console.error('Failed to create Phaser game instance:', error)
    // Create and display a user-friendly error message when game fails to initialize
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
})();

export default game
