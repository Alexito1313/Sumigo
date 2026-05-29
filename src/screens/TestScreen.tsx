import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useDeck } from '../data/useDeck'
import { useProgressRepo } from '../data/progress/ProgressContext'
import type { Card } from '../data/content'
import { Backdrop } from '../components/Backdrop'
import { Topbar } from '../components/Topbar'
import { ProgressMeta } from '../components/mode/ProgressMeta'
import { StreakChip } from '../components/mode/StreakChip'
import { SessionSummary, type Answer } from '../components/mode/SessionSummary'

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

/** 1 correcta + 3 distractores del mazo, barajado de forma determinista por semilla. */
function buildOptions(current: Card, deck: Card[], seed: number): Option[] {
  const others = deck.filter((c) => c.jp !== current.jp)
  const shuffled = [...others]
  let s = seed | 0
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const distractors = shuffled.slice(0, 3)
  const pool: Option[] = [
    { ...current, correct: true },
    ...distractors.map((c) => ({ ...c, correct: false })),
  ]
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

export function TestScreen() {
  const { variant } = useTheme()
  const navigate = useNavigate()
  const repo = useProgressRepo()
  const { deck, loading } = useDeck('study')
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

  const options = useMemo(
    () => (card ? buildOptions(card, deck, index * 1009 + 7) : []),
    [card, deck, index],
  )
  const correctIdx = useMemo(() => options.findIndex((o) => o.correct), [options])

  const goNext = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current)
      advanceTimer.current = null
    }
    setTransitioning(true)
    window.setTimeout(() => {
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
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
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

  if (loading || total === 0 || !card) {
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
        <Topbar />

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
          {!answeredNow && (
            <div className="test-hint">
              elige con <span className="kbd">A</span> <span className="kbd">B</span>{' '}
              <span className="kbd">C</span> <span className="kbd">D</span> o toca una opción
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
