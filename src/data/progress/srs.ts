import type { CardProgress, StreakState } from './types'

export const DAY_MS = 86_400_000

/** Clave de día local 'YYYY-MM-DD' a partir de un timestamp. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** Clave del día ANTERIOR con aritmética de calendario (no de milisegundos):
 *  restar 24h fijas falla 1 hora al año en cada cambio horario (días de 23/25h). */
export function yesterdayKey(now: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  return dayKey(d.getTime())
}

/** Racha VIGENTE para mostrar: 0 si el último día estudiado no es hoy ni ayer.
 *  streak.current solo se recalcula al responder una carta, así que tras faltar
 *  días la UI seguía enseñando la racha vieja (y saltaba a 1 al responder).
 *  streak.longest sí puede leerse cruda. */
export function currentStreak(s: StreakState, now = Date.now()): number {
  return s.lastStudyDay === dayKey(now) || s.lastStudyDay === yesterdayKey(now)
    ? s.current
    : 0
}

/**
 * SM-2 simplificado. Devuelve los campos SRS actualizados según el acierto.
 * - Acierto: sube reps e intervalo (1d → 3d → interval*ease) y la facilidad.
 * - Fallo: reinicia reps/intervalo (repasar pronto) y baja la facilidad.
 */
export function nextSRS(
  prev: CardProgress | undefined,
  correct: boolean,
  now: number,
): Pick<CardProgress, 'reps' | 'intervalDays' | 'ease' | 'due'> {
  let ease = prev?.ease ?? 2.5
  let reps = prev?.reps ?? 0
  let interval = prev?.intervalDays ?? 0

  if (correct) {
    reps += 1
    if (reps === 1) interval = 1
    else if (reps === 2) interval = 3
    else interval = Math.max(1, Math.round(interval * ease))
    ease = Math.min(3, ease + 0.1)
  } else {
    reps = 0
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
  }

  return { reps, intervalDays: interval, ease, due: now + interval * DAY_MS }
}
