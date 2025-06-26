/**
 * Player-related constants
 */
export const PLAYER = {
  /**
   * Base movement speed of the player character in pixels per second
   */
  SPEED: 200,
}

/**
 * Texture keys for game assets
 */
export const TEXTURE_KEYS = {
  IDLE: 'player_character_idle',
  WALK: 'player_character_walk',
}

/**
 * Tile texture keys for world tiles
 */
export const TILE_KEYS = {
  GRASS: 'grass_tile',
  DIRT: 'dirt_tile',
  DIRT_PATH: 'dirt_path_tile',
}

/**
 * Animation keys for character animations
 */
export const ANIMATION_KEYS = {
  PLAYER_IDLE: 'player_idle',
  PLAYER_WALK: 'player_walk',
}

/**
 * Audio keys for sound effects
 */
export const AUDIO_KEYS = {
  COLLISION: 'collision_sound',
  IN_GAME_MUSIC: 'in_game_music',
}

/**
 * Scene keys for Phaser game scenes
 */
export const SCENE_KEYS = {
  PRELOADER: 'PreloaderScene',
  LEVEL1: 'Level1Scene',
  GAME_OVER: 'GameOverScene',
  PAUSE: 'PauseScene',
  MAIN_MENU: 'MainMenuScene',
  CREDITS: 'CreditsScene',
  WIN: 'WinScene',
  OPTIONS: 'OptionsScene',
}

/**
 * Local storage keys for persistent data
 */
export const LOCAL_STORAGE_KEYS = {
  HIGH_SCORE: 'becerrita_high_score',
}

/**
 * Difficulty settings that scale as the game progresses
 */
export const DIFFICULTY = {
  /**
   * Starting movement speed of enemy chasers (pixels per second)
   */
  INITIAL_CHASER_SPEED: 100,
  /**
   * Maximum possible movement speed of enemy chasers (pixels per second)
   */
  MAX_CHASER_SPEED: 300,
  /**
   * Amount to increase chaser speed by at each difficulty interval (pixels per second)
   */
  SPEED_INCREASE_AMOUNT: 20,
  /**
   * Score interval (in seconds survived) that triggers a chaser speed increase
   */
  SPEED_INCREASE_INTERVAL_SCORE: 10,

  /**
   * Initial delay between enemy spawns (milliseconds)
   */
  INITIAL_SPAWN_DELAY: 3000,
  /**
   * Minimum possible delay between enemy spawns (milliseconds)
   */
  MIN_SPAWN_DELAY: 500,
  /**
   * Amount to decrease spawn delay by at each difficulty interval (milliseconds)
   */
  SPAWN_DECREASE_AMOUNT: 100,
  /**
   * Score interval (in seconds survived) that triggers a spawn delay decrease
   */
  SPAWN_DECREASE_INTERVAL_SCORE: 15,

  /**
   * How frequently (in score points) to check and update difficulty settings
   */
  DIFFICULTY_UPDATE_INTERVAL_SCORE: 1,
}

/**
 * Conditions required to win the game
 */
export const WIN_CONDITION = {
  /**
   * Time player must survive to win (milliseconds)
   */
  TIME_TO_SURVIVE_MS: 40000, // Survive for 40 seconds to win
}
