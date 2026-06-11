import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useContent } from './useContent'
import { buildDeck, reviewDeck, writeDeck, type Selection } from './deck'
import type { Card } from './content'
import { useProgressRepo } from './progress/ProgressContext'

/**
 * Obtiene el mazo para un modo, usando la selección que llega por router state.
 *
 * El mazo se baraja UNA vez (con Date.now) y se guarda en estado, para que NO
 * se vuelva a barajar en cada re-render (al voltear, responder, etc.). Se
 * reconstruye solo si cambian el contenido, el modo o la selección.
 */
export function useDeck(mode: 'study' | 'review' | 'write' = 'study'): {
  deck: Card[]
  loading: boolean
  error: Error | null
  retry: () => void
} {
  const { content, loading, error, retry } = useContent()
  const location = useLocation()
  const selection = (location.state as { selection?: Selection } | null)?.selection
  const selKey = JSON.stringify(selection ?? null)
  const repo = useProgressRepo()

  const [deck, setDeck] = useState<Card[]>([])
  // El mazo se construye en un efecto (post-commit): sin este flag, el primer
  // frame llegaba con loading=false y deck=[] y el "No hay cartas" (ModeEmpty)
  // parpadeaba un instante en CADA entrada a un modo.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!content) return
    // El progreso se lee imperativamente (getSnapshot) para congelar el mazo al
    // inicio de la sesión y no re-barajar al registrar respuestas.
    setDeck(
      mode === 'review'
        ? reviewDeck(content, repo.getSnapshot().cards)
        : mode === 'write'
          ? writeDeck(content, selection)
          : buildDeck(content, selection),
    )
    setReady(true)
    // selection se serializa en selKey para comparar por valor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, mode, selKey, repo])

  // Con error de carga, ready nunca llegará: el error se propaga (las pantallas
  // muestran reintento) en vez de dejar un spinner infinito sin salida.
  return { deck, loading: loading || (!ready && !error), error, retry }
}
