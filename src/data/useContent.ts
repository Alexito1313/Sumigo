import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadContent, type Content } from './content'
import { customToCard, useCustom } from './custom/customStore'

/**
 * Carga el contenido base (cacheado en content.ts) y le FUSIONA el contenido
 * propio del usuario ("Míos", block 'MIOS'). Así el detalle y los mazos tratan
 * las entradas propias como una fuente más, sin tocar las pantallas.
 * Reactivo a los cambios en el contenido propio.
 */
export function useContent() {
  const [base, setBase] = useState<Content | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)
  const { entries } = useCustom()

  useEffect(() => {
    let alive = true
    setError(null)
    loadContent()
      .then((c) => alive && setBase(c))
      .catch((e) => alive && setError(e instanceof Error ? e : new Error(String(e))))
    return () => {
      alive = false
    }
  }, [attempt])

  /** Reintenta la carga (loadContent no cachea los fallos totales → re-fetch). */
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  const content = useMemo<Content | null>(() => {
    if (!base) return null
    if (!entries.length) return base
    const cKanji = entries.filter((e) => e.kind === 'kanji').map(customToCard)
    const cVocab = entries.filter((e) => e.kind === 'vocab').map(customToCard)
    if (!cKanji.length && !cVocab.length) return base
    const kanji = [...base.kanji, ...cKanji]
    const vocab = [...base.vocab, ...cVocab]
    return {
      kanji,
      vocab,
      all: [...kanji, ...vocab],
      writable: kanji.filter((k) => [...k.jp].length === 1),
    }
  }, [base, entries])

  return { content, error, loading: !content && !error, retry }
}
