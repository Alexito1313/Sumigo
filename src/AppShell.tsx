import { Outlet } from 'react-router-dom'
import { useTheme, type ThemePref } from './theme/ThemeProvider'

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'light', label: '☀ Claro' },
  { value: 'dark', label: '☾ Oscuro' },
  { value: 'auto', label: 'Auto' },
]

/** Layout raíz: contenido de la ruta + conmutador de tema flotante. */
export function AppShell() {
  const { pref, setPref } = useTheme()

  return (
    <div className="app-root">
      <Outlet />

      <div className="theme-toggle" role="group" aria-label="Tema">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={pref === o.value ? 'on' : ''}
            aria-pressed={pref === o.value}
            onClick={() => setPref(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
