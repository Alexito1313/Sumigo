import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, type Variant } from '../theme/ThemeProvider'
import { useDeck } from '../data/useDeck'
import { useProgressRepo } from '../data/progress/ProgressContext'
import type { Card } from '../data/content'
import { loadKvg, measurePath, matchStroke, pathTotalLength, type Pt } from '../data/kanjivg'
import { Backdrop } from '../components/Backdrop'
import { Topbar } from '../components/Topbar'
import { ProgressMeta } from '../components/mode/ProgressMeta'
import { SessionSummary, type Answer } from '../components/mode/SessionSummary'

const WRITE_PALETTE: Record<Variant, { accent: string }> = {
  a: { accent: '#C8102E' },
  b: { accent: '#E03A47' },
}

/* ============================================================
   AutoStage — motor KanjiVG: valida cada trazo (orden japonés)
   ============================================================ */

function AutoStage({
  card,
  variant,
  guideHint,
  onGrade,
}: {
  card: Card
  variant: Variant
  guideHint: boolean
  onGrade: (correct: boolean) => void
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
    ctx.strokeStyle = accent
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const s = curPts.current
    if (s.length > 0) {
      ctx.beginPath()
      ctx.moveTo(s[0].x, s[0].y)
      s.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.stroke()
    }
  }, [accent])

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
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    if (loading || loadError) return
    setupCanvas()
    const onR = () => setupCanvas()
    window.addEventListener('resize', onR)
    return () => window.removeEventListener('resize', onR)
  }, [loading, loadError, setupCanvas])

  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const toUnits = (pt: { x: number; y: number }): Pt => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [(pt.x * 109) / rect.width, (pt.y * 109) / rect.height]
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
    redrawCanvas()
    if (ok) {
      const next = doneCount + 1
      mistakesOnStroke.current = 0
      setShowHint(false)
      setDoneCount(next)
      if (next >= paths.length) setStatus('done')
    } else {
      mistakesOnStroke.current += 1
      setMistakes((m) => m + 1)
      if (mistakesOnStroke.current >= 2) {
        setShowHint(true)
        setHintKey((k) => k + 1)
      }
    }
  }

  const restart = useCallback(() => {
    setDoneCount(0)
    setMistakes(0)
    setStatus('writing')
    setShowHint(false)
    mistakesOnStroke.current = 0
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
              No se pudieron cargar los trazos de este kanji. Escríbelo de memoria y autoevalúate.
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
          <div className="write-hint">compara mentalmente con el kanji mostrado</div>
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
            {guideOn &&
              paths.map((d, i) => (i >= doneCount ? <path key={'g' + i} className="kvg-guide-stroke" d={d} /> : null))}
            {paths.slice(0, doneCount).map((d, i) => (
              <path key={'d' + i} className="kvg-done-stroke" d={d} />
            ))}
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
            onPointerCancel={onUp}
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
          <button className="write-tool" onClick={restart} disabled={doneCount === 0 && status !== 'done'}>
            <span className="wt-ico">↺</span>Reiniciar
          </button>
          <button className={'write-tool' + (guideOn ? ' on' : '')} onClick={() => setGuideOn((g) => !g)}>
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
              Siguiente <span className="b-arrow">→</span>
            </button>
          </div>
        ) : (
          <div className="write-hint">traza en el orden correcto · la app valida cada trazo</div>
        )}
      </div>
    </>
  )
}

/* ============================================================
   WriteScreen — contenedor de sesión de escritura
   ============================================================ */

export function WriteScreen() {
  const { variant } = useTheme()
  const { deck, loading } = useDeck('write')
  const repo = useProgressRepo()
  const navigate = useNavigate()
  const total = deck.length

  const [index, setIndex] = useState(0)
  const [stats, setStats] = useState({ right: 0, wrong: 0 })
  const [answered, setAnswered] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)

  const TOTAL_SESSION = Math.min(10, total || 10)

  const grade = useCallback(
    (correct: boolean) => {
      if (!total) return
      const card = deck[index % total]
      repo.recordAnswer(card.jp, correct)
      setStats((s) => (correct ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }))
      const nextLen = answered.length + 1
      setAnswered((a) => [...a, { card, correct }])
      if (nextLen >= TOTAL_SESSION) setFinished(true)
      else setIndex((i) => (i + 1) % total)
    },
    [answered.length, deck, index, total, TOTAL_SESSION, repo],
  )

  const resetSession = useCallback(() => {
    setIndex(0)
    setStats({ right: 0, wrong: 0 })
    setAnswered([])
    setFinished(false)
  }, [])

  if (loading || total === 0) {
    return (
      <div className="mode-frame proto">
        <div className="home-loading">読み込み中… · cargando</div>
      </div>
    )
  }

  if (finished) {
    return (
      <SessionSummary
        variant={variant}
        kind="write"
        stats={stats}
        maxStreak={0}
        answered={answered}
        onHome={() => navigate('/')}
        onRestart={resetSession}
      />
    )
  }

  const card = deck[index % total]
  const progressIndex = Math.min(stats.right + stats.wrong + 1, TOTAL_SESSION)

  return (
    <div className="mode-frame proto">
      <Backdrop variant={variant} />
      <div className="mode-inner">
        <Topbar />

        <div className="write-banner">
          <span className="wb-glyph">書</span>
          <div className="wb-text">
            <span className="wb-title">Escritura · escribe el kanji</span>
            <span className="wb-sub">la app corrige el orden y la forma · trazos KanjiVG</span>
          </div>
        </div>

        <ProgressMeta index={progressIndex} total={TOTAL_SESSION} right={stats.right} wrong={stats.wrong} />

        <div className="write-prompt">
          <div className="write-prompt-mean">{card.mean}</div>
          <div className="write-prompt-read">{card.read}</div>
        </div>

        {/* Guía desactivada por defecto; el usuario la activa con el botón "Guía". */}
        <AutoStage key={'auto-' + card.jp + variant} card={card} variant={variant} guideHint={false} onGrade={grade} />
      </div>
    </div>
  )
}
