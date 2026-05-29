import type { Card, Content } from './content'
import type { CardProgress } from './progress/types'

/** Selección de estudio que viaja desde Home a los modos (via router state). */
export interface Selection {
  content: 'kanji' | 'vocab' | 'both'
  blocks: string[]
  /** Tipo gramatical para filtrar el vocab (verbo, sustantivo…); ausente = todos. */
  type?: string
}

/** Baraja (Fisher-Yates) con semilla opcional para reproducibilidad. */
export function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr]
  let s = seed >>> 0
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Construye el mazo de estudio a partir de la selección (o todos los kanji por defecto). */
export function buildDeck(content: Content, selection?: Selection): Card[] {
  let pool: Card[]
  if (!selection) {
    pool = content.kanji
  } else {
    const want: Card[] = []
    if (selection.content !== 'vocab') want.push(...content.kanji)
    if (selection.content !== 'kanji') want.push(...content.vocab)
    pool = selection.blocks.length
      ? want.filter((c) => selection.blocks.includes(c.block))
      : want
    // Filtro por tipo gramatical (solo afecta al vocab; el kanji es type 'kanji').
    if (selection.type) pool = pool.filter((c) => c.type === selection.type)
  }
  return shuffle(pool)
}

/**
 * Mazo de repaso: kanji peor llevados primero (más fallos, desempate por
 * próximo repaso SRS). Si aún no hay datos de progreso, cae a los primeros n.
 */
export function reviewDeck(
  content: Content,
  progress: Record<string, CardProgress>,
  n = 12,
): Card[] {
  const failed = content.kanji
    .map((c) => ({ c, p: progress[c.jp] }))
    .filter((x) => x.p && x.p.wrong > 0)
    .sort((a, b) => b.p!.wrong - a.p!.wrong || a.p!.due - b.p!.due)
    .map((x) => x.c)
  return failed.length ? failed.slice(0, n) : content.kanji.slice(0, n)
}

/** Mazo de escritura: solo kanji de 1 carácter (KanjiVG), filtrado por la selección. */
export function writeDeck(content: Content, selection?: Selection): Card[] {
  let pool = content.writable
  if (selection && selection.content !== 'vocab' && selection.blocks.length) {
    pool = pool.filter((c) => selection.blocks.includes(c.block))
  }
  return shuffle(pool)
}
