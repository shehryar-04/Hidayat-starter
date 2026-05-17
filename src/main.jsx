import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
const app = (
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
)

// If the root element has pre-rendered content (from build-time pre-rendering),
// use hydrateRoot to attach React to the existing DOM without re-rendering.
// Otherwise, use createRoot for a fresh client-side render.
if (rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app)
} else {
  ReactDOM.createRoot(rootElement).render(app)
}
