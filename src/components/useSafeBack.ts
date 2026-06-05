import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * "Atrás" seguro. react-router guarda el índice de la entrada de historial en
 * `window.history.state.idx`. Si es 0 significa que se entró DIRECTO a esta ruta
 * (deep-link, recarga o arranque de la PWA): no hay a dónde retroceder, así que
 * vamos al inicio en vez de dejar al usuario atrapado con un "Volver" inerte.
 */
export function useSafeBack(fallback = '/'): () => void {
  const navigate = useNavigate()
  return useCallback(() => {
    const st = window.history.state as { idx?: number } | null
    if (st && typeof st.idx === 'number' && st.idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
