# Oh Gosh

Oh Gosh is an arcade-style, single-player, browser-based video game where players control the character "Juan Becerra" with the objective of escaping from multiple pursuing entities referred to as "C"s. Featuring a distinct pixel art aesthetic, the game focuses on evasion and survival, offering an engaging and challenging experience directly within your web browser.

## ✨ Features

- **Intuitive Player Control:** Move Juan Becerra horizontally and vertically with keyboard (WASD/Arrow Keys) on desktop or an on-screen virtual joystick on mobile.
- **Dynamic Enemy AI:** "C" enemies continuously pursue Juan Becerra, with their speed and numbers increasing over time for escalating challenge.
- **Collision-based Game Over:** The game ends upon any collision between Juan Becerra and a "C", leading to a clear "Game Over" state.
- **Comprehensive Game State Management:** Handles transitions between start screen, active gameplay, and game over, with options to restart.
- **Immersive Visuals & Audio:** Enjoy a consistent pixel art style with smooth animations, complemented by distinct sound effects for key events and looping background music.
- **High Score Tracking:** Continuously tracks and displays survival time, records high scores, and persists them locally across browser sessions.
- **In-game Tutorial:** A brief, non-intrusive tutorial explains controls and objectives upon first launch.
- **Pause Functionality:** Temporarily halt and resume gameplay with a dedicated input, displaying a "Game Paused" overlay.

## 🚀 Technologies Used

- **JavaScript:** The core programming language for the game logic.
- **Phaser.io:** A powerful, open-source HTML5 game framework (version 3.55.2 or later) for building browser-based games.
- **HTML5 Canvas & WebGL:** Utilized by Phaser.io for rendering game elements.

## 🎮 How to Play

The objective is simple: **evade the "C"s for as long as possible!**

- **Movement (Desktop):** Use the `W`, `A`, `S`, `D` keys or the `Arrow Keys` to move Juan Becerra.
- **Movement (Mobile):** Use the on-screen virtual joystick located in the bottom-left corner.
- **Pause Game:** Press the `P` key (desktop) or click the designated pause button (if available on UI) during gameplay.

Survive longer to achieve a higher score!

## 📦 Installation & Setup (For Local Development)

To run "Juan Becerra's Escape Game" locally:

1.  **Clone the repository:**

    ```bash
    git clone [repository-url]
    cd juan-becerra-escape-game
    ```

    (Replace `[repository-url]` with the actual URL of the game's repository.)

2.  **Install dependencies:**
    This project uses Phaser.io, which can often be included directly or managed via a package manager. If `package.json` is present, you might need to run:

    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Start a local server:**
    Since this is a browser-based game, you'll need a local web server to serve the HTML, JavaScript, and assets. You can use tools like `http-server` (Node.js) or Python's built-in server:

    - **Using `http-server` (Node.js):**
      ```bash
      npm install -g http-server
      http-server .
      ```
    - **Using Python 3:**
      ```bash
      python -m http.server
      ```

4.  **Open in browser:**
    After starting the server, open your web browser and navigate to `http://localhost:8080` (or the port indicated by your server).

## 🤝 Credits / Acknowledgements

- **Concept & Game Design:** Juan Becerra
- **Game Framework:** [Phaser.io](https://phaser.io/)
- **Inspiration:** Classic arcade evasion games.
