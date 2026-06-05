import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'
import { AutoStage } from '../components/mode/AutoStage'
import type { Card } from '../data/content'

/**
 * Trazado libre de UN carácter (kana o kanji suelto). Reutiliza el motor
 * AutoStage. La guía aparece activada por defecto (modo aprendizaje). Llega desde
 * las Tablas; el contexto (romaji/sistema) viaja por router state.
 */
export function TraceScreen() {
  const { variant } = useTheme()
  const params = useParams()
  const location = useLocation()
  const meta = (location.state as { romaji?: string; system?: string } | null) ?? {}
  const ch = decodeURIComponent(params.char ?? '')
  const [round, setRound] = useState(0)

  if (!ch) {
    return (
      <div className="mode-frame proto">
        <div className="mode-inner">
          <StudyHeader title="Trazar" />
          <p style={{ padding: '40px 18px', color: 'var(--ink-3)' }}>Carácter no válido.</p>
        </div>
      </div>
    )
  }

  const card: Card = {
    jp: ch,
    read: meta.romaji ?? '',
    mean: meta.system ?? '',
    block: '',
    type: 'kana',
    cat: '',
    extras: [],
  }
  const subtitle = [meta.system, meta.romaji].filter(Boolean).join(' · ')

  return (
    <div className="mode-frame proto">
      <Backdrop variant={variant} />
      <div className="mode-inner">
        <StudyHeader title={ch} subtitle={subtitle || 'trazar'} />

        <div className="write-prompt">
          <div className="write-prompt-mean">{meta.romaji || ch}</div>
          {meta.system && <div className="write-prompt-read">{meta.system}</div>}
        </div>

        <AutoStage
          key={'trace-' + ch + round + variant}
          card={card}
          variant={variant}
          guideHint={true}
          nextLabel="Otra vez"
          onGrade={() => setRound((r) => r + 1)}
        />
      </div>
    </div>
  )
}
