/**
 * @file This is the entry point for the React application.
 * It sets up the root DOM element and renders the main App component.
 */

// Import necessary modules from React and ReactDOM.
// StrictMode is a tool for highlighting potential problems in an application.
import { StrictMode } from 'react'
// createRoot is used to create a root for concurrent mode rendering.
import { createRoot } from 'react-dom/client'

// Import the global CSS styles for the application.
import './index.css'

// Import the main App component, which serves as the root of our component tree.
import App from './App.tsx'

// Find the DOM element with the ID 'root'. This is where our React application will be mounted.
// The '!' is a non-null assertion operator, indicating that we are sure the element will exist.
const rootElement = document.getElementById('root')!

// Create a React root for the application.
// This enables concurrent features and is the recommended way to render React apps in React 18+.
const root = createRoot(rootElement)

// Render the main App component into the root.
// The App is wrapped in StrictMode to enable additional checks and warnings during development.
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
