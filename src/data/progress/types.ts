/* ============================================================
   Modelo y CONTRATO de la capa de progreso.

   Las pantallas dependen SOLO de la interfaz `ProgressRepository`, no de
   localStorage. Para pasar a un backend (B2B multi-usuario) basta con
   escribir otra implementación de esta interfaz y cambiarla en el Provider.
   ============================================================ */

/** Progreso acumulado de una carta (kanji/palabra), identificada por `jp`. */
export interface CardProgress {
  jp: string
  views: number
  right: number
  wrong: number
  lastSeen: number
  /* SRS (SM-2 simplificado) */
  reps: number
  intervalDays: number
  ease: number
  /** timestamp del próximo repaso recomendado */
  due: number
}

export interface StreakState {
  current: number
  longest: number
  /** último día estudiado, 'YYYY-MM-DD' */
  lastStudyDay: string
  /** mapa día 'YYYY-MM-DD' → nº de respuestas ese día (para heatmap/calendario) */
  days: Record<string, number>
}

export interface Settings {
  cardsPerSession: number
  /** Nivel/curso activo (contexto del usuario): 'J3'… Persiste entre sesiones. */
  level: string
  /** Última sesión de estudio iniciada (para la tarjeta "Continuar"). */
  lastSession?: {
    path: string
    content: 'kanji' | 'vocab' | 'both'
    blocks: string[]
    types?: string[]
  }
}

export interface ProgressSnapshot {
  version: number
  cards: Record<string, CardProgress>
  streak: StreakState
  settings: Settings
}

/** Contrato de persistencia. Implementaciones: localStorage (v1), backend (futuro). */
export interface ProgressRepository {
  /** Estado actual (referencia estable hasta la próxima mutación). */
  getSnapshot(): ProgressSnapshot
  /** Suscripción para reactividad (useSyncExternalStore). Devuelve unsubscribe. */
  subscribe(listener: () => void): () => void
  /** Registra una respuesta: actualiza la carta (SRS), la racha y el calendario. */
  recordAnswer(jp: string, correct: boolean): void
  /** Registra varias respuestas con UN solo guardado (p.ej. al entregar el
   *  simulacro): evita N escrituras síncronas de todo el snapshot. */
  recordAnswers(answers: { jp: string; correct: boolean }[]): void
  setSettings(patch: Partial<Settings>): void
  exportJSON(): string
  importJSON(json: string): boolean
  reset(): void
  /** true si el último intento de guardar en localStorage falló (cuota / privado). */
  hasSaveError(): boolean
}
