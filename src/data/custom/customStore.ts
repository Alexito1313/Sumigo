/* ============================================================
   Contenido propio del usuario ("Míos"). Store reactivo sobre localStorage,
   mismo espíritu que ProgressRepository (intercambiable por backend en el futuro).
   Las entradas se convierten a Card (block 'MIOS') para entrar a los mazos y al
   detalle como una fuente más.
   ============================================================ */
import { useSyncExternalStore } from 'react'
import type { Card } from '../content'

export interface CustomEntry {
  id: string
  jp: string
  read: string
  mean: string
  kind: 'kanji' | 'vocab'
  /** tipo gramatical (vocab: verbo/sustantivo/…) o 'kanji'. */
  type: string
  /** ejemplos propios (kanji), una línea por ejemplo. */
  extras: string[]
  createdAt: number
}

const KEY = 'japoweb.custom'

/** Normaliza una entrada leída/importada; null si no es recuperable. Antes el
 *  cast ciego `arr as CustomEntry[]` dejaba pasar null/{} y un solo elemento
 *  corrupto reventaba MiosTab y los mazos. */
function sanitizeEntry(v: unknown): CustomEntry | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const e = v as Record<string, unknown>
  if (typeof e.jp !== 'string' || !e.jp.trim()) return null
  if (typeof e.mean !== 'string') return null
  return {
    id: typeof e.id === 'string' && e.id ? e.id : genId(),
    jp: e.jp,
    read: typeof e.read === 'string' ? e.read : '',
    mean: e.mean,
    kind: e.kind === 'kanji' ? 'kanji' : 'vocab',
    type: typeof e.type === 'string' ? e.type : '',
    extras: Array.isArray(e.extras)
      ? (e.extras as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
    createdAt:
      typeof e.createdAt === 'number' && Number.isFinite(e.createdAt) ? e.createdAt : 0,
  }
}

function sanitizeEntries(raw: unknown): CustomEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map(sanitizeEntry).filter((x): x is CustomEntry => x !== null)
}

function readStore(): CustomEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return sanitizeEntries(JSON.parse(raw))
  } catch {
    return []
  }
}

let snapshot: CustomEntry[] = readStore()
const listeners = new Set<() => void>()

// Sincronización entre pestañas: 'storage' solo dispara en las OTRAS pestañas;
// sin esto, dos pestañas abiertas se machacaban las entradas entre sí.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === null) {
      snapshot = readStore()
      listeners.forEach((l) => l())
    }
  })
}

function commit(next: CustomEntry[]) {
  snapshot = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* almacenamiento no disponible: el estado en memoria sigue válido */
  }
  listeners.forEach((l) => l())
}

function genId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {
    /* sin crypto */
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const customStore = {
  getSnapshot: (): CustomEntry[] => snapshot,
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
  add: (e: Omit<CustomEntry, 'id' | 'createdAt'>): void => {
    commit([{ ...e, id: genId(), createdAt: Date.now() }, ...snapshot])
  },
  remove: (id: string): void => {
    commit(snapshot.filter((x) => x.id !== id))
  },
  /** Reemplaza todas las entradas (restauración de copia de seguridad). */
  replaceAll: (entries: unknown): void => {
    commit(sanitizeEntries(entries))
  },
}

/** Acceso reactivo a las entradas propias. */
export function useCustom(): { entries: CustomEntry[] } {
  const entries = useSyncExternalStore(customStore.subscribe, customStore.getSnapshot)
  return { entries }
}

/** ¿El carácter es un kanji (ideograma CJK)? Excluye emojis/letras latinas, que
 *  no tienen trazos en KanjiVG y no deben pasar como "escribibles". */
export function isKanjiChar(c: string): boolean {
  return /^[㐀-䶿一-鿿々〆〇]$/u.test(c)
}

/** ¿Esta entrada puede practicarse en el modo escritura? (kanji de 1 carácter) */
export function canWrite(e: { jp: string; kind: 'kanji' | 'vocab' }): boolean {
  const chars = [...e.jp.trim()]
  return e.kind === 'kanji' && chars.length === 1 && isKanjiChar(chars[0])
}

/** Convierte una entrada propia en Card (block 'MIOS') para mazos / detalle. */
export function customToCard(e: CustomEntry): Card {
  return {
    jp: e.jp,
    read: e.read,
    mean: e.mean,
    block: 'MIOS',
    type: e.kind === 'kanji' ? 'kanji' : e.type || 'vocab',
    cat: 'Míos · 自分',
    extras: e.extras ?? [],
  }
}
