/* ============================================================
   Cargador de contenido real (JSON de public/data) → mazos normalizados.
   Port de content.js del handoff, con tipos.

   NOTA: en la Fase 3 esta carga se esconderá tras una interfaz de repositorio
   para poder cambiar a un backend (B2B) sin tocar las pantallas.
   ============================================================ */

export const KANJI_BLOCKS = [
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10',
] as const
export const VOCAB_BLOCKS = [
  'L26', 'L27', 'L28', 'L29', 'L30', 'L31', 'L32', 'L33', 'L34', 'L35', 'L36',
] as const

/** Carta normalizada que consumen todas las pantallas y modos. */
export interface Card {
  jp: string
  read: string
  mean: string
  /** Bloque de origen: D1..D10 (kanji) o L26..L36 (vocab). */
  block: string
  /** 'kanji' o el tipo gramatical (verbo, sustantivo, adjetivo-i, …). */
  type: string
  /** Etiqueta de categoría legible: "J3 · kanji" o "N4 · L26". */
  cat: string
  /** Ejemplos/extras ya partidos en líneas (kanji); vacío en vocab. */
  extras: string[]
}

export interface Content {
  kanji: Card[]
  vocab: Card[]
  all: Card[]
  /** Solo kanji de un único carácter: los válidos para el modo escritura (KanjiVG). */
  writable: Card[]
}

interface RawItem {
  jp: string
  read: string
  mean: string
  type?: string
  extra?: string
}

/** Base URL fijada por Vite ('/' en dev, '/JapoWeb/' en prod). Acaba en '/'. */
function dataUrl(path: string): string {
  return import.meta.env.BASE_URL + path
}

async function fetchBlock(path: string): Promise<RawItem[]> {
  const res = await fetch(dataUrl(path))
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return res.json() as Promise<RawItem[]>
}

function normKanji(it: RawItem, block: string): Card {
  return {
    jp: it.jp,
    read: it.read,
    mean: it.mean,
    block,
    type: 'kanji',
    cat: 'J3 · kanji',
    extras: it.extra
      ? it.extra.split('·').map((s) => s.trim()).filter(Boolean)
      : [],
  }
}

function normVocab(it: RawItem, block: string): Card {
  return {
    jp: it.jp,
    read: it.read,
    mean: it.mean,
    block,
    type: it.type || 'vocab',
    cat: 'N4 · ' + block,
    extras: [],
  }
}

let cache: Content | null = null

export async function loadContent(): Promise<Content> {
  if (cache) return cache

  // Promise.all preserva el orden del array → mantiene el orden de bloques y
  // el orden dentro de cada bloque (a diferencia de un push en carrera).
  const [kanjiArrs, vocabArrs] = await Promise.all([
    Promise.all(
      KANJI_BLOCKS.map(async (b) => {
        try {
          return (await fetchBlock(`data/kanji/${b}.json`)).map((it) =>
            normKanji(it, b),
          )
        } catch {
          return [] as Card[] // bloque ausente: se ignora
        }
      }),
    ),
    Promise.all(
      VOCAB_BLOCKS.map(async (b) => {
        try {
          return (await fetchBlock(`data/vocab/${b}.json`)).map((it) =>
            normVocab(it, b),
          )
        } catch {
          return [] as Card[]
        }
      }),
    ),
  ])

  const kanji = kanjiArrs.flat()
  const vocab = vocabArrs.flat()
  // Si NO se cargó NADA (p. ej. red caída en la primera visita), no cachear y
  // fallar: así useContent expone el error y la UI ofrece "Reintentar". Antes se
  // cacheaba el contenido vacío en silencio y la app quedaba vacía sin salida.
  if (kanji.length === 0 && vocab.length === 0) {
    throw new Error('No se pudo cargar el contenido')
  }
  const writable = kanji.filter((k) => [...k.jp].length === 1)

  cache = { kanji, vocab, all: kanji.concat(vocab), writable }
  return cache
}

/** Nº de cartas por bloque. */
export function countByBlock(cards: Card[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const c of cards) m[c.block] = (m[c.block] ?? 0) + 1
  return m
}

/** Índice estable "del día" (día del año % longitud) para el kanji del día. */
export function dailyIndex(len: number, date = new Date()): number {
  if (!len) return 0
  const start = new Date(date.getFullYear(), 0, 0)
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000)
  return day % len
}
