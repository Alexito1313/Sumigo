import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
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
        { index: true, element: <Placeholder name="Home" jp="ホーム" /> },
        { path: 'flash', element: <Placeholder name="Flashcards" jp="フラッシュカード" /> },
        { path: 'test', element: <Placeholder name="Test" jp="テスト" /> },
        { path: 'repaso', element: <Placeholder name="Repaso" jp="復習" /> },
        { path: 'escritura', element: <Placeholder name="Escritura" jp="書き取り" /> },
        { path: 'simulacro', element: <Placeholder name="Simulacro JLPT" jp="模擬試験" /> },
        { path: 'stats', element: <Placeholder name="Estadísticas" jp="統計" /> },
        { path: 'settings', element: <Placeholder name="Ajustes" jp="設定" /> },
        { path: 'calendar', element: <Placeholder name="Calendario" jp="カレンダー" /> },
        { path: 'detail/:id', element: <Placeholder name="Detalle de carta" jp="詳細" /> },
      ],
    },
  ],
  { basename },
)
