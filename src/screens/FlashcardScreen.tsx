import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useDeck } from '../data/useDeck'
import { useProgressRepo } from '../data/progress/ProgressContext'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'
import { ProgressMeta } from '../components/mode/ProgressMeta'
import { StreakChip } from '../components/mode/StreakChip'
import { SessionSummary, type Answer } from '../components/mode/SessionSummary'
import { ModeEmpty } from '../components/mode/ModeEmpty'

const SPEED_VARS: Record<string, string> = {
  '--flip-dur': '650ms',
  '--exit-dur': '420ms',
}
const SWIPE_THRESHOLD = 90

// Tamaño de fuente adaptable al nº de caracteres (clamp → escala con el ancho)
// para que el vocabulario largo no se salga de la carta.
function jpFont(jp: string, face: 'front' | 'back'): string {
  const n = [...jp].length
  if (face === 'front') {
    if (n <= 1) return 'clamp(92px, 34vw, 150px)'
    if (n === 2) return 'clamp(64px, 25vw, 108px)'
    if (n === 3) return 'clamp(48px, 19vw, 84px)'
    if (n <= 5) return 'clamp(34px, 13vw, 58px)'
    return 'clamp(26px, 9.5vw, 44px)'
  }
  if (n <= 1) return 'clamp(46px, 17vw, 70px)'
  if (n <= 3) return 'clamp(34px, 12vw, 50px)'
  if (n <= 5) return 'clamp(26px, 9vw, 40px)'
  return 'clamp(22px, 7vw, 34px)'
}

type Exiting = 'left' | 'right' | null
type Feedback = 'good' | 'bad' | null

export function FlashcardScreen({ mode = 'study' }: { mode?: 'study' | 'review' }) {
  const { variant } = useTheme()
  const navigate = useNavigate()
  const repo = useProgressRepo()
  const { deck, loading } = useDeck(mode)
  const total = deck.length

  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exiting, setExiting] = useState<Exiting>(null)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [streakFlash, setStreakFlash] = useState<{ value: number; key: number } | null>(null)
  const [stats, setStats] = useState({ right: 0, wrong: 0 })
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [answered, setAnswered] = useState<Answer[]>([])
  const [finished, setFinished] = useState(false)
  const startRef = useRef({ x: 0, y: 0, t: 0, moved: false })

  const perSession = repo.getSnapshot().settings.cardsPerSession
  const TOTAL_SESSION = mode === 'review' ? total : Math.min(perSession, total || perSession)

  const advance = useCallback(
    (correct: boolean) => {
      if (!total) return
      setFeedback(correct ? 'good' : 'bad')
      setExiting(correct ? 'right' : 'left')
      setStats((s) => (correct ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }))

      const nextStreak = correct ? streak + 1 : 0
      setStreak(nextStreak)
      if (correct) setMaxStreak((m) => Math.max(m, nextStreak))
      if (correct && nextStreak >= 3) setStreakFlash({ value: nextStreak, key: Date.now() })

      const justAnswered = deck[index % total]
      repo.recordAnswer(justAnswered.jp, correct)
      const nextAnsweredLen = answered.length + 1
      setAnswered((a) => [...a, { card: justAnswered, correct }])

      window.setTimeout(() => {
        if (nextAnsweredLen >= TOTAL_SESSION) {
          setFinished(true)
          setExiting(null)
        } else {
          setIndex((i) => (i + 1) % total)
          setFlipped(false)
          setDx(0)
          setExiting(null)
          setStreakFlash(null)
          // Limpiar el feedback AL cambiar de carta: si no, la nueva (que se
          // remonta con key) heredaría el brillo verde/rojo de la anterior.
          setFeedback(null)
        }
      }, 420)
    },
    [streak, total, index, answered.length, deck, TOTAL_SESSION, repo],
  )

  const resetSession = useCallback(() => {
    setIndex(0)
    setFlipped(false)
    setDx(0)
    setExiting(null)
    setStreak(0)
    setMaxStreak(0)
    setStreakFlash(null)
    setStats({ right: 0, wrong: 0 })
    setFeedback(null)
    setAnswered([])
    setFinished(false)
  }, [])

  /* Pointer / swipe */
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (exiting) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || exiting) return
    const d = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(d) > 5 || Math.abs(dy) > 5) startRef.current.moved = true
    if (Math.abs(dy) > Math.abs(d) * 1.2 && Math.abs(d) < 30) setDx(d * 0.3)
    else setDx(d)
  }
  const onPointerUp = () => {
    if (!dragging || exiting) return
    const d = dx
    const wasDrag = startRef.current.moved
    setDragging(false)
    if (Math.abs(d) > SWIPE_THRESHOLD) {
      advance(d > 0)
    } else {
      if (!wasDrag) setFlipped((f) => !f)
      setDx(0)
    }
  }

  /* Teclado: espacio = girar, ←/A = fallé, →/D = sabía */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exiting || finished) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (flipped) advance(true)
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (flipped) advance(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, exiting, advance, finished])

  if (loading) {
    return (
      <div className="mode-frame proto">
        <div className="home-loading">読み込み中… · cargando</div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <ModeEmpty
        title={mode === 'review' ? 'Repaso' : 'Flashcards'}
        subtitle={mode === 'review' ? '復習 · repaso' : '札 · tarjetas'}
        message={
          mode === 'review'
            ? 'No hay nada que repasar todavía. Estudia algunas cartas primero.'
            : 'No hay cartas para esta selección.'
        }
      />
    )
  }

  if (finished) {
    return (
      <SessionSummary
        variant={variant}
        kind={mode === 'review' ? 'review' : 'study'}
        stats={stats}
        maxStreak={maxStreak}
        answered={answered}
        onHome={() => navigate('/')}
        onRestart={resetSession}
      />
    )
  }

  const card = deck[index % total]
  const next1 = deck[(index + 1) % total]
  const next2 = deck[(index + 2) % total]

  const rotate = dx * 0.06
  const wrapTransform = exiting ? undefined : `translateX(${dx}px) rotate(${rotate}deg)`
  const intensity = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)
  const swipeDir = dx > 0 ? 'know' : dx < 0 ? 'miss' : null

  const wrapClasses = ['proto-card-wrap']
  if (dragging) wrapClasses.push('dragging')
  if (!dragging && !exiting && dx === 0) wrapClasses.push('spring-back')
  if (exiting === 'right') wrapClasses.push('exit-right')
  if (exiting === 'left') wrapClasses.push('exit-left')

  const progressIndex = Math.min(stats.right + stats.wrong + (exiting ? 0 : 1), TOTAL_SESSION)

  return (
    <div className="mode-frame proto" style={SPEED_VARS as CSSProperties}>
      <Backdrop variant={variant} />
      <div className="mode-inner">
        <StudyHeader
          title={mode === 'review' ? 'Repaso' : 'Flashcards'}
          subtitle={mode === 'review' ? '復 · más falladas' : '札 · tarjetas'}
        />

        {mode === 'review' && (
          <div className="review-banner">
            <span className="rb-glyph">復</span>
            <div className="rb-text">
              <span className="rb-title">Repaso · más falladas</span>
              <span className="rb-sub">tus {deck.length} kanji peor llevados, primero</span>
            </div>
          </div>
        )}

        <ProgressMeta index={progressIndex} total={TOTAL_SESSION} right={stats.right} wrong={stats.wrong} />

        <div className="proto-stage">
          <div className="proto-behind b2" aria-hidden="true">
            <div className="behind-card">
              <div className="behind-jp">{next2.jp}</div>
            </div>
          </div>
          <div className="proto-behind b1" aria-hidden="true">
            <div className="behind-card">
              <div className="behind-jp">{next1.jp}</div>
            </div>
          </div>

          <div
            key={index}
            className={wrapClasses.join(' ')}
            style={{ transform: wrapTransform }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              setDx(0)
              setDragging(false)
            }}
          >
            {/* key={index}: cada carta es un elemento nuevo, así la siguiente
                nace sin girar (sin transición de giro que enseñe la respuesta). */}
            <div key={index} className={'flip-card' + (flipped ? ' is-flipped' : '')}>
              <div className="flip-inner">
                <div className="flip-face front">
                  <div className="fcard proto-card">
                    <div className="fcard-body" style={{ minHeight: 360 }}>
                      <div className="fcard-jp-big" style={{ fontSize: jpFont(card.jp, 'front') }}>
                        {card.jp}
                      </div>
                    </div>
                    <div className="fcard-hint">
                      <span>toca para girar · desliza para responder</span>
                    </div>
                  </div>
                </div>
                <div className="flip-face back">
                  <div className="fcard proto-card">
                    <div className="fcard-body" style={{ paddingTop: 28, paddingBottom: 20, minHeight: 360 }}>
                      <div className="fcard-jp-back" style={{ fontSize: jpFont(card.jp, 'back') }}>
                        {card.jp}
                      </div>
                      <div className="fcard-reading">{card.read}</div>
                      <div className="fcard-meaning">{card.mean}</div>
                      {card.extras.length > 0 && (
                        <div className="fcard-extras">
                          <h5>例 · ejemplos</h5>
                          {card.extras.map((ex, i) => (
                            <div key={i} className="ex">
                              {ex}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={'feedback-glow' + (feedback ? ' ' + feedback : '')}></div>
            </div>

            {dragging && swipeDir === 'know' && (
              <div className="swipe-overlay know" style={{ opacity: intensity }}>
                <div className="swipe-stamp">
                  <span className="stamp-mark">○</span>
                  <span className="stamp-lbl">Lo sabía</span>
                </div>
              </div>
            )}
            {dragging && swipeDir === 'miss' && (
              <div className="swipe-overlay miss" style={{ opacity: intensity }}>
                <div className="swipe-stamp">
                  <span className="stamp-mark">×</span>
                  <span className="stamp-lbl">Lo fallé</span>
                </div>
              </div>
            )}
          </div>

          {streakFlash && <StreakChip key={streakFlash.key} value={streakFlash.value} />}
        </div>

        <div className="proto-bottom">
          {flipped ? (
            <div className="proto-actions">
              <button className="proto-btn miss" onClick={() => advance(false)}>
                <span className="b-arrow">←</span>
                <span className="b-lbl">Lo fallé</span>
                <span className="b-kbd">A</span>
              </button>
              <button className="proto-btn know" onClick={() => advance(true)}>
                <span className="b-kbd">D</span>
                <span className="b-lbl">Lo sabía</span>
                <span className="b-arrow">→</span>
              </button>
            </div>
          ) : (
            <div className="proto-actions">
              <button className="proto-btn-ghost" onClick={() => setFlipped(true)}>
                Girar · ver respuesta
                <span className="b-kbd">space</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
