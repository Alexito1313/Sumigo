import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useDeck } from '../data/useDeck'
import { useContent } from '../data/useContent'
import { shuffle } from '../data/deck'
import { useProgressRepo } from '../data/progress/ProgressContext'
import type { Card } from '../data/content'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'
import { ProgressMeta } from '../components/mode/ProgressMeta'
import { StreakChip } from '../components/mode/StreakChip'
import { SessionSummary, type Answer } from '../components/mode/SessionSummary'
import { ModeEmpty } from '../components/mode/ModeEmpty'
import { ContentStatus } from '../components/ContentStatus'

const SPEED_VARS: Record<string, string> = {
  '--flip-dur': '650ms',
  '--exit-dur': '420ms',
}

// Tamaño adaptable al nº de caracteres (vocab largo no se sale de la tarjeta).
function testFont(jp: string): string {
  const n = [...jp].length
  if (n <= 1) return 'clamp(64px, 24vw, 92px)'
  if (n === 2) return 'clamp(50px, 19vw, 76px)'
  if (n === 3) return 'clamp(40px, 15vw, 60px)'
  if (n <= 5) return 'clamp(30px, 11vw, 48px)'
  return 'clamp(24px, 8vw, 38px)'
}

type Option = Card & { correct: boolean }

/**
 * 1 correcta + hasta 3 distractores, barajado determinista por semilla.
 * Los distractores salen primero del mazo en estudio y, si éste se ha quedado
 * pequeño (p. ej. al filtrar por tipo gramatical), se rellenan desde un pool
 * amplio del mismo tipo para que SIEMPRE haya 4 opciones plausibles y distintas.
 */
function buildOptions(current: Card, deck: Card[], fallback: Card[], seed: number): Option[] {
  const usedJp = new Set([current.jp])
  const usedMean = new Set([current.mean])
  const collect = (arr: Card[]): Card[] => {
    const out: Card[] = []
    for (const c of arr) {
      if (usedJp.has(c.jp) || usedMean.has(c.mean)) continue
      usedJp.add(c.jp)
      usedMean.add(c.mean)
      out.push(c)
    }
    return out
  }
  const cands = [...shuffle(collect(deck), seed), ...shuffle(collect(fallback), seed + 1)]
  const distractors = cands.slice(0, 3)
  const pool: Option[] = [
    { ...current, correct: true },
    ...distractors.map((c) => ({ ...c, correct: false })),
  ]
  return shuffle(pool, seed + 2)
}

export function TestScreen() {
  const { variant } = useTheme()
  const navigate = useNavigate()
  const repo = useProgressRepo()
  const { deck, loading, error, retry } = useDeck('study')
  const { content } = useContent()
  const total = deck.length

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [streakFlash, setStreakFlash] = useState<{ value: number; key: number } | null>(null)
  const [stats, setStats] = useState({ right: 0, wrong: 0 })
  const [answered, setAnswered] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)
  const advanceTimer = useRef<number | null>(null)

  const perSession = repo.getSnapshot().settings.cardsPerSession
  const TOTAL_SESSION = Math.min(perSession, total || perSession)
  const card = total ? deck[index % total] : null

  // Pool amplio para rellenar distractores cuando el mazo filtrado es pequeño:
  // del mismo tipo que la carta (kanji con kanji, vocab con vocab).
  const fallbackPool = useMemo<Card[]>(() => {
    if (!content) return []
    return card && card.type === 'kanji' ? content.kanji : content.vocab
  }, [content, card])

  const options = useMemo(
    () => (card ? buildOptions(card, deck, fallbackPool, index * 1009 + 7) : []),
    [card, deck, fallbackPool, index],
  )
  const correctIdx = useMemo(() => options.findIndex((o) => o.correct), [options])

  const goNext = useCallback(() => {
    // Si ya hay un avance en curso, ignora el segundo (doble-clic en "Siguiente"
    // o doble pulsación de espacio/→): antes el id nunca se guardaba en el ref,
    // así que el guard no hacía nada y se saltaba una pregunta.
    if (advanceTimer.current) return
    setTransitioning(true)
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null
      if (answered.length >= TOTAL_SESSION) setFinished(true)
      else setIndex((i) => (i + 1) % total)
      setSelected(null)
      setStreakFlash(null)
      setTransitioning(false)
    }, 240)
  }, [answered.length, total, TOTAL_SESSION])

  const onPick = useCallback(
    (idx: number) => {
      if (selected !== null || transitioning || finished || !card) return
      setSelected(idx)
      const correct = idx === correctIdx
      repo.recordAnswer(card.jp, correct)
      setStats((s) => (correct ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }))
      const nextStreak = correct ? streak + 1 : 0
      setStreak(nextStreak)
      if (correct) setMaxStreak((m) => Math.max(m, nextStreak))
      if (correct && nextStreak >= 3) {
        setStreakFlash({ value: nextStreak, key: Date.now() })
        window.setTimeout(() => setStreakFlash(null), 1100)
      }
      setAnswered((a) => [...a, { card, correct }])
    },
    [selected, transitioning, finished, correctIdx, streak, card, repo],
  )

  const resetSession = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    setIndex(0)
    setSelected(null)
    setTransitioning(false)
    setStreak(0)
    setMaxStreak(0)
    setStreakFlash(null)
    setStats({ right: 0, wrong: 0 })
    setAnswered([])
    setFinished(false)
  }, [])

  /* Teclado: 1-4/A-D elige, espacio/→ avanza */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) return
      if (selected === null) {
        const k = e.key.toLowerCase()
        const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k)
        if (idx >= 0) {
          e.preventDefault()
          onPick(idx)
        }
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, finished, onPick, goNext])

  // Limpia el timeout de avance al desmontar (evita setState tras unmount).
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    },
    [],
  )

  if (loading || error) {
    // El error de carga muestra "Reintentar" (antes: spinner infinito sin salida).
    return <ContentStatus loading={loading} onRetry={retry} frame="mode" />
  }

  if (total === 0 || !card) {
    return <ModeEmpty title="Test" subtitle="試 · opción múltiple" />
  }

  if (finished) {
    return (
      <SessionSummary
        variant={variant}
        kind="test"
        stats={stats}
        maxStreak={maxStreak}
        answered={answered}
        onHome={() => navigate('/')}
        onRestart={resetSession}
      />
    )
  }

  const progressIndex = Math.min(stats.right + stats.wrong + (selected === null ? 1 : 0), TOTAL_SESSION)
  const answeredNow = selected !== null
  const correct = answeredNow && selected === correctIdx

  return (
    <div className="mode-frame proto" style={SPEED_VARS as CSSProperties}>
      <Backdrop variant={variant} />
      <div className="mode-inner">
        <StudyHeader title="Test" subtitle="試 · opción múltiple" />

        <ProgressMeta index={progressIndex} total={TOTAL_SESSION} right={stats.right} wrong={stats.wrong} />

        <div className={'test-card-area' + (transitioning ? ' transitioning' : '')}>
          <div className="test-card-mini">
            <div className="test-jp" style={{ fontSize: testFont(card.jp) }}>
              {card.jp}
            </div>
            <div className="test-reading">{card.read}</div>
          </div>

          <div className="test-q-label">
            ¿Qué significa?
            <span className="jp-tag">意味は？</span>
          </div>

          <div className="test-options">
            {options.map((opt, idx) => {
              let cls = 'test-option proto-test-option'
              if (answeredNow) {
                if (idx === correctIdx) cls += ' correct'
                else if (idx === selected) cls += ' incorrect'
                else cls += ' dim'
              }
              return (
                <button key={idx} className={cls} onClick={() => onPick(idx)} disabled={answeredNow}>
                  <span className="opt-letter">{'ABCD'[idx]}</span>
                  <span className="opt-text">{opt.mean}</span>
                </button>
              )
            })}
          </div>

          {streakFlash && <StreakChip key={streakFlash.key} value={streakFlash.value} />}
        </div>

        <div className="proto-bottom">
          {answeredNow && (
            <div className={'test-feedback-bar ' + (correct ? 'good' : 'bad')}>
              <div className="fb-l">
                <div className="fb-glyph">{correct ? '正' : '×'}</div>
                <div className="fb-text">
                  <div className="fb-title">{correct ? '¡Correcto!' : 'Incorrecto'}</div>
                  <div className="fb-sub">
                    {correct
                      ? 'よくできました'
                      : `${card.jp}（${card.read.split('／')[1] || card.read}）= ${card.mean}`}
                  </div>
                </div>
              </div>
              <button className="proto-btn-next" onClick={goNext}>
                Siguiente
                <span className="b-arrow">→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
