import { useState } from 'react'
import { useProgress } from '../data/progress/ProgressContext'

/** Niveles/cursos. Solo J3 desbloqueado por ahora (el resto, próximamente). */
const LEVELS = [
  { id: 'J1', sub: '1.er año · principiante', locked: true },
  { id: 'J2', sub: '2.º año', locked: true },
  { id: 'J3', sub: '3.er año', locked: false },
  { id: 'J4', sub: '4.º año', locked: true },
  { id: 'J5', sub: '5.º año', locked: true },
  { id: 'J6', sub: '6.º año', locked: true },
  { id: 'J7', sub: '7.º año', locked: true },
]

/**
 * Chip de nivel (contexto del usuario, arriba-izq de la home) + bottom-sheet para
 * cambiarlo. El nivel persiste en settings (ProgressRepository). Cuando haya más
 * de un nivel, el progreso se guardará por separado en cada uno (hoy solo J3).
 */
export function LevelChip() {
  const { snapshot, repo } = useProgress()
  const level = snapshot.settings.level ?? 'J3'
  const [open, setOpen] = useState(false)

  const current = LEVELS.find((l) => l.id === level) ?? LEVELS[2]
  const others = LEVELS.filter((l) => l.id !== current.id)

  const pick = (id: string, locked: boolean) => {
    if (!locked) repo.setSettings({ level: id })
    setOpen(false)
  }

  return (
    <>
      <button className="levelchip" onClick={() => setOpen(true)} aria-label="Cambiar de nivel">
        <span className="lc-mark">朱</span>
        <span className="lc-id">{current.id}</span>
        <span className="lc-caret">▾</span>
      </button>

      {open && (
        <div className="lvl-sheet-root" role="dialog" aria-modal="true">
          <div className="lvl-scrim" onClick={() => setOpen(false)} />
          <div className="lvl-sheet">
            <div className="lvl-handle" />
            <div className="lvl-sheet-head">
              <h3>
                Cambiar de nivel <span className="lvl-jp">級を選ぶ</span>
              </h3>
              <p>El progreso se guarda por separado en cada nivel.</p>
            </div>

            <div className="lvl-group">Tu curso</div>
            <button className="lvl-row current" onClick={() => setOpen(false)}>
              <span className="lvl-badge">{current.id}</span>
              <span className="lvl-row-text">
                <span className="lvl-row-id">
                  {current.id} · <b>actual</b>
                </span>
                <span className="lvl-row-sub">{current.sub} · tu curso</span>
              </span>
              <span className="lvl-check">✓</span>
            </button>

            <div className="lvl-group">Explorar otros cursos</div>
            {others.map((l) => (
              <button
                key={l.id}
                className={'lvl-row' + (l.locked ? ' locked' : '')}
                onClick={() => pick(l.id, l.locked)}
                disabled={l.locked}
              >
                <span className="lvl-badge">{l.id}</span>
                <span className="lvl-row-text">
                  <span className="lvl-row-id">{l.id}</span>
                  <span className="lvl-row-sub">{l.sub}</span>
                </span>
                <span className="lvl-arrow">↗</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
