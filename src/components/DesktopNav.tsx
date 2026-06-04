import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useAccount } from '../data/account/accountStore'
import { LevelChip } from './LevelChip'

/* ============================================================
   DesktopNav — barra lateral fija (≥960px). Sustituye a la tab bar
   inferior del móvil. La renderiza AppShell siempre (salvo onboarding)
   y el CSS la oculta por debajo de 960px. NO cambia ninguna lógica:
   solo navega a las mismas rutas.
   ============================================================ */

const NAV: { group: string; items: { path: string; glyph: string; label: string }[] }[] = [
  {
    group: 'Estudio',
    items: [
      { path: '/', glyph: '学', label: 'Estudiar' },
      { path: '/tablas', glyph: '表', label: 'Tablas' },
    ],
  },
  {
    group: 'Progreso',
    items: [
      { path: '/stats', glyph: '統', label: 'Estadísticas' },
      { path: '/calendar', glyph: '暦', label: 'Calendario' },
    ],
  },
  {
    group: 'Cuenta',
    items: [{ path: '/settings', glyph: '設', label: 'Ajustes' }],
  },
]

export function DesktopNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { variant, setPref } = useTheme()
  const account = useAccount()

  const isActive = (p: string) => (p === '/' ? pathname === '/' : pathname.startsWith(p))
  const initial = account?.email?.[0]?.toUpperCase() ?? '？'

  return (
    <aside className="desktop-nav" aria-label="Navegación principal">
      <div className="dk-brand">
        <span className="dk-mark">朱</span>
        <span className="dk-wm">
          <b>日本語</b>
          <small>estudio</small>
        </span>
      </div>

      <div className="dk-level">
        <LevelChip />
      </div>

      <nav className="dk-nav">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="dk-group">{g.group}</div>
            {g.items.map((it) => (
              <button
                key={it.path}
                className={'dk-navitem' + (isActive(it.path) ? ' active' : '')}
                onClick={() => navigate(it.path)}
                aria-current={isActive(it.path) ? 'page' : undefined}
              >
                <span className="dk-gl">{it.glyph}</span>
                {it.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="dk-spacer" />

      <div className="dk-foot">
        <div className="dk-theme" role="group" aria-label="Tema">
          <button
            className={variant === 'a' ? 'on' : ''}
            onClick={() => setPref('light')}
            aria-pressed={variant === 'a'}
          >
            ☀ Claro
          </button>
          <button
            className={variant === 'b' ? 'on' : ''}
            onClick={() => setPref('dark')}
            aria-pressed={variant === 'b'}
          >
            ☾ Oscuro
          </button>
        </div>
        <button className="dk-user" onClick={() => navigate('/cuenta')}>
          <span className="dk-ava">{account ? initial : '？'}</span>
          <span className="dk-uinfo">
            <span className="dk-uname">{account ? account.email : 'Invitado'}</span>
            <span className="dk-uplan">{account ? 'Mi cuenta' : 'Inicia sesión →'}</span>
          </span>
        </button>
      </div>
    </aside>
  )
}
