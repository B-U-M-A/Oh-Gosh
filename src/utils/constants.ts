export const TEXTURE_KEYS = {
  IDLE: 'player_character_idle',
  WALK: 'player_character_walk',
}

export const TILE_KEYS = {
  GRASS: 'grass_tile',
  DIRT: 'dirt_tile',
  DIRT_PATH: 'dirt_path_tile',
}

export const ANIMATION_KEYS = {
  PLAYER_IDLE: 'player_idle',
  PLAYER_WALK: 'player_walk',
}

export const AUDIO_KEYS = {
  COLLISION: 'collision_sound',
}

export const SCENE_KEYS = {
  PRELOADER: 'PreloaderScene',
  LEVEL1: 'Level1Scene',
  GAME_OVER: 'GameOverScene',
  PAUSE: 'PauseScene',
  MAIN_MENU: 'MainMenuScene',
  CREDITS: 'CreditsScene',
  WIN: 'WinScene',
}

export const LOCAL_STORAGE_KEYS = {
  HIGH_SCORE: 'becerrita_high_score',
}

// Add this new export block at the end of the file
export const DIFFICULTY = {
  INITIAL_CHASER_SPEED: 100, // Initial speed of chasers
  MAX_CHASER_SPEED: 300, // Maximum speed chasers can reach
  SPEED_INCREASE_AMOUNT: 20, // How much speed increases per interval
  SPEED_INCREASE_INTERVAL_SCORE: 10, // Score points (seconds survived) after which chaser speed increases

  INITIAL_SPAWN_DELAY: 3000, // Initial delay between chaser spawns (ms)
  MIN_SPAWN_DELAY: 500, // Minimum delay between chaser spawns (ms)
  SPAWN_DECREASE_AMOUNT: 100, // How much spawn delay decreases per interval (ms)
  SPAWN_DECREASE_INTERVAL_SCORE: 15, // Score points (seconds survived) after which spawn delay decreases

  DIFFICULTY_UPDATE_INTERVAL_SCORE: 1, // How often (in score points) to check and update difficulty
}

// New: Win Condition
export const WIN_CONDITION = {
  TIME_TO_SURVIVE_MS: 40000, // Survive for 40 seconds to win
}
