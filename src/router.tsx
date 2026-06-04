import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { HomeScreen } from './screens/HomeScreen'
import { FlashcardScreen } from './screens/FlashcardScreen'
import { TestScreen } from './screens/TestScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { StatsScreen } from './screens/StatsScreen'
import { DetailScreen } from './screens/DetailScreen'
import { CalendarScreen } from './screens/CalendarScreen'
import { TablasScreen } from './screens/TablasScreen'
import { TraceScreen } from './screens/TraceScreen'
import { CuentaScreen } from './screens/CuentaScreen'
import { WriteScreen } from './screens/WriteScreen'
import { SimulacroScreen } from './screens/SimulacroScreen'
import { Placeholder } from './screens/Placeholder'

/**
 * Router de la app. Las pantallas son placeholders en la Fase 0; se irán
 * sustituyendo por las reales en fases posteriores.
 *
 * El basename sale de import.meta.env.BASE_URL (que Vite fija según `base`):
 * '/' en desarrollo y '/JapoWeb/' en producción. Así las rutas funcionan bajo
 * la subruta de GitHub Pages sin tocar nada.
 */
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      errorElement: (
        <div className="home-loading" style={{ padding: 24, textAlign: 'center' }}>
          Algo salió mal. <a href={import.meta.env.BASE_URL}>Volver al inicio</a>
        </div>
      ),
      children: [
        { index: true, element: <HomeScreen /> },
        { path: 'flash', element: <FlashcardScreen /> },
        { path: 'test', element: <TestScreen /> },
        { path: 'repaso', element: <FlashcardScreen mode="review" /> },
        { path: 'escritura', element: <WriteScreen /> },
        { path: 'simulacro', element: <SimulacroScreen /> },
        { path: 'stats', element: <StatsScreen /> },
        { path: 'settings', element: <SettingsScreen /> },
        { path: 'onboarding', element: <OnboardingScreen /> },
        { path: 'calendar', element: <CalendarScreen /> },
        { path: 'tablas', element: <TablasScreen /> },
        { path: 'trazar/:char', element: <TraceScreen /> },
        { path: 'cuenta', element: <CuentaScreen /> },
        { path: 'detail/:id', element: <DetailScreen /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename },
)
