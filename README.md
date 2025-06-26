<h1 align="center">
  <br>
  <a href="https://github.com/B-U-M-A/Oh-Gosh/"><img src="https://media.discordapp.net/attachments/1019375030771134565/1387645538798796850/image0.png?ex=685e191d&is=685cc79d&hm=2368d9066fd9aea1149defbb4e28e91abb4ae4f84781129c2075a57224670b3f&=&format=webp&quality=lossless&width=983&height=983" alt="Markdownify" width="200"></a>
  <br>
  Oh-Gosh
  <br>
</h1>

<h4 align="center">An arcade-style, single-player, browser-based video game where players control the character "Juan Becerra"</h4>

<p align="center">
  <a href="#project-status">Project Status</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#gameplay-overview">Gameplay Overview</a> •
  <a href="#controls">Controls</a> •
  <a href="#technologies-used">Technologies Used</a> •
  <a href="#installation--setup-for-local-development">Installation & Setup</a> •
  <a href="#future-enhancements">Future Enhancements</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
  <a href="#contributing">Contributing</a>
</p>

![screenshot](https://cdn.discordapp.com/attachments/1019375030771134565/1387648250277793792/image.png?ex=685e1ba4&is=685cca24&hm=763784d7678eb025dc2816246db839b29b46857c587a097eded9f65681660c23&)

## Project Status

This project is currently **under active development**. New features, bug fixes, and performance improvements are regularly being implemented.

## Key Features

- **Intuitive Player Control:** Navigate Juan Becerra using keyboard (WASD/Arrow Keys) on desktop.
- **Dynamic Enemy AI:** "C" enemies relentlessly pursue Juan Becerra, increasing in speed and numbers over time for an escalating challenge.
- **Collision-based Game Over:** The game concludes upon any collision between Juan Becerra and an enemy, transitioning to a clear "Game Over" state.
- **Comprehensive Game State Management:** Seamless transitions between the main menu, active gameplay, pause, game over, and win screens, with options to restart.
- **Immersive Visuals & Audio:** Experience a consistent pixel art style with smooth animations, complemented by distinct sound effects for key events and looping background music.
- **High Score Tracking:** Continuously tracks and displays survival time, records high scores, and persists them locally across browser sessions.
- **Multi-language Support:** Play the game in English, Spanish, or Portuguese, with all UI text dynamically updating.
- **Pause Functionality:** Temporarily halt and resume gameplay with a dedicated input, displaying a "Game Paused" overlay with volume and minimap controls.
- **Dynamic Difficulty Scaling:** Enemies become faster and spawn more frequently as your survival time increases.
- **Procedural World Generation:** Explore an infinitely generating world composed of unique chunks.
- **Minimap:** A configurable minimap helps players navigate the expansive game world.

## Gameplay Overview

In "Oh-Gosh," your primary objective is to **evade the relentless "C" enemies for as long as possible!** Control Juan Becerra in a top-down, procedurally generated world. As time progresses, the challenge intensifies with faster and more numerous enemies. Survive to achieve the highest score and aim to reach the ultimate win condition by outlasting the clock!

## Controls

The objective is simple: **evade the "C"s for as long as possible!**

- **Movement (Desktop):** Use the `W`, `A`, `S`, `D` keys or the `Arrow Keys` to move Juan Becerra.
- **Pause Game:** Press the `P` key or `ESC` key during gameplay to pause/unpause.
- **Menu Navigation:** Use `Arrow Keys` to navigate menu options and `ENTER` or `SPACE` to select.

Survive longer to achieve a higher score!

## 🚀 Technologies Used

- **JavaScript:** The core programming language for the game logic.
- **Phaser.io:** A powerful, open-source HTML5 game framework (version 3.90.0 or later) for building browser-based games.
- **HTML5 Canvas & WebGL:** Utilized by Phaser.io for rendering game elements.
- **TypeScript:** For enhanced code quality, maintainability, and type safety.
- **Vite:** A fast build tool for modern web projects.
- **React:** Used for the main application shell (`App.tsx`) that embeds the Phaser game.

## 📦 Installation & Setup (For Local Development)

To run "Oh-Gosh" locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/B-U-M-A/Oh-Gosh.git
    cd Oh-Gosh
    ```

2.  **Install dependencies:**
    This project uses Phaser.io and other dependencies managed via npm.

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

    This will start a local development server, usually accessible at `http://localhost:5173/`.

4.  **Build for production:**

    ```bash
    npm run build
    ```

    This command compiles the project into the `dist` directory, ready for deployment.

## Future Enhancements

- **Mobile Controls:** Implement an on-screen virtual joystick for mobile device compatibility.
- **More Enemy Types:** Introduce new enemy behaviors and visual variations.
- **Power-ups/Collectibles:** Add items that grant temporary advantages or score bonuses.
- **Multiple Levels/Environments:** Expand the game with distinct levels or biomes.
- **Sound Effects & Music Expansion:** Add more diverse audio cues and background tracks.
- **Improved UI/UX:** Further refine user interface elements for better clarity and responsiveness.

## Credits

- **Concept & Game Design:** Juan Becerra
- **Game Framework:** [Phaser.io](https://phaser.io/)
- **Inspiration:** Classic arcade bullet hell games.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! If you have suggestions for improvements or find any bugs, please open an issue or submit a pull request.
