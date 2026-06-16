import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useDeck } from '../data/useDeck'
import { useProgressRepo } from '../data/progress/ProgressContext'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'
import { ProgressMeta } from '../components/mode/ProgressMeta'
import { SessionSummary, type Answer } from '../components/mode/SessionSummary'
import { AutoStage } from '../components/mode/AutoStage'
import { ModeEmpty } from '../components/mode/ModeEmpty'
import { ContentStatus } from '../components/ContentStatus'

/* ============================================================
   WriteScreen — contenedor de sesión de escritura (motor en AutoStage).
   ============================================================ */

export function WriteScreen() {
  const { variant } = useTheme()
  const { deck, loading, error, retry } = useDeck('write')
  const repo = useProgressRepo()
  const navigate = useNavigate()
  const total = deck.length

  const [index, setIndex] = useState(0)
  // Estado de la guía elevado: AutoStage se remonta por carta (key), así que su
  // toggle interno se reseteaba; aquí persiste durante toda la sesión.
  const [guide, setGuide] = useState(false)
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

  if (loading || error) {
    // El error de carga muestra "Reintentar" (antes: spinner infinito sin salida).
    return <ContentStatus loading={loading} onRetry={retry} frame="mode" />
  }

  if (total === 0) {
    return (
      <ModeEmpty
        title="Escritura"
        subtitle="書 · trazar el kanji"
        message="No hay kanji para escribir en esta selección. Prueba con otros bloques."
      />
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
        <StudyHeader title="Escritura" subtitle="書 · trazar el kanji" />

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

        {/* Guía desactivada por defecto; el usuario la activa con el botón "Guía"
            (su elección persiste entre cartas vía `guide`). */}
        <AutoStage
          key={'auto-' + card.jp + variant}
          card={card}
          variant={variant}
          guideHint={guide}
          onGuideChange={setGuide}
          onGrade={grade}
        />
      </div>
    </div>
  )
}
