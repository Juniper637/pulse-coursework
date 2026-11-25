import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { App } from './App'
import '@pulse/ui/style.css'
import './style.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Не найден корневой элемент приложения')
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
