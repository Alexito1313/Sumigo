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

/** Base URL fijada por Vite ('/' en dev, '/Sumigo/' en prod). Acaba en '/'. */
function dataUrl(path: string): string {
  return import.meta.env.BASE_URL + path
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

  // Un bloque que falla por RED (fetch lanza / 5xx) marca la carga como parcial:
  // se devuelve lo que haya pero NO se cachea, para que un reintento posterior la
  // complete. Un 404 (bloque genuinamente ausente) NO cuenta como fallo. Antes
  // cualquier fallo parcial se cacheaba para siempre y faltaban bloques sin salida.
  let partial = false
  const loadBlock = async (path: string, norm: (it: RawItem, b: string) => Card, b: string) => {
    let res: Response
    try {
      res = await fetch(dataUrl(path))
    } catch {
      partial = true // fallo de RED real → reintentable (no cachear)
      return [] as Card[]
    }
    if (res.status === 404) return [] as Card[] // ausente definitivo
    if (!res.ok) {
      partial = true // 5xx u otro → transitorio
      return [] as Card[]
    }
    try {
      // Descarta items malformados: jp no vacío y read/mean string (se toleran
      // vacíos, pero no undefined/no-string), para que el contrato Card se
      // cumpla y no se cuelen cartas con campos undefined.
      return ((await res.json()) as RawItem[])
        .filter(
          (it) =>
            it &&
            typeof it.jp === 'string' &&
            it.jp.trim() &&
            typeof it.read === 'string' &&
            typeof it.mean === 'string',
        )
        .map((it) => norm(it, b))
    } catch {
      // 200 con cuerpo no-JSON (p.ej. index.html del fallback SPA del dev server
      // o de algún host): el bloque está ausente, NO es un fallo de red.
      return [] as Card[]
    }
  }

  // Promise.all preserva el orden del array → mantiene el orden de bloques y
  // el orden dentro de cada bloque (a diferencia de un push en carrera).
  const [kanjiArrs, vocabArrs] = await Promise.all([
    Promise.all(KANJI_BLOCKS.map((b) => loadBlock(`data/kanji/${b}.json`, normKanji, b))),
    Promise.all(VOCAB_BLOCKS.map((b) => loadBlock(`data/vocab/${b}.json`, normVocab, b))),
  ])

  const kanji = kanjiArrs.flat()
  const vocab = vocabArrs.flat()
  // Si NO se cargó NADA (p. ej. red caída en la primera visita), fallar: así
  // useContent expone el error y la UI ofrece "Reintentar". Antes se cacheaba
  // el contenido vacío en silencio y la app quedaba vacía sin salida.
  if (kanji.length === 0 && vocab.length === 0) {
    throw new Error('No se pudo cargar el contenido')
  }
  const writable = kanji.filter((k) => [...k.jp].length === 1)

  const content: Content = { kanji, vocab, all: kanji.concat(vocab), writable }
  if (!partial) cache = content // solo se cachea una carga COMPLETA
  return content
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
