import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import WorldCupPredictor from './wcpredictor/WorldCupPredictor.jsx'

const route = window.location.pathname.replace(/\/$/, '')
const root = createRoot(document.getElementById('root'))

if (route === '/worldcup-predictor') {
  root.render(
    <StrictMode>
      <WorldCupPredictor />
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
