import { Link } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/flash', label: 'Flashcards' },
  { to: '/test', label: 'Test' },
  { to: '/repaso', label: 'Repaso' },
  { to: '/escritura', label: 'Escritura' },
  { to: '/simulacro', label: 'Simulacro' },
  { to: '/stats', label: 'Stats' },
  { to: '/calendar', label: 'Calendario' },
  { to: '/settings', label: 'Ajustes' },
]

/**
 * Pantalla provisional de la Fase 0. Sirve para validar que el sistema de tema,
 * las fuentes, los tokens y el router funcionan. Se reemplaza por las pantallas
 * reales en fases siguientes.
 */
export function Placeholder({ name, jp }: { name: string; jp: string }) {
  const { variant } = useTheme()

  return (
    <div className="ph">
      <div className="brand-mark">朱</div>
      <p className="eyebrow">日本語 · estudio</p>
      <h1 className="serif ph-title">
        {name} <span className="ph-jp jp">{jp}</span>
      </h1>
      <p className="ph-sub">
        Fundación lista · tema actual:{' '}
        <b>{variant === 'a' ? 'Washi (claro)' : 'Yoru (oscuro)'}</b>
      </p>

      <nav className="ph-nav">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to}>
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
