import { KANJI_BLOCKS, type Card, type Content } from './content'
import type { ProgressSnapshot } from './progress/types'
import { DAY_MS, dayKey } from './progress/srs'

export const TYPE_LABELS: Record<string, { label: string; jp: string }> = {
  kanji: { label: 'Kanji', jp: '漢字' },
  verbo: { label: 'Verbos', jp: '動詞' },
  sustantivo: { label: 'Sustantivos', jp: '名詞' },
  'adjetivo-i': { label: 'Adj. い', jp: 'い形' },
  'adjetivo-na': { label: 'Adj. な', jp: 'な形' },
  adverbio: { label: 'Adverbios', jp: '副詞' },
  expresion: { label: 'Expresiones', jp: '表現' },
  vocab: { label: 'Vocabulario', jp: '語彙' },
}

export interface StatsData {
  cardsSeen: number
  accuracy: number
  totalAnswers: number
  /** 35 celdas, intensidad 0-3 (5 semanas) */
  heat: number[]
  activeDays35: number
  topFailed: { card: Card; wrong: number; right: number }[]
  blocks: { id: string; done: number; total: number; pct: number }[]
  types: { type: string; label: string; jp: string; count: number; pct: number }[]
}

export function computeStats(content: Content, snap: ProgressSnapshot): StatsData {
  const cards = snap.cards
  const byJp: Record<string, Card> = {}
  content.all.forEach((c) => {
    byJp[c.jp] = c
  })
  const studied = Object.values(cards)

  const cardsSeen = studied.length
  const totalRight = studied.reduce((s, c) => s + c.right, 0)
  const totalWrong = studied.reduce((s, c) => s + c.wrong, 0)
  const totalAnswers = totalRight + totalWrong
  const accuracy = totalAnswers ? Math.round((totalRight / totalAnswers) * 100) : 0

  const heat: number[] = []
  for (let i = 34; i >= 0; i--) {
    const n = snap.streak.days[dayKey(Date.now() - i * DAY_MS)] ?? 0
    heat.push(n === 0 ? 0 : n < 5 ? 1 : n < 12 ? 2 : 3)
  }
  const activeDays35 = heat.filter((v) => v > 0).length

  const topFailed = studied
    .filter((c) => c.wrong > 0 && byJp[c.jp])
    .sort((a, b) => b.wrong - a.wrong || b.wrong - b.right - (a.wrong - a.right))
    .slice(0, 10)
    .map((c) => ({ card: byJp[c.jp], wrong: c.wrong, right: c.right }))

  const blocks = KANJI_BLOCKS.map((b) => {
    const blockCards = content.kanji.filter((c) => c.block === b)
    const total = blockCards.length
    const done = blockCards.filter((c) => (cards[c.jp]?.views ?? 0) > 0).length
    const r = blockCards.reduce((s, c) => s + (cards[c.jp]?.right ?? 0), 0)
    const w = blockCards.reduce((s, c) => s + (cards[c.jp]?.wrong ?? 0), 0)
    const pct = r + w ? Math.round((r / (r + w)) * 100) : 0
    return { id: b, done, total, pct }
  })

  const typeAgg: Record<string, { count: number; right: number; wrong: number }> = {}
  studied.forEach((p) => {
    const c = byJp[p.jp]
    if (!c) return
    if (!typeAgg[c.type]) typeAgg[c.type] = { count: 0, right: 0, wrong: 0 }
    typeAgg[c.type].count++
    typeAgg[c.type].right += p.right
    typeAgg[c.type].wrong += p.wrong
  })
  const types = Object.entries(typeAgg)
    .map(([type, v]) => ({
      type,
      label: TYPE_LABELS[type]?.label ?? type,
      jp: TYPE_LABELS[type]?.jp ?? '',
      count: v.count,
      pct: v.right + v.wrong ? Math.round((v.right / (v.right + v.wrong)) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return { cardsSeen, accuracy, totalAnswers, heat, activeDays35, topFailed, blocks, types }
}
