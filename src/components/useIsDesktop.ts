import { useSyncExternalStore } from 'react'

/* ============================================================
   useIsDesktop — true cuando la ventana es ≥960px (mismo breakpoint
   que el CSS de escritorio). Reactivo: el layout del Home cambia en
   vivo al cruzar el umbral (redimensionar la ventana). En móvil se
   queda en false → se renderiza el layout móvil de siempre.
   ============================================================ */

const QUERY = '(min-width: 960px)'

function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function getSnapshot(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches
}

export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
