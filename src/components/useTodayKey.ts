import { useSyncExternalStore } from 'react'
import { dayKey } from '../data/progress/srs'

/* ============================================================
   La racha vigente depende de "hoy", pero nada re-renderiza al cruzar la
   medianoche con la app en memoria (la PWA instalada / el WebView de Capacitor
   sobreviven días en segundo plano): se reabría la app y la racha seguía
   pintada con el valor de hace días hasta tocar algo. Este hook re-evalúa la
   clave del día cuando el documento vuelve a ser visible; si cambió, React
   re-renderiza las pantallas que lo usan y la racha se corrige sola.
   ============================================================ */

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

export function useTodayKey(): string {
  return useSyncExternalStore(subscribe, () => dayKey(Date.now()))
}
