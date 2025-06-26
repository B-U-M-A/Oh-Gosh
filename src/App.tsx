import { useEffect, useRef } from 'react'
import game from './game'
import './App.css'

/**
 * Main application component that mounts and manages the Phaser game instance.
 * Handles the integration between React and Phaser by managing the game canvas DOM element.
 */
function App() {
  // Reference to the DOM element where the Phaser game canvas will be mounted
  const gameContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only proceed if the DOM reference is available
    if (gameContainerRef.current) {
      // Remove the Phaser canvas from its default parent element
      game.canvas.parentElement?.removeChild(game.canvas)
      // Append the Phaser canvas to our designated container
      gameContainerRef.current.appendChild(game.canvas)
    }
    // Empty dependency array ensures this effect runs only once after initial render
  }, [])

  // Render the container div that will host the Phaser game canvas
  // The ref prop connects this div to our gameContainerRef for DOM manipulation
  return <div id="game-container" ref={gameContainerRef}></div>
}

export default App
