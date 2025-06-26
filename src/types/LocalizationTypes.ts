export interface LocalizationStrings {
  mainMenu: {
    title: string
    fastPlay: string
    selectLevel: string
    credits: string
    options: string // ADDED
  }
  pause: {
    title: string
    resume: string
    volume: string
    toggleMinimap: string
    minimapState: {
      on: string
      off: string
    }
    backToMenu: string
  }
  credits: {
    title: string
    purpose: string
    developersTitle: string
    developers: string
    artistsTitle: string
    artists: string
    backButton: string
  }
  gameOver: {
    title: string
    yourScore: string
    highScore: string
    restartPrompt: string
  }
  win: {
    title: string
    timeSurvived: string
    restartPrompt: string
  }
  options: {
    // ADD THIS BLOCK
    title: string
    language: string
    volume: string
    toggleMinimap: string
    minimapState: {
      on: string
      off: string
    }
    backButton: string
  }
}
