// src/types/LocalizationTypes.ts

/**
 * Defines the structure for all localizable strings used in the game.
 * Each property represents a different game section with its own set of strings.
 */
export interface LocalizationStrings {
  /** Common strings used across multiple scenes */
  common: {
    backButton: string
    toggleMinimap: string
    minimapState: { on: string; off: string }
  }
  /** Strings used in the main menu screen */
  mainMenu: {
    title: string
    fastPlay: string
    selectLevel: string
    credits: string
    options: string
  }
  /** Strings used in the pause menu screen */
  pause: {
    title: string
    resume: string
    volume: string
    backToMenu: string
  }
  /** Strings used in the credits screen */
  credits: {
    title: string
    purpose: string
    developersTitle: string
    developers: string
    artistsTitle: string
    artists: string
  }
  /** Strings used in the game over screen */
  gameOver: {
    title: string
    yourScore: string
    highScore: string
    restartPrompt: string
    assetLoadError: string
  }
  /** Strings used in the victory/win screen */
  win: {
    title: string
    timeSurvived: string
    restartPrompt: string
  }
  /** Strings used in the options/settings screen */
  options: {
    title: string
    language: string
    volume: string
  }
  level1: {
    survive: string
  }
}
