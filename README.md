
<h1 align="center">
  <br>
  <a href="https://github.com/B-U-M-A/Oh-Gosh/"><img src="https://media.discordapp.net/attachments/1019375030771134565/1387645538798796850/image0.png?ex=685e191d&is=685cc79d&hm=2368d9066fd9aea1149defbb4e28e91abb4ae4f84781129c2075a57224670b3f&=&format=webp&quality=lossless&width=983&height=983" alt="Markdownify" width="200"></a>
  <br>
  Oh-Gosh
  <br>
</h1>

<h4 align="center">An arcade-style, single-player, browser-based video game where players control the character "Juan Becerra"</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#download">Download</a> •
  <a href="#credits">Credits</a> •
  <a href="#related">Related</a> •
  <a href="#license">License</a>
</p>

![screenshot](https://cdn.discordapp.com/attachments/1019375030771134565/1387648250277793792/image.png?ex=685e1ba4&is=685cca24&hm=763784d7678eb025dc2816246db839b29b46857c587a097eded9f65681660c23&)

## Key Features

- **Intuitive Player Control:** Move Juan Becerra horizontally and vertically with keyboard (WASD/Arrow Keys) on desktop or an on-screen virtual joystick on mobile.
- **Dynamic Enemy AI:** "C" enemies continuously pursue Juan Becerra, with their speed and numbers increasing over time for escalating challenge.
- **Collision-based Game Over:** The game ends upon any collision between Juan Becerra and a "C", leading to a clear "Game Over" state.
- **Comprehensive Game State Management:** Handles transitions between start screen, active gameplay, and game over, with options to restart.
- **Immersive Visuals & Audio:** Enjoy a consistent pixel art style with smooth animations, complemented by distinct sound effects for key events and looping background music.
- **High Score Tracking:** Continuously tracks and displays survival time, records high scores, and persists them locally across browser sessions.
- **In-game Tutorial:** A brief, non-intrusive tutorial explains controls and objectives upon first launch.
- **Pause Functionality:** Temporarily halt and resume gameplay with a dedicated input, displaying a "Game Paused" overlay.

## 🎮 How to Play

The objective is simple: **evade the "C"s for as long as possible!**

- **Movement (Desktop):** Use the `W`, `A`, `S`, `D` keys or the `Arrow Keys` to move Juan Becerra.
- **Movement (Mobile):** Use the on-screen virtual joystick located in the bottom-left corner. TODO
- **Pause Game:** Press the `P` key (desktop) or click the designated pause button (if available on UI) during gameplay.

Survive longer to achieve a higher score!

## Download

## 🚀 Technologies Used

- **JavaScript:** The core programming language for the game logic.
- **Phaser.io:** A powerful, open-source HTML5 game framework (version 3.55.2 or later) for building browser-based games.
- **HTML5 Canvas & WebGL:** Utilized by Phaser.io for rendering game elements.


## 📦 Installation & Setup (For Local Development)

To run "Oh-Gosh" locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/B-U-M-A/Oh-Gosh.git
    cd Oh-Gosh
    ```

    (Replace `[repository-url]` with the actual URL of the game's repository.)

2.  **Install dependencies:**
    This project uses Phaser.io, which can often be included directly or managed via a package manager. If `package.json` is present, you might need to run:

    ```bash
    npm install
    # or
    yarn install
    ```


## Credits

- **Concept & Game Design:** Juan Becerra
- **Game Framework:** [Phaser.io](https://phaser.io/)
- **Inspiration:** Classic arcade bullet hell games.
