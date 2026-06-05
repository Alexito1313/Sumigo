import { useSafeBack } from './useSafeBack'

/**
 * Cabecera mínima de los modos de estudio y vistas empujadas:
 * ← atrás · título + subtítulo · (progreso opcional a la derecha).
 * Sustituye al Topbar web dentro de las sesiones (sin tab bar, foco en la tarea).
 */
export function StudyHeader({
  title,
  subtitle,
  count,
  onBack,
}: {
  title: string
  subtitle?: string
  /** Progreso compacto opcional, p. ej. "07/20". */
  count?: string
  /** Acción de "atrás" (por defecto vuelve al menú principal). */
  onBack?: () => void
}) {
  const safeBack = useSafeBack()
  const back = onBack ?? safeBack
  return (
    <div className="study-header">
      <button className="sh-back" onClick={back} aria-label="Volver">
        ←
      </button>
      <div className="sh-titles">
        <div className="sh-title">{title}</div>
        {subtitle && <div className="sh-sub">{subtitle}</div>}
      </div>
      {count && <div className="sh-count">{count}</div>}
    </div>
  )
}
