import type { Card, Content } from './content'
import { shuffle } from './deck'

export interface ExamQuestion {
  jp: string
  type: 'Lectura' | 'Significado'
  sub: string
  prompt: string
  focus: string
  options: string[]
  correct: number
}

function pickDistractors(pool: Card[], current: Card, key: 'mean' | 'read', n: number): string[] {
  const seen = new Set<string>([current[key]])
  const out: string[] = []
  // preferimos distractores del mismo tipo (más plausibles)
  for (const c of shuffle(pool.filter((c) => c.type === current.type))) {
    if (seen.has(c[key])) continue
    seen.add(c[key])
    out.push(c[key])
    if (out.length >= n) break
  }
  if (out.length < n) {
    for (const c of shuffle(pool)) {
      if (seen.has(c[key])) continue
      seen.add(c[key])
      out.push(c[key])
      if (out.length >= n) break
    }
  }
  return out
}

/**
 * Genera un examen de n preguntas desde el contenido real:
 * - kanji: alterna Lectura (elige lectura) y Significado.
 * - vocab: Significado (su lectura suele ser kana evidente).
 * 4 opciones con distractores del mismo tipo gramatical.
 */
export function buildExam(content: Content, n = 10): ExamQuestion[] {
  const pool = content.all
  return shuffle(pool)
    .slice(0, n)
    .map((card, idx) => {
      const askReading = card.type === 'kanji' && idx % 2 === 0
      const key: 'read' | 'mean' = askReading ? 'read' : 'mean'
      const correctVal = card[key]
      const options = shuffle([correctVal, ...pickDistractors(pool, card, key, 3)])
      return {
        jp: card.jp,
        type: askReading ? 'Lectura' : 'Significado',
        sub: askReading ? '漢字読み' : '語彙',
        prompt: card.jp,
        focus: card.jp,
        options,
        correct: options.indexOf(correctVal),
      }
    })
}
