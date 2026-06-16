import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import type { Variant } from '../../theme/ThemeProvider'
import type { Card } from '../../data/content'
import { loadKvg, measurePath, matchStroke, pathTotalLength, type Pt } from '../../data/kanjivg'

const WRITE_PALETTE: Record<Variant, { accent: string }> = {
  a: { accent: '#C8102E' },
  b: { accent: '#E03A47' },
}

/* ============================================================
   AutoStage — motor KanjiVG: valida cada trazo (orden japonés).
   Reutilizable: modo Escritura (sesión) y trazado de un carácter (kana/Tablas).
   ============================================================ */
export function AutoStage({
  card,
  variant,
  guideHint,
  onGuideChange,
  onGrade,
  nextLabel = 'Siguiente',
}: {
  card: Card
  variant: Variant
  guideHint: boolean
  /** Notifica al padre el toggle de la guía para que PERSISTA entre cartas
   *  (AutoStage se remonta por carta vía `key`, lo que reseteaba el toggle). */
  onGuideChange?: (on: boolean) => void
  onGrade: (correct: boolean) => void
  /** Etiqueta del botón al completar (por defecto "Siguiente"). */
  nextLabel?: string
}) {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [paths, setPaths] = useState<string[]>([])
  const [doneCount, setDoneCount] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState<'writing' | 'done'>('writing')
  const [hintKey, setHintKey] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [guideOn, setGuideOn] = useState(guideHint)

  const expSamples = useRef<Pt[][]>([])
  const mistakesOnStroke = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawing = useRef(false)
  const curPts = useRef<{ x: number; y: number }[]>([])
  const doneRef = useRef(0) // espejo de doneCount para pintar en el lienzo
  const inkRef = useRef('#1B1A17')

  const accent = WRITE_PALETTE[variant].accent

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    setPaths([])
    setDoneCount(0)
    setMistakes(0)
    setStatus('writing')
    setShowHint(false)
    mistakesOnStroke.current = 0
    doneRef.current = 0
    loadKvg(card.jp)
      .then((data) => {
        if (cancelled) return
        expSamples.current = data.paths.map((d) => measurePath(d, 28))
        setPaths(data.paths)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [card.jp])

  const redrawCanvas = useCallback(() => {
    const cv = canvasRef.current
    const ctx = ctxRef.current
    if (!cv || !ctx) return
    const rect = cv.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // Escala UNIFORME y centrada (igual que el SVG con preserveAspectRatio "meet"),
    // para que el trazo coincida con la guía aunque el pad no sea perfectamente
    // cuadrado (si no, el canvas estiraba el kanji a lo ancho → se veía achatado).
    const sc = Math.min(rect.width, rect.height) / 109
    const ox = (rect.width - 109 * sc) / 2
    const oy = (rect.height - 109 * sc) / 2
    // Trazos ya validados: la forma OFICIAL (sampleada) en SÓLIDO, en el LIENZO
    // (no en el SVG) para esquivar el bug de repintado de iOS Safari.
    ctx.strokeStyle = inkRef.current
    ctx.lineWidth = 3.6 * sc // grosor ~igual al de la guía (3.4) para que coincidan
    const exp = expSamples.current
    for (let i = 0; i < doneRef.current; i++) {
      const st = exp[i]
      if (!st || !st.length) continue
      ctx.beginPath()
      ctx.moveTo(ox + st[0][0] * sc, oy + st[0][1] * sc)
      for (const [ux, uy] of st) ctx.lineTo(ox + ux * sc, oy + uy * sc)
      ctx.stroke()
    }
    // Trazo en curso (color acento mientras lo dibujas).
    ctx.strokeStyle = accent
    ctx.lineWidth = 12
    const s = curPts.current
    if (s.length > 0) {
      ctx.beginPath()
      ctx.moveTo(s[0].x, s[0].y)
      s.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    }
  }, [accent])

  // Empujón para forzar el repintado del lienzo en iOS (la capa de composición a
  // veces no se actualiza sola tras pintar un trazo; togglear algo lo arregla).
  const forceRepaint = () => {
    const c = canvasRef.current
    if (!c) return
    c.style.opacity = '0.999'
    requestAnimationFrame(() => {
      const c2 = canvasRef.current
      if (c2) c2.style.opacity = ''
    })
  }

  const setupCanvas = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const rect = cv.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    cv.width = rect.width * dpr
    cv.height = rect.height * dpr
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    inkRef.current =
      getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || inkRef.current
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    if (loading || loadError) return
    setupCanvas()
    const onR = () => setupCanvas()
    window.addEventListener('resize', onR)
    // El pad cambia de tamaño al aparecer la barra de "completado" (reflujo, no un
    // resize de ventana) → ResizeObserver reajusta el lienzo a la nueva medida para
    // que siga coincidiendo con la guía (SVG, que se reescala solo).
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && canvasRef.current) {
      ro = new ResizeObserver(() => setupCanvas())
      ro.observe(canvasRef.current)
    }
    return () => {
      window.removeEventListener('resize', onR)
      ro?.disconnect()
    }
  }, [loading, loadError, setupCanvas])

  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const toUnits = (pt: { x: number; y: number }): Pt => {
    const rect = canvasRef.current!.getBoundingClientRect()
    // Misma escala uniforme + centrado que el dibujo, para que la validación use
    // el mismo espacio 0-109 centrado que la guía/los trazos esperados.
    const sc = Math.min(rect.width, rect.height) / 109
    const ox = (rect.width - 109 * sc) / 2
    const oy = (rect.height - 109 * sc) / 2
    return [(pt.x - ox) / sc, (pt.y - oy) / sc]
  }

  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (status === 'done') return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drawing.current = true
    curPts.current = [getPos(e)]
    redrawCanvas()
  }
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    curPts.current.push(getPos(e))
    redrawCanvas()
  }
  const onUp = () => {
    if (!drawing.current) return
    drawing.current = false
    const userUnits = curPts.current.map(toUnits)
    const expected = expSamples.current[doneCount]
    const ok = expected ? matchStroke(userUnits, expected) : false
    curPts.current = []
    if (ok) {
      const next = doneCount + 1
      doneRef.current = next // pinta ya el trazo oficial validado en el lienzo
      redrawCanvas()
      forceRepaint()
      mistakesOnStroke.current = 0
      setShowHint(false)
      setDoneCount(next)
      if (next >= paths.length) setStatus('done')
    } else {
      redrawCanvas() // limpia el trazo en curso
      forceRepaint()
      mistakesOnStroke.current += 1
      setMistakes((m) => m + 1)
      if (mistakesOnStroke.current >= 2) {
        setShowHint(true)
        setHintKey((k) => k + 1)
      }
    }
  }

  // El sistema interrumpió el trazo (notificación, palma, scroll del navegador…):
  // se descarta SIN contarlo como error (antes onPointerCancel reusaba onUp, que
  // lo evaluaba y casi siempre lo marcaba como fallo).
  const onCancel = () => {
    if (!drawing.current) return
    drawing.current = false
    curPts.current = []
    redrawCanvas()
  }

  const restart = useCallback(() => {
    setDoneCount(0)
    setMistakes(0)
    setStatus('writing')
    setShowHint(false)
    mistakesOnStroke.current = 0
    doneRef.current = 0
    curPts.current = []
    redrawCanvas()
  }, [redrawCanvas])

  // Longitud real del trazo de la pista → anima el "dibujado" sin depender de
  // pathLength (que provocaba un parpadeo rojo en el primer frame).
  const hintLen = useMemo(
    () => (showHint && paths[doneCount] ? pathTotalLength(paths[doneCount]) : 0),
    [showHint, hintKey, doneCount, paths],
  )

  const passed = mistakes === 0

  if (loadError) {
    return (
      <>
        <div className="write-stage">
          <div className="write-pad fallback-pad">
            <div className="fallback-kanji">{card.jp}</div>
            <div className="fallback-note">
              <span className="fn-glyph">!</span>
              No se pudieron cargar los trazos de este carácter. Escríbelo de memoria y autoevalúate.
            </div>
          </div>
        </div>
        <div className="proto-bottom">
          <div className="proto-actions">
            <button className="proto-btn miss" onClick={() => onGrade(false)}>
              <span className="b-arrow">↻</span>
              <span className="b-lbl">A mejorar</span>
            </button>
            <button className="proto-btn know" onClick={() => onGrade(true)}>
              <span className="b-lbl">Me salió</span>
              <span className="b-arrow">✓</span>
            </button>
          </div>
          <div className="write-hint">compara mentalmente con el carácter mostrado</div>
        </div>
      </>
    )
  }

  const strokeNum = Math.min(doneCount + (status === 'done' ? 0 : 1), paths.length || 1)

  return (
    <>
      <div className="write-stage">
        <div className="write-pad kvg-pad">
          <svg className="kvg-svg" viewBox="0 0 109 109" aria-hidden="true">
            <g className="kvg-grid">
              <line x1="54.5" y1="6" x2="54.5" y2="103" />
              <line x1="6" y1="54.5" x2="103" y2="54.5" />
            </g>
            {/* Guía = plantilla COMPLETA y constante (todos los trazos). Los
                trazos validados (oficiales sólidos) se pintan en el LIENZO, no
                aquí, para evitar el bug de repintado de SVG en iOS. */}
            {guideOn && paths.map((d, i) => <path key={'g' + i} className="kvg-guide-stroke" d={d} />)}
            {showHint && paths[doneCount] && (
              <path
                key={'h' + hintKey}
                className="kvg-hint-stroke"
                style={{ '--klen': hintLen } as CSSProperties}
                d={paths[doneCount]}
              />
            )}
          </svg>
          <canvas
            ref={canvasRef}
            className="kvg-canvas"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onCancel}
          ></canvas>
          {loading && <div className="hw-loading">cargando trazos…</div>}
          {status === 'done' && (
            <div className={'hw-complete ' + (passed ? 'good' : 'warn')}>
              <span className="hw-seal">{passed ? '正' : '直'}</span>
            </div>
          )}
        </div>

        <div className="write-meta-line">
          <span className="wm-strokes">
            trazo {strokeNum} / {paths.length || '–'}
          </span>
          <span className={'wm-mistakes' + (mistakes > 0 ? ' has' : '')}>
            {mistakes === 0 ? 'sin errores' : mistakes + (mistakes === 1 ? ' error' : ' errores')}
          </span>
        </div>

        <div className="write-tools auto-tools">
          <button
            className="write-tool"
            onClick={restart}
            // también con errores acumulados y 0 trazos: si fallas el primer
            // trazo, Reiniciar era la única forma de limpiar y estaba apagado
            disabled={doneCount === 0 && mistakes === 0 && status !== 'done'}
          >
            <span className="wt-ico">↺</span>Reiniciar
          </button>
          <button
            className={'write-tool' + (guideOn ? ' on' : '')}
            aria-pressed={guideOn}
            onClick={() =>
              setGuideOn((g) => {
                onGuideChange?.(!g)
                return !g
              })
            }
          >
            <span className="wt-ico">薄</span>Guía
          </button>
          <button
            className="write-tool"
            onClick={() => {
              setShowHint(true)
              setHintKey((k) => k + 1)
            }}
            disabled={status === 'done'}
          >
            <span className="wt-ico">見</span>Pista
          </button>
        </div>
      </div>

      <div className="proto-bottom">
        {status === 'done' ? (
          <div className={'auto-feedback ' + (passed ? 'good' : 'warn')}>
            <div className="af-l">
              <div className="af-glyph">{passed ? '✓' : '直'}</div>
              <div className="af-text">
                <div className="af-title">{passed ? '¡Perfecto!' : 'Completado'}</div>
                <div className="af-sub">
                  {passed
                    ? '完璧です · orden correcto'
                    : `${mistakes} ${mistakes === 1 ? 'corrección' : 'correcciones'} · sigue practicando`}
                </div>
              </div>
            </div>
            <button className="proto-btn-next" onClick={() => onGrade(passed)}>
              {nextLabel} <span className="b-arrow">→</span>
            </button>
          </div>
        ) : (
          <div className="write-hint">traza en el orden correcto · la app valida cada trazo</div>
        )}
      </div>
    </>
  )
}
