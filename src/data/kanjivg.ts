/* ============================================================
   KanjiVG — carga de trazos + utilidades de reconocimiento (orden japonés).
   Port del motor del handoff (write-prototype.jsx).

   Los SVG se sirven de public/kanjivg/{cp}.svg (empaquetados → offline) con
   fallback al CDN de KanjiVG si algún kanji no estuviera empaquetado.
   ============================================================ */

export type Pt = [number, number]

export interface KvgData {
  cp: string
  paths: string[] // atributos `d` de cada trazo, en orden
}

const KVG_CACHE: Record<string, KvgData> = {}
let measSvg: SVGSVGElement | null = null

/** Muestrea n puntos equiespaciados a lo largo de un path SVG (espacio 109×109). */
export function measurePath(d: string, n: number): Pt[] {
  const ns = 'http://www.w3.org/2000/svg'
  if (!measSvg) {
    measSvg = document.createElementNS(ns, 'svg')
    measSvg.setAttribute('viewBox', '0 0 109 109')
    measSvg.style.cssText =
      'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none'
    document.body.appendChild(measSvg)
  }
  const p = document.createElementNS(ns, 'path')
  p.setAttribute('d', d)
  measSvg.appendChild(p)
  let len = 0
  try {
    len = p.getTotalLength()
  } catch {
    len = 0
  }
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    try {
      const pt = p.getPointAtLength(len * (n === 1 ? 0 : i / (n - 1)))
      pts.push([pt.x, pt.y])
    } catch {
      pts.push([0, 0])
    }
  }
  measSvg.removeChild(p)
  return pts
}

/** Longitud total de un path (unidades 109), para animar la pista sin depender de pathLength. */
export function pathTotalLength(d: string): number {
  const ns = 'http://www.w3.org/2000/svg'
  if (!measSvg) {
    measSvg = document.createElementNS(ns, 'svg')
    measSvg.setAttribute('viewBox', '0 0 109 109')
    measSvg.style.cssText =
      'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none'
    document.body.appendChild(measSvg)
  }
  const p = document.createElementNS(ns, 'path')
  p.setAttribute('d', d)
  measSvg.appendChild(p)
  let len = 0
  try {
    len = p.getTotalLength()
  } catch {
    len = 0
  }
  measSvg.removeChild(p)
  return len
}

export function polylen(pts: Pt[]): number {
  let t = 0
  for (let i = 1; i < pts.length; i++) {
    t += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  }
  return t
}

/** Re-muestrea una polilínea a n puntos equiespaciados por longitud de arco. */
export function resample(pts: Pt[], n: number): Pt[] {
  if (!pts || pts.length === 0) return []
  if (pts.length === 1) return Array.from({ length: n }, () => pts[0].slice() as Pt)
  const cum = [0]
  let tot = 0
  for (let i = 1; i < pts.length; i++) {
    tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    cum.push(tot)
  }
  if (tot === 0) return Array.from({ length: n }, () => pts[0].slice() as Pt)
  const out: Pt[] = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const target = (tot * i) / (n - 1)
    while (j < cum.length - 2 && cum[j + 1] < target) j++
    const seg = cum[j + 1] - cum[j] || 1
    const t = (target - cum[j]) / seg
    out.push([
      pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
      pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t,
    ])
  }
  return out
}

/** ¿El trazo del usuario coincide con el esperado? (forma, dirección e inicio) */
export function matchStroke(userPts: Pt[], expPts: Pt[]): boolean {
  const N = 16
  const es = resample(expPts, N)
  const us = resample(userPts, N)
  const elen = polylen(es)
  const ulen = polylen(us)
  // trazo corto / punto: basta con que el centro esté cerca
  if (elen < 11) {
    const um = us[Math.floor(N / 2)]
    const em = es[Math.floor(N / 2)]
    return Math.hypot(um[0] - em[0], um[1] - em[1]) < 19
  }
  if (ulen < 6) return false
  const uv = [us[N - 1][0] - us[0][0], us[N - 1][1] - us[0][1]]
  const ev = [es[N - 1][0] - es[0][0], es[N - 1][1] - es[0][1]]
  const ul = Math.hypot(uv[0], uv[1]) || 1
  const el = Math.hypot(ev[0], ev[1]) || 1
  const cos = (uv[0] * ev[0] + uv[1] * ev[1]) / (ul * el)
  if (cos < 0.1) return false // dirección equivocada (orden inverso)
  let d = 0
  for (let i = 0; i < N; i++) d += Math.hypot(us[i][0] - es[i][0], us[i][1] - es[i][1])
  d /= N
  const startD = Math.hypot(us[0][0] - es[0][0], us[0][1] - es[0][1])
  return d < 21 && startD < 32
}

export function kvgCodepoint(ch: string): string {
  return (ch.codePointAt(0) ?? 0).toString(16).padStart(5, '0')
}

async function fetchSvgText(cp: string): Promise<string> {
  // 1) local (empaquetado, offline)
  try {
    const r = await fetch(import.meta.env.BASE_URL + 'kanjivg/' + cp + '.svg')
    if (r.ok) return await r.text()
  } catch {
    /* sin copia local */
  }
  // 2) CDN de KanjiVG
  const r = await fetch('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/' + cp + '.svg')
  if (!r.ok) throw new Error('kvg not found: ' + cp)
  return r.text()
}

/** Carga (y cachea) los trazos de un kanji de 1 carácter. */
export async function loadKvg(ch: string): Promise<KvgData> {
  const cp = kvgCodepoint(ch)
  if (KVG_CACHE[cp]) return KVG_CACHE[cp]
  const txt = await fetchSvgText(cp)
  const doc = new DOMParser().parseFromString(txt, 'image/svg+xml')
  const group = doc.querySelector('[id^="kvg:StrokePaths"]') ?? doc
  const paths = [...group.querySelectorAll('path')]
    .map((p) => p.getAttribute('d'))
    .filter((d): d is string => Boolean(d))
  if (!paths.length) throw new Error('kvg no strokes: ' + cp)
  const data: KvgData = { cp, paths }
  KVG_CACHE[cp] = data
  return data
}
