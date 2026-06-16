import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useContent } from '../data/useContent'
import { useProgress } from '../data/progress/ProgressContext'
import { Backdrop } from '../components/Backdrop'
import { HIRAGANA, KATAKANA, type KanaGrid } from '../data/kana'
import { KANJI_BLOCKS, type Card, type Content } from '../data/content'
import { MiosTab } from '../components/mios/MiosTab'

type SubTab = 'hiragana' | 'katakana' | 'kanji' | 'mios'

// Persiste la sub-pestaña en sessionStorage: sobrevive al volver de un
// detalle/trazado Y a una recarga de página (antes, con una var de módulo, la
// recarga la reiniciaba a 'hiragana'); se resetea al cerrar la pestaña.
const SUBTAB_KEY = 'sumigo.tablas.subtab'
function readSubTab(): SubTab {
  try {
    const s = sessionStorage.getItem(SUBTAB_KEY)
    return s === 'hiragana' || s === 'katakana' || s === 'kanji' || s === 'mios' ? s : 'hiragana'
  } catch {
    return 'hiragana'
  }
}

const SUBTABS: { id: SubTab; label: string; glyph: string }[] = [
  { id: 'hiragana', label: 'Hiragana', glyph: 'あ' },
  { id: 'katakana', label: 'Katakana', glyph: 'ア' },
  { id: 'kanji', label: 'Kanji', glyph: '漢' },
  { id: 'mios', label: 'Míos', glyph: '自' },
]

type TraceFn = (ch: string, romaji: string, system: string) => void

function KanaGridBlock({
  title,
  grid,
  system,
  onTrace,
}: {
  title: string
  grid: KanaGrid
  system: string
  onTrace: TraceFn
}) {
  return (
    <>
      <div className="kana-section">{title}</div>
      <div className="kana-grid">
        {grid.map((row, ri) =>
          row.map((cell, ci) =>
            cell ? (
              <button
                key={ri + '-' + ci}
                className="kana-cell"
                onClick={() => onTrace(cell.ch, cell.romaji, system)}
              >
                <span className="kc-ch">{cell.ch}</span>
                <span className="kc-romaji">{cell.romaji}</span>
              </button>
            ) : (
              <span key={ri + '-' + ci} className="kana-cell empty" aria-hidden="true" />
            ),
          ),
        )}
      </div>
    </>
  )
}

function KanaTableView({
  grids,
  system,
  onTrace,
}: {
  grids: { gojuon: KanaGrid; dakuten: KanaGrid }
  system: string
  onTrace: TraceFn
}) {
  return (
    <div className="kana-tables">
      <div className="kana-hint">Toca una sílaba para practicar su trazo ✍️</div>
      <KanaGridBlock title="五十音 · gojūon" grid={grids.gojuon} system={system} onTrace={onTrace} />
      <KanaGridBlock title="濁音・半濁音 · dakuten" grid={grids.dakuten} system={system} onTrace={onTrace} />
    </div>
  )
}

function KanjiIndex({
  content,
  level,
  onOpen,
}: {
  content: Content | null
  level: string
  onOpen: (jp: string) => void
}) {
  if (!content) return <div className="home-loading">読み込み中… · cargando</div>
  const byBlock: Record<string, Card[]> = {}
  for (const c of content.kanji) (byBlock[c.block] ??= []).push(c)
  return (
    <div className="kanji-index">
      <div className="ki-level">{level} · 漢字</div>
      {KANJI_BLOCKS.map((b) => {
        const list = byBlock[b] ?? []
        if (!list.length) return null
        return (
          <div key={b} className="ki-block">
            <div className="ki-block-head">
              <span className="ki-bid">{b}</span>
              <span className="ki-bcount">{list.length} kanji</span>
            </div>
            <div className="ki-grid">
              {list.map((c) => (
                <button key={c.jp} className="ki-cell" onClick={() => onOpen(c.jp)}>
                  <span className="ki-ch">{c.jp}</span>
                  <span className="ki-mean">{c.mean}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Pestaña "Tablas": silabarios practicables + índice de kanji + Míos. */
export function TablasScreen() {
  const { variant } = useTheme()
  const navigate = useNavigate()
  const { content } = useContent()
  const { snapshot } = useProgress()
  const level = snapshot.settings.level ?? 'J3'
  const [tab, setTab] = useState<SubTab>(readSubTab)

  const select = (t: SubTab) => {
    try {
      sessionStorage.setItem(SUBTAB_KEY, t)
    } catch {
      /* sessionStorage no disponible */
    }
    setTab(t)
  }
  const traceKana: TraceFn = (ch, romaji, system) =>
    navigate('/trazar/' + encodeURIComponent(ch), { state: { romaji, system } })
  const openKanji = (jp: string) => navigate('/detail/' + encodeURIComponent(jp))

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <div className="stats-wrap" style={{ paddingBottom: 6 }}>
          <div className="stats-eyebrow">Tablas · 表</div>
          <h1 className="stats-title">
            Repertorio.
            <span className="stats-sub">silabarios, kanji y los tuyos</span>
          </h1>
        </div>

        <div className="subtabs">
          {SUBTABS.map((s) => (
            <button
              key={s.id}
              className={'subtab' + (tab === s.id ? ' active' : '')}
              onClick={() => select(s.id)}
            >
              <span className="st-glyph">{s.glyph}</span>
              <span className="st-label">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="tablas-body">
          {tab === 'hiragana' && (
            <KanaTableView grids={HIRAGANA} system="Hiragana" onTrace={traceKana} />
          )}
          {tab === 'katakana' && (
            <KanaTableView grids={KATAKANA} system="Katakana" onTrace={traceKana} />
          )}
          {tab === 'kanji' && <KanjiIndex content={content} level={level} onOpen={openKanji} />}
          {tab === 'mios' && <MiosTab />}
        </div>
      </div>
    </div>
  )
}
