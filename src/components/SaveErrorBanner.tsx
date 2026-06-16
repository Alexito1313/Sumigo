import { useEffect, useState } from 'react'
import { useProgress } from '../data/progress/ProgressContext'

/* ============================================================
   SaveErrorBanner — aviso global de guardado fallido.
   Si localStorage falla (cuota llena o Safari en modo privado), el progreso de
   la sesión NO se está persistiendo. Antes se tragaba en silencio y el usuario
   perdía la sesión al recargar sin saberlo. useProgress re-renderiza en cada
   commit (el snapshot cambia), así reflejamos el estado sin un store aparte.
   ============================================================ */

export function SaveErrorBanner() {
  const { repo } = useProgress()
  const [dismissed, setDismissed] = useState(false)
  const hasError = repo.hasSaveError()
  // Al despejarse el error (un guardado posterior funciona), se rearma el aviso:
  // si vuelve a fallar, el banner reaparece (antes, descartarlo lo silenciaba
  // para siempre aunque el guardado volviera a fallar).
  useEffect(() => {
    if (!hasError) setDismissed(false)
  }, [hasError])
  if (!hasError || dismissed) return null
  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 'calc(9px + env(safe-area-inset-top, 0px)) 14px 9px',
        background: '#7a1320',
        color: '#fff',
        fontFamily: 'var(--sans)',
        fontSize: 12.5,
        lineHeight: 1.4,
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, flex: 'none' }}>
        ⚠
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        No se pudo guardar tu progreso (almacenamiento lleno o navegación privada). Lo que estudies
        ahora podría perderse al recargar.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar aviso"
        style={{
          flex: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'rgba(255,255,255,0.18)',
          border: 'none',
          color: '#fff',
          borderRadius: 8,
          width: 26,
          height: 26,
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        ✕
      </button>
    </div>
  )
}
