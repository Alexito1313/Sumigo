import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ThemeProvider } from './theme/ThemeProvider'
import { ProgressProvider } from './data/progress/ProgressContext'

// Sistema visual del handoff (tokens .va/.vb + componentes) y escena decorativa.
import './styles/styles.css'
import './styles/scenes.css'
import './styles/styles-prototype.css'
import './styles/styles-test-prototype.css'
import './styles/styles-settings.css'
import './styles/styles-onboarding.css'
import './styles/styles-stats.css'
import './styles/styles-detail.css'
import './styles/styles-calendar.css'
import './styles/styles-write.css'
import './styles/styles-simulacro.css'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </ThemeProvider>
  </StrictMode>,
)
