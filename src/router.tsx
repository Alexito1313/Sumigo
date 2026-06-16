import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { HomeScreen } from './screens/HomeScreen'
import { FlashcardScreen } from './screens/FlashcardScreen'
import { TestScreen } from './screens/TestScreen'

/**
 * Router de la app.
 *
 * El basename sale de import.meta.env.BASE_URL (que Vite fija según `base`):
 * '/' en desarrollo y '/Sumigo/' en producción. Así las rutas funcionan bajo
 * la subruta de GitHub Pages sin tocar nada.
 *
 * Rutas eager (Home/Flashcard/Test): el flujo de estudio principal, siempre en
 * el bundle inicial. El resto se cargan con `lazy` (chunks aparte) para aligerar
 * la carga inicial; el service worker precachea esos chunks, así que offline
 * siguen disponibles.
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
        {
          path: 'escritura',
          lazy: () => import('./screens/WriteScreen').then((m) => ({ Component: m.WriteScreen })),
        },
        {
          path: 'simulacro',
          lazy: () =>
            import('./screens/SimulacroScreen').then((m) => ({ Component: m.SimulacroScreen })),
        },
        {
          path: 'stats',
          lazy: () => import('./screens/StatsScreen').then((m) => ({ Component: m.StatsScreen })),
        },
        {
          path: 'settings',
          lazy: () =>
            import('./screens/SettingsScreen').then((m) => ({ Component: m.SettingsScreen })),
        },
        {
          path: 'onboarding',
          lazy: () =>
            import('./screens/OnboardingScreen').then((m) => ({ Component: m.OnboardingScreen })),
        },
        {
          path: 'calendar',
          lazy: () =>
            import('./screens/CalendarScreen').then((m) => ({ Component: m.CalendarScreen })),
        },
        {
          path: 'tablas',
          lazy: () => import('./screens/TablasScreen').then((m) => ({ Component: m.TablasScreen })),
        },
        {
          path: 'trazar/:char',
          lazy: () => import('./screens/TraceScreen').then((m) => ({ Component: m.TraceScreen })),
        },
        {
          path: 'cuenta',
          lazy: () => import('./screens/CuentaScreen').then((m) => ({ Component: m.CuentaScreen })),
        },
        {
          path: 'detail/:id',
          lazy: () => import('./screens/DetailScreen').then((m) => ({ Component: m.DetailScreen })),
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename },
)
