import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { HomeScreen } from './screens/HomeScreen'
import { FlashcardScreen } from './screens/FlashcardScreen'
import { TestScreen } from './screens/TestScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { StatsScreen } from './screens/StatsScreen'
import { DetailScreen } from './screens/DetailScreen'
import { CalendarScreen } from './screens/CalendarScreen'
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
      children: [
        { index: true, element: <HomeScreen /> },
        { path: 'flash', element: <FlashcardScreen /> },
        { path: 'test', element: <TestScreen /> },
        { path: 'repaso', element: <FlashcardScreen mode="review" /> },
        { path: 'escritura', element: <Placeholder name="Escritura" jp="書き取り" /> },
        { path: 'simulacro', element: <Placeholder name="Simulacro JLPT" jp="模擬試験" /> },
        { path: 'stats', element: <StatsScreen /> },
        { path: 'settings', element: <SettingsScreen /> },
        { path: 'onboarding', element: <OnboardingScreen /> },
        { path: 'calendar', element: <CalendarScreen /> },
        { path: 'detail/:id', element: <DetailScreen /> },
      ],
    },
  ],
  { basename },
)
