import { useEffect, useRef } from 'react'
import game from './game'
import './App.css'

function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gameContainerRef.current) {
      game.canvas.parentElement?.removeChild(game.canvas)
      gameContainerRef.current.appendChild(game.canvas)
    }
  }, [])

  return <div id="game-container" ref={gameContainerRef}></div>
}

export default App
