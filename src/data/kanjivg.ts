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
const SVG_NS = 'http://www.w3.org/2000/svg'
let measSvg: SVGSVGElement | null = null

/** SVG oculto fuera de pantalla reutilizado para medir paths (getTotalLength). */
function ensureMeasSvg(): SVGSVGElement {
  if (!measSvg) {
    measSvg = document.createElementNS(SVG_NS, 'svg')
    measSvg.setAttribute('viewBox', '0 0 109 109')
    measSvg.style.cssText =
      'position:absolute;left:-9999px;top:0;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none'
    document.body.appendChild(measSvg)
  }
  return measSvg
}

/** Muestrea n puntos equiespaciados a lo largo de un path SVG (espacio 109×109). */
export function measurePath(d: string, n: number): Pt[] {
  const svg = ensureMeasSvg()
  const p = document.createElementNS(SVG_NS, 'path')
  p.setAttribute('d', d)
  svg.appendChild(p)
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
  svg.removeChild(p)
  return pts
}

/** Longitud total de un path (unidades 109), para animar la pista sin depender de pathLength. */
export function pathTotalLength(d: string): number {
  const svg = ensureMeasSvg()
  const p = document.createElementNS(SVG_NS, 'path')
  p.setAttribute('d', d)
  svg.appendChild(p)
  let len = 0
  try {
    len = p.getTotalLength()
  } catch {
    len = 0
  }
  svg.removeChild(p)
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
  // trazo corto / punto: el centro debe quedar cerca y no ser un trazo largo
  if (elen < 11) {
    if (ulen > 26) return false // un barrido largo no vale como punto
    const um = us[Math.floor(N / 2)]
    const em = es[Math.floor(N / 2)]
    return Math.hypot(um[0] - em[0], um[1] - em[1]) < 13
  }
  if (ulen < 8) return false
  // longitud comparable: ni un toque ni un barrido gigante
  if (ulen < elen * 0.5 || ulen > elen * 2.0) return false
  const uv = [us[N - 1][0] - us[0][0], us[N - 1][1] - us[0][1]]
  const ev = [es[N - 1][0] - es[0][0], es[N - 1][1] - es[0][1]]
  const ul = Math.hypot(uv[0], uv[1]) || 1
  const el = Math.hypot(ev[0], ev[1]) || 1
  const cos = (uv[0] * ev[0] + uv[1] * ev[1]) / (ul * el)
  if (cos < 0.5) return false // dirección global dentro de ~60°
  // distancia media + inicio + fin deben quedar cerca del trazo esperado
  let d = 0
  for (let i = 0; i < N; i++) d += Math.hypot(us[i][0] - es[i][0], us[i][1] - es[i][1])
  d /= N
  const startD = Math.hypot(us[0][0] - es[0][0], us[0][1] - es[0][1])
  const endD = Math.hypot(us[N - 1][0] - es[N - 1][0], us[N - 1][1] - es[N - 1][1])
  return d < 15 && startD < 24 && endD < 26
}

export function kvgCodepoint(ch: string): string {
  return (ch.codePointAt(0) ?? 0).toString(16).padStart(5, '0')
}

/** ¿El texto parece un SVG de verdad? Un 200 con el index.html (fallback SPA del
 *  dev server / hosting) pasaba como "SVG" y luego no tenía trazos: hay que
 *  rechazarlo para que se intente el CDN. Los SVG de KanjiVG empiezan con `<?xml`
 *  + un DOCTYPE LARGO (entidades) antes de `<svg`, así que se busca `<svg` en
 *  todo el texto y solo se descarta si la cabecera es claramente HTML. */
function looksLikeSvg(t: string): boolean {
  // El <svg de KanjiVG aparece pronto (tras el <?xml + DOCTYPE de entidades),
  // dentro de los primeros pocos KB. Un index.html de fallback tendría html/
  // head/body ahí. Se exige <svg en esa ventana y se rechaza si hay tags HTML.
  const head = t.slice(0, 4000)
  if (/<(?:!doctype html|html|head|body)[\s>]/i.test(head)) return false
  return /<svg[\s>]/i.test(head)
}

async function fetchSvgText(cp: string): Promise<string> {
  // 1) local (empaquetado, offline)
  try {
    const r = await fetch(import.meta.env.BASE_URL + 'kanjivg/' + cp + '.svg')
    if (r.ok) {
      const t = await r.text()
      if (looksLikeSvg(t)) return t // si no es SVG (p.ej. index.html), cae al CDN
    }
  } catch {
    /* sin copia local */
  }
  // 2) CDN de KanjiVG
  const r = await fetch('https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/' + cp + '.svg')
  if (!r.ok) throw new Error('kvg not found: ' + cp)
  const t = await r.text()
  if (!looksLikeSvg(t)) throw new Error('kvg not svg: ' + cp)
  return t
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
