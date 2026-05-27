import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { FarmProvider } from './context/FarmContext'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <FarmProvider>
          <App />
        </FarmProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
