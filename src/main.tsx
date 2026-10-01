import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Stage } from './app/Stage'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Stage>
      <p>Radtech Simulator</p>
    </Stage>
  </StrictMode>,
)
