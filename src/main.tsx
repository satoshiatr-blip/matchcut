import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Spike from './Spike.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {location.hash === '#spike' ? <Spike /> : <App />}
  </StrictMode>,
)
