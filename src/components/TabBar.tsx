import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Barra de navegación inferior tipo app (4 secciones). Se renderiza desde
 * AppShell solo en rutas de sección; los modos de estudio y las vistas
 * empujadas (detalle, stats) no la muestran.
 *
 * Stats salió de la barra a propósito: irá bajo el perfil/Cuenta (Fase E).
 */
const TABS = [
  { path: '/', glyph: '学', label: 'Estudiar' },
  { path: '/tablas', glyph: '表', label: 'Tablas' },
  { path: '/calendar', glyph: '暦', label: 'Calendario' },
  { path: '/settings', glyph: '設', label: 'Ajustes' },
]

export function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav className="tabbar" aria-label="Navegación principal">
      {TABS.map((t) => {
        const active = t.path === '/' ? pathname === '/' : pathname.startsWith(t.path)
        return (
          <button
            key={t.path}
            className={'tab' + (active ? ' active' : '')}
            onClick={() => {
              // Re-pulsar la pestaña activa apilaba entradas duplicadas en el
              // historial (el "atrás" de Android parecía no responder). Ahora,
              // en la activa, se conserva el gesto móvil de "subir arriba".
              if (active) window.scrollTo({ top: 0, behavior: 'smooth' })
              else navigate(t.path)
            }}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tab-glyph">{t.glyph}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
