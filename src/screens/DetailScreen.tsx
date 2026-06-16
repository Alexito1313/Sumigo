import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useContent } from '../data/useContent'
import { useProgress } from '../data/progress/ProgressContext'
import { DAY_MS } from '../data/progress/srs'
import { TYPE_LABELS } from '../data/stats'
import { Backdrop } from '../components/Backdrop'
import { ContentStatus } from '../components/ContentStatus'
import { useSafeBack } from '../components/useSafeBack'

function relPast(ts: number): string {
  if (!ts) return 'nunca'
  const days = Math.floor((Date.now() - ts) / DAY_MS)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}
function relFuture(ts: number): string {
  if (!ts) return '—'
  const days = Math.ceil((ts - Date.now()) / DAY_MS)
  if (days <= 0) return 'ahora'
  if (days === 1) return 'mañana'
  return `en ${days} días`
}

/** Parte un extra "住所(じゅうしょ) — dirección" en palabra/lectura/significado. */
function parseExtra(ex: string): { w: string; r: string; m: string } {
  const [lhs, ...rest] = ex.split('—')
  const m = rest.join('—').trim()
  const match = lhs.match(/^(.+?)[（(](.+?)[)）]\s*$/)
  if (match) return { w: match[1].trim(), r: match[2].trim(), m }
  return { w: lhs.trim(), r: '', m }
}

function splitReadings(read: string): { on: string[]; kun: string[] } {
  const parts = read
    .split('／')
    .map((s) => s.trim())
    .filter(Boolean)
  const on: string[] = []
  const kun: string[] = []
  for (const p of parts) {
    if (/[゠-ヿ]/.test(p)) on.push(p)
    else kun.push(p)
  }
  return { on, kun }
}

export function DetailScreen() {
  const { variant } = useTheme()
  const { content, loading, error, retry } = useContent()
  const { snapshot } = useProgress()
  const navigate = useNavigate()
  const back = useSafeBack()
  const params = useParams()
  let id = ''
  try {
    id = params.id ? decodeURIComponent(params.id) : ''
  } catch {
    id = '' // %-encoding malformado → "carta no encontrada" (no crash a la pantalla de error)
  }

  const card = useMemo(
    () => (content ? content.all.find((c) => c.jp === id) ?? null : null),
    [content, id],
  )
  const related = useMemo(
    () =>
      content && card
        ? content.kanji.filter((c) => c.block === card.block && c.jp !== card.jp).slice(0, 8)
        : [],
    [content, card],
  )

  if (loading || error || !content) {
    return <ContentStatus loading={loading} onRetry={retry} />
  }

  if (!card) {
    return (
      <div className="home-frame">
        <Backdrop variant={variant} />
        <div className="home-content">
          <div className="detail-wrap">
            <button className="detail-back" onClick={back}>
              <span className="db-arrow">←</span>
              Volver
            </button>
            <p style={{ padding: '40px 18px', color: 'var(--ink-3)' }}>Carta no encontrada.</p>
          </div>
        </div>
      </div>
    )
  }

  const p = snapshot.cards[card.jp]
  const seen = p?.views ?? 0
  const acc = p && p.right + p.wrong > 0 ? Math.round((p.right / (p.right + p.wrong)) * 100) : 0
  const mastery = p && seen > 0 ? Math.round((p.right / seen) * 100) : 0
  const isKanji = card.type === 'kanji'
  const { on, kun } = splitReadings(card.read)
  const typeLabel = TYPE_LABELS[card.type]?.label ?? card.type

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <div className="detail-wrap">
          <button className="detail-back" onClick={back}>
            <span className="db-arrow">←</span>
            Volver
            <span className="db-jp">戻る</span>
          </button>

          <div className="detail-hero">
            <div className="detail-kanji">{card.jp}</div>
            <div className="detail-hero-info">
              <div className="detail-mean">{card.mean}</div>
              <div className="detail-readings">
                {isKanji ? (
                  <>
                    {on.length > 0 && (
                      <div className="reading-row">
                        <span className="r-label">On</span>
                        <span className="r-val jp">{on.join('・')}</span>
                      </div>
                    )}
                    {kun.length > 0 && (
                      <div className="reading-row">
                        <span className="r-label kun">Kun</span>
                        <span className="r-val jp">{kun.join('・')}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="reading-row">
                    <span className="r-label">読み</span>
                    <span className="r-val jp">{card.read}</span>
                  </div>
                )}
              </div>
              <div className="detail-tags">
                <span className="d-tag">{card.block}</span>
                <span className="d-tag soft">{typeLabel}</span>
              </div>
            </div>
          </div>

          <div className="detail-mastery">
            <div className="dm-head">
              <span className="dm-label">Tu dominio · 習熟度</span>
              <span className="dm-pct">{mastery}%</span>
            </div>
            <div className="dm-bar">
              <div className="dm-bar-fill" style={{ width: mastery + '%' }}></div>
            </div>
            <div className="dm-stats">
              <div className="dm-stat">
                <span className="n">{seen}</span>
                <span className="l">vistas</span>
              </div>
              <div className="dm-stat">
                <span className="n good">{acc}%</span>
                <span className="l">acierto</span>
              </div>
              <div className="dm-stat">
                <span className="n accent">{p?.reps ?? 0}</span>
                <span className="l">racha</span>
              </div>
            </div>
            <div className="dm-sched">
              <span>Último repaso · {relPast(p?.lastSeen ?? 0)}</span>
              <span className="sched-next">Próximo · {p ? relFuture(p.due) : '—'}</span>
            </div>
          </div>

          {card.extras.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-section-h">
                <span className="strk"></span>
                Ejemplos <span className="jp-side">例文</span>
              </h3>
              <div className="example-list">
                {card.extras.map((ex, i) => {
                  const { w, r, m } = parseExtra(ex)
                  return (
                    <div className="example-row" key={i}>
                      <div className="ex-word jp">{w}</div>
                      <div className="ex-info">
                        {r && <div className="ex-read jp">{r}</div>}
                        <div className="ex-mean">{m}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-section-h">
                <span className="strk"></span>
                Del mismo bloque <span className="jp-side">{card.block}</span>
              </h3>
              <div className="related-row">
                {related.map((r) => (
                  <button
                    className="related-kanji"
                    key={r.jp}
                    onClick={() => navigate(`/detail/${encodeURIComponent(r.jp)}`)}
                  >
                    {r.jp}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button
              className="detail-btn primary"
              onClick={() =>
                navigate('/flash', {
                  state: { selection: { content: isKanji ? 'kanji' : 'vocab', blocks: [card.block] } },
                })
              }
            >
              <span className="db-glyph">札</span>
              Estudiar el bloque {card.block}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
