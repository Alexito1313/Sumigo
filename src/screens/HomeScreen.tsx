import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useContent } from '../data/useContent'
import { useProgress } from '../data/progress/ProgressContext'
import type { ProgressSnapshot } from '../data/progress/types'
import { dayKey, DAY_MS } from '../data/progress/srs'
import {
  KANJI_BLOCKS,
  VOCAB_BLOCKS,
  countByBlock,
  dailyIndex,
  type Card,
  type Content,
} from '../data/content'
import type { Selection } from '../data/deck'
import { Backdrop } from '../components/Backdrop'
import { LevelChip } from '../components/LevelChip'
import { useIsDesktop } from '../components/useIsDesktop'

type ContentSel = 'kanji' | 'vocab' | 'both'

const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土']

// Etiquetas ES + lectura JP para cada tipo gramatical del vocab (valores reales
// del campo `type` en los datos). Base para el futuro sistema de tags.
const TYPE_LABELS: Record<string, { label: string; jp: string }> = {
  verbo: { label: 'Verbos', jp: '動詞' },
  sustantivo: { label: 'Sustantivos', jp: '名詞' },
  'adjetivo-i': { label: 'Adj. い', jp: 'い形' },
  'adjetivo-na': { label: 'Adj. な', jp: 'な形' },
  adverbio: { label: 'Adverbios', jp: '副詞' },
  expresion: { label: 'Expresiones', jp: '表現' },
}
// Orden de aparición de los chips de tipo.
const TYPE_ORDER = ['verbo', 'sustantivo', 'adjetivo-i', 'adjetivo-na', 'adverbio', 'expresion']

function greeting(d = new Date()) {
  const h = d.getHours()
  const text =
    h < 6 ? 'Buenas noches.' : h < 12 ? 'Buenos días.' : h < 20 ? 'Buenas tardes.' : 'Buenas noches.'
  const jpSub = h < 6 ? 'こんばんは' : h < 12 ? 'おはよう' : h < 20 ? 'こんにちは' : 'こんばんは'
  const meta = `${WEEKDAYS_JP[d.getDay()]}曜日 · ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
  return { text, jpSub, meta }
}

/* ---------- sub-componentes presentacionales ---------- */

function SectionTitle({
  title,
  jp,
  toggle,
  action,
}: {
  title: string
  jp?: string
  toggle?: string
  action?: ReactNode
}) {
  return (
    <div className="section-title">
      <h3>
        <span className="stroke"></span>
        {title}
        {jp && <span className="jp-side">{jp}</span>}
      </h3>
      {action ? action : toggle ? <span className="toggle">{toggle}</span> : null}
    </div>
  )
}

const MODE_LABEL: Record<string, string> = {
  '/flash': 'Flashcards',
  '/test': 'Test',
  '/repaso': 'Repaso',
  '/escritura': 'Escritura',
  '/simulacro': 'Simulacro',
}

interface ContInfo {
  title: string
  glyph: string
  modeLabel: string
  pending: number
  pct: number
  path: string
  selection: Selection
}

/** Tarjeta "Continuar": última sesión guardada o, si no hay, el primer bloque
    de kanji en curso (o sin empezar) del temario. */
function continuarInfo(content: Content, snapshot: ProgressSnapshot): ContInfo | null {
  const last = snapshot.settings.lastSession
  let path = '/flash'
  let contentKind: 'kanji' | 'vocab' | 'both' = 'kanji'
  let block = ''
  let types: string[] | undefined

  if (last && last.blocks.length) {
    path = last.path || '/flash'
    contentKind = last.content
    block = last.blocks[0]
    types = last.types
  } else {
    for (const b of KANJI_BLOCKS) {
      const cs = content.kanji.filter((c) => c.block === b)
      if (!cs.length) continue
      const done = cs.filter((c) => (snapshot.cards[c.jp]?.views ?? 0) > 0).length
      if (done > 0 && done < cs.length) {
        block = b
        break
      }
      if (done === 0 && !block) block = b
    }
    if (!block) block = KANJI_BLOCKS[0]
  }

  const cards = content.all.filter((c) => c.block === block)
  if (!cards.length) return null
  const done = cards.filter((c) => (snapshot.cards[c.jp]?.views ?? 0) > 0).length
  const pending = cards.length - done
  const pct = cards.length ? Math.round((done / cards.length) * 100) : 0
  const glyph = (cards.find((c) => (snapshot.cards[c.jp]?.views ?? 0) === 0) ?? cards[0]).jp
  const title =
    block === 'MIOS' ? 'Míos' : block.startsWith('L') ? `Lección ${block}` : `Bloque ${block}`

  return {
    title,
    glyph,
    modeLabel: MODE_LABEL[path] ?? 'Flashcards',
    pending,
    pct,
    path,
    selection: { content: contentKind, blocks: [block], types },
  }
}

function ContentChips({
  active,
  onSelect,
}: {
  active: ContentSel | null
  onSelect: (id: ContentSel) => void
}) {
  const items: { id: ContentSel; label: string; jp: string }[] = [
    { id: 'kanji', label: 'Kanji', jp: '漢字' },
    { id: 'vocab', label: 'Vocabulario', jp: '語彙' },
    { id: 'both', label: 'Ambos', jp: '両方' },
  ]
  return (
    <div className="chips">
      {items.map((i) => (
        <button
          key={i.id}
          className={'chip ' + (active === i.id ? 'active' : '')}
          onClick={() => onSelect(i.id)}
        >
          {i.label}
          <span className="jp-tiny">{i.jp}</span>
        </button>
      ))}
    </div>
  )
}

function TypeChips({
  types,
  selected,
  onToggle,
  onClear,
}: {
  types: string[]
  selected: Set<string>
  onToggle: (v: string) => void
  onClear: () => void
}) {
  return (
    <div className="chips">
      <button className={'chip ' + (selected.size === 0 ? 'active' : '')} onClick={onClear}>
        Todos
        <span className="jp-tiny">全部</span>
      </button>
      {types.map((t) => {
        const lab = TYPE_LABELS[t] ?? { label: t, jp: '' }
        return (
          <button
            key={t}
            className={'chip ' + (selected.has(t) ? 'active' : '')}
            onClick={() => onToggle(t)}
          >
            {lab.label}
            {lab.jp && <span className="jp-tiny">{lab.jp}</span>}
          </button>
        )
      })}
    </div>
  )
}

function BlockGrid({
  blocks,
  isSelected,
  onToggle,
}: {
  blocks: { id: string; count: number }[]
  isSelected: (id: string) => boolean
  onToggle: (id: string) => void
}) {
  return (
    <div className="blocks">
      {blocks.map((b) => (
        <button
          key={b.id}
          className={'block ' + (isSelected(b.id) ? 'active' : '')}
          onClick={() => onToggle(b.id)}
        >
          <span className="b-id">{b.id === 'MIOS' ? '自' : b.id}</span>
          <span className="b-count">
            {b.count} {b.id === 'MIOS' ? 'propias' : b.id[0] === 'D' ? 'kanji' : 'palabras'}
          </span>
        </button>
      ))}
    </div>
  )
}

function ModeTiles({
  go,
  content,
  hideExam = false,
}: {
  go: (path: string) => void
  content: ContentSel | null
  hideExam?: boolean
}) {
  // La escritura (trazar el kanji) es exclusiva de kanji; no aplica a vocabulario.
  const showWrite = content !== 'vocab'
  return (
    <div className="modes">
      <div className="mode" onClick={() => go('/flash')} style={{ cursor: 'pointer' }}>
        <div className="m-row">
          <span className="m-kanji">札</span>
          <span className="m-pill">RECOMENDADO</span>
        </div>
        <div className="m-title">Flashcards</div>
        <div className="m-desc">Toca para voltear · desliza para responder</div>
      </div>
      <div className="mode" onClick={() => go('/test')} style={{ cursor: 'pointer' }}>
        <div className="m-row">
          <span className="m-kanji">試</span>
          <span className="m-pill">TEST</span>
        </div>
        <div className="m-title">Opción múltiple</div>
        <div className="m-desc">4 opciones del mismo tipo</div>
      </div>
      {/* Si no hay Escritura, Repaso ocupa el ancho completo para no dejar hueco. */}
      <div
        className={'mode' + (showWrite ? '' : ' full')}
        onClick={() => go('/repaso')}
        style={{ cursor: 'pointer' }}
      >
        <div className="m-row">
          <span className="m-kanji">復</span>
          <span className="m-pill">REPASO</span>
        </div>
        <div className="m-title">Más falladas</div>
        <div className="m-desc">Las que peor llevas, primero</div>
      </div>
      {showWrite && (
        <div className="mode" onClick={() => go('/escritura')} style={{ cursor: 'pointer' }}>
          <div className="m-row">
            <span className="m-kanji">書</span>
            <span className="m-pill">KANJI</span>
          </div>
          <div className="m-title">Escritura</div>
          <div className="m-desc">Trazar el kanji con el dedo</div>
        </div>
      )}
      {!hideExam && (
        <div className="mode full" onClick={() => go('/simulacro')} style={{ cursor: 'pointer' }}>
          <div className="m-row">
            <span className="m-kanji">検</span>
            <span className="m-pill">EXAMEN JLPT</span>
          </div>
          <div className="m-title">Simulacro cronometrado</div>
          <div className="m-desc">formato N4 · cronometrado</div>
        </div>
      )}
    </div>
  )
}

/* ---------- pantalla principal ---------- */

export function HomeScreen() {
  const { variant } = useTheme()
  const { content, loading } = useContent()
  const { snapshot, repo } = useProgress()
  const navigate = useNavigate()
  const go = (path: string) => navigate(path)
  const isDesktop = useIsDesktop()

  const [contentSel, setContentSel] = useState<ContentSel | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set())

  const greet = useMemo(() => greeting(), [])
  const level = snapshot.settings.level ?? 'J3' // nivel activo (lo gobierna el chip)
  const kanjiCounts = useMemo(() => (content ? countByBlock(content.kanji) : {}), [content])
  const vocabCounts = useMemo(() => (content ? countByBlock(content.vocab) : {}), [content])

  const blocks = useMemo(() => {
    const out: { id: string; count: number }[] = []
    if (!contentSel) return out
    if (contentSel !== 'vocab') KANJI_BLOCKS.forEach((b) => out.push({ id: b, count: kanjiCounts[b] ?? 0 }))
    if (contentSel !== 'kanji') VOCAB_BLOCKS.forEach((b) => out.push({ id: b, count: vocabCounts[b] ?? 0 }))
    // Bloque "Míos" (contenido propio, block 'MIOS') si hay entradas del tipo elegido.
    const miosCount =
      (contentSel !== 'vocab' ? kanjiCounts['MIOS'] ?? 0 : 0) +
      (contentSel !== 'kanji' ? vocabCounts['MIOS'] ?? 0 : 0)
    if (miosCount > 0) out.push({ id: 'MIOS', count: miosCount })
    return out
  }, [contentSel, kanjiCounts, vocabCounts])

  // Cartas de los bloques elegidos (sin filtro de tipo) → para el conteo de bloques.
  const blockCards = useMemo(() => {
    if (!content || !contentSel) return []
    const pool: Card[] = []
    if (contentSel !== 'vocab') pool.push(...content.kanji)
    if (contentSel !== 'kanji') pool.push(...content.vocab)
    return pool.filter((c) => selectedBlocks.has(c.block))
  }, [content, contentSel, selectedBlocks])

  // Tipos gramaticales presentes en los bloques elegidos (solo vocab).
  const availableTypes = useMemo(() => {
    if (contentSel !== 'vocab') return []
    const present = new Set(blockCards.map((c) => c.type))
    const ordered = TYPE_ORDER.filter((t) => present.has(t))
    const extra = [...present].filter((t) => !TYPE_ORDER.includes(t))
    return [...ordered, ...extra]
  }, [contentSel, blockCards])

  // Tipos efectivos: los elegidos que siguen disponibles (vacío = todos).
  const effectiveTypes = new Set([...selectedTypes].filter((t) => availableTypes.includes(t)))

  // Mazo final (con filtro de tipo) → para la selección.
  const studyCards =
    effectiveTypes.size === 0 ? blockCards : blockCards.filter((c) => effectiveTypes.has(c.type))
  const blockTotal = blockCards.length
  const total = studyCards.length

  const selection: Selection = {
    content: contentSel ?? 'kanji',
    blocks: [...selectedBlocks],
    types: effectiveTypes.size ? [...effectiveTypes] : undefined,
  }
  const goStudy = (path: string) => {
    if (!contentSel || selectedBlocks.size === 0) return
    repo.setSettings({
      lastSession: {
        path,
        content: selection.content,
        blocks: selection.blocks,
        types: selection.types,
      },
    })
    navigate(path, { state: { selection } })
  }

  const daily = useMemo(
    () => (content && content.kanji.length ? content.kanji[dailyIndex(content.kanji.length)] : null),
    [content],
  )

  const changeContent = (c: ContentSel) => {
    setContentSel(c)
    setSelectedBlocks(new Set()) // los bloques cambian según el contenido
    setSelectedTypes(new Set())
  }
  const toggleBlock = (id: string) =>
    setSelectedBlocks((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleType = (t: string) =>
    setSelectedTypes((prev) => {
      const n = new Set(prev)
      if (n.has(t)) n.delete(t)
      else n.add(t)
      return n
    })
  const clearTypes = () => setSelectedTypes(new Set())

  // "Seleccionar/quitar todo" los bloques visibles del tipo elegido.
  const allBlockIds = blocks.map((b) => b.id)
  const allBlocksSelected =
    allBlockIds.length > 0 && allBlockIds.every((id) => selectedBlocks.has(id))
  const toggleAllBlocks = () =>
    setSelectedBlocks(allBlocksSelected ? new Set() : new Set(allBlockIds))

  // Cascada: el nivel ya vive en el chip → la home arranca en Contenido.
  const showBlocks = contentSel !== null
  const showStudy = showBlocks && selectedBlocks.size > 0

  if (loading || !content) {
    return (
      <div className="home-frame">
        <div className="home-loading">読み込み中… · cargando contenido</div>
      </div>
    )
  }

  // Racha real: últimos 7 días (hoy a la derecha), nº de días estudiados.
  const streak = snapshot.streak
  const week: number[] = []
  let completedWeek = 0
  for (let i = 6; i >= 0; i--) {
    const k = dayKey(Date.now() - i * DAY_MS)
    const studied = (streak.days[k] ?? 0) > 0
    if (studied) completedWeek++
    week.push(i === 0 ? 2 : studied ? 1 : 0)
  }

  const cont = continuarInfo(content, snapshot)

  // ---------- Layout ESCRITORIO (≥960px) ----------
  // Mismos subcomponentes y handlers; solo cambia la distribución: hero ancho +
  // 2 columnas (izq: contenido/bloques/modos · der: Continuar/mini-stats/Simulacro).
  // La sidebar la pone AppShell. El layout móvil (más abajo) queda intacto.
  if (isDesktop) {
    let dRight = 0
    let dWrong = 0
    let dSeen = 0
    for (const c of Object.values(snapshot.cards)) {
      dRight += c.right || 0
      dWrong += c.wrong || 0
      if ((c.views || 0) > 0) dSeen++
    }
    const dAcc = dRight + dWrong ? Math.round((dRight / (dRight + dWrong)) * 100) : 0

    return (
      <div className="home-frame hd-frame">
        <Backdrop variant={variant} />
        <div className="home-content hd-content">
          <div className="chome-headrow">
            <div className="chome-headl">
              <div className="greet-eyebrow">
                <span className="dot"></span>
                <span className="meta">{greet.meta}</span>
              </div>
              <h1 className="greet-title chome-h1">{greet.text}</h1>
              <button
                className="chome-week"
                onClick={() => go('/calendar')}
                aria-label="Ver calendario"
              >
                <span className="cw-dots">
                  {week.map((d, i) => (
                    <span
                      key={i}
                      className={'cwd ' + (d === 1 ? 'done' : d === 2 ? 'today' : '')}
                    ></span>
                  ))}
                </span>
                <span className="cw-lbl">
                  <b>{streak.current}</b> días de racha · {completedWeek}/7 semana
                </span>
              </button>
            </div>
            {daily && (
              <button
                className="chome-daily"
                onClick={() => go(`/detail/${encodeURIComponent(daily.jp)}`)}
                aria-label="Kanji del día"
              >
                <span className="cd-eyebrow">今日</span>
                <span className="cd-kanji">{daily.jp}</span>
                <span className="cd-mean">{daily.mean.split(/[,，]/)[0].trim()}</span>
              </button>
            )}
          </div>

          <div className="hd-grid">
            <div className="hd-main">
              <div className="hd-card">
                <SectionTitle title="Contenido" jp="教材" />
                <ContentChips active={contentSel} onSelect={changeContent} />
                {showBlocks && (
                  <div className="reveal">
                    <SectionTitle
                      title="Bloques"
                      jp={contentSel === 'vocab' ? 'MNN · L26—L36' : `${level} · D1—D10`}
                      action={
                        <div className="blk-action">
                          {blockTotal > 0 && <span className="blk-count">{blockTotal} cartas</span>}
                          <button className="sel-all-btn" onClick={toggleAllBlocks}>
                            {allBlocksSelected ? 'Quitar todo' : 'Todo'}
                          </button>
                        </div>
                      }
                    />
                    <BlockGrid
                      blocks={blocks}
                      isSelected={(id) => selectedBlocks.has(id)}
                      onToggle={toggleBlock}
                    />
                  </div>
                )}
              </div>

              {showStudy && (
                <div className="hd-card reveal">
                  {contentSel === 'vocab' && availableTypes.length > 0 && (
                    <>
                      <SectionTitle
                        title="Filtro por tipo"
                        jp="品詞"
                        toggle={effectiveTypes.size ? `${total} cartas` : undefined}
                      />
                      <TypeChips
                        types={availableTypes}
                        selected={effectiveTypes}
                        onToggle={toggleType}
                        onClear={clearTypes}
                      />
                    </>
                  )}
                  <SectionTitle title="Modo de estudio" jp="学習方法" />
                  <ModeTiles go={goStudy} content={contentSel} hideExam />
                </div>
              )}
            </div>

            <div className="hd-side">
              {cont && (
                <button
                  className="continuar hd-continuar"
                  onClick={() => navigate(cont.path, { state: { selection: cont.selection } })}
                >
                  <span className="cont-k">{cont.glyph}</span>
                  <span className="cont-body">
                    <span className="cont-eyebrow">CONTINUAR · 続き</span>
                    <span className="cont-title">{cont.title}</span>
                    <span className="cont-sub">
                      {cont.modeLabel} ·{' '}
                      {cont.pending > 0
                        ? `${cont.pending} ${
                            cont.pending === 1 ? 'carta pendiente' : 'cartas pendientes'
                          }`
                        : 'repasar bloque'}
                    </span>
                    <span className="cont-prog">
                      <span className="cont-prog-bar" style={{ width: cont.pct + '%' }}></span>
                    </span>
                  </span>
                  <span className="cont-go">→</span>
                </button>
              )}

              <div className="hd-ministats">
                <div className="hd-stat">
                  <div className="n">{streak.current}</div>
                  <div className="l">racha</div>
                </div>
                <div className="hd-stat">
                  <div className="n">{dSeen}</div>
                  <div className="l">vistas</div>
                </div>
                <div className="hd-stat">
                  <div className="n">{dAcc}%</div>
                  <div className="l">acierto</div>
                </div>
              </div>

              <button className="hd-exam" onClick={() => navigate('/simulacro')}>
                <span className="he-k">検</span>
                <span className="he-t">
                  <b>Simulacro JLPT</b>
                  <small>formato N4 · cronometrado</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <div className="home-header">
          <LevelChip />
          <button className="home-acc-btn" onClick={() => go('/cuenta')} aria-label="Cuenta">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 20c0-4 3.5-6.2 7.5-6.2s7.5 2.2 7.5 6.2" />
            </svg>
          </button>
        </div>

        <div className="chome-headrow">
          <div className="chome-headl">
            <div className="greet-eyebrow">
              <span className="dot"></span>
              <span className="meta">{greet.meta}</span>
            </div>
            <h1 className="greet-title chome-h1">{greet.text}</h1>
            <button
              className="chome-week"
              onClick={() => go('/calendar')}
              aria-label="Ver calendario"
            >
              <span className="cw-dots">
                {week.map((d, i) => (
                  <span key={i} className={'cwd ' + (d === 1 ? 'done' : d === 2 ? 'today' : '')}></span>
                ))}
              </span>
              <span className="cw-lbl">
                <b>{streak.current}</b> días de racha · {completedWeek}/7 semana
              </span>
            </button>
          </div>
          {daily && (
            <button
              className="chome-daily"
              onClick={() => go(`/detail/${encodeURIComponent(daily.jp)}`)}
              aria-label="Kanji del día"
            >
              <span className="cd-eyebrow">今日</span>
              <span className="cd-kanji">{daily.jp}</span>
              <span className="cd-mean">{daily.mean.split(/[,，]/)[0].trim()}</span>
            </button>
          )}
        </div>

        <SectionTitle title="Contenido" jp="教材" />
        <ContentChips active={contentSel} onSelect={changeContent} />

        {showBlocks && (
          <div className="reveal">
            <SectionTitle
              title="Bloques"
              jp={contentSel === 'vocab' ? 'MNN · L26—L36' : `${level} · D1—D10`}
              action={
                <div className="blk-action">
                  {blockTotal > 0 && <span className="blk-count">{blockTotal} cartas</span>}
                  <button className="sel-all-btn" onClick={toggleAllBlocks}>
                    {allBlocksSelected ? 'Quitar todo' : 'Todo'}
                  </button>
                </div>
              }
            />
            <BlockGrid
              blocks={blocks}
              isSelected={(id) => selectedBlocks.has(id)}
              onToggle={toggleBlock}
            />
          </div>
        )}

        {showStudy && (
          <div className="reveal">
            {/* El filtro por tipo es gramatical (verbos, sustantivos…) → solo vocab.
                El kanji se estudia por bloques, así que se salta este paso. */}
            {contentSel === 'vocab' && availableTypes.length > 0 && (
              <>
                <SectionTitle
                  title="Filtro por tipo"
                  jp="品詞"
                  toggle={effectiveTypes.size ? `${total} cartas` : undefined}
                />
                <TypeChips
                  types={availableTypes}
                  selected={effectiveTypes}
                  onToggle={toggleType}
                  onClear={clearTypes}
                />
              </>
            )}

            <SectionTitle title="Modo de estudio" jp="学習方法" />
            <ModeTiles go={goStudy} content={contentSel} />
          </div>
        )}

        {cont && (
          <button
            className="continuar"
            onClick={() => navigate(cont.path, { state: { selection: cont.selection } })}
          >
            <span className="cont-k">{cont.glyph}</span>
            <span className="cont-body">
              <span className="cont-eyebrow">CONTINUAR · 続き</span>
              <span className="cont-title">{cont.title}</span>
              <span className="cont-sub">
                {cont.modeLabel} ·{' '}
                {cont.pending > 0
                  ? `${cont.pending} ${cont.pending === 1 ? 'carta pendiente' : 'cartas pendientes'}`
                  : 'repasar bloque'}
              </span>
              <span className="cont-prog">
                <span className="cont-prog-bar" style={{ width: cont.pct + '%' }}></span>
              </span>
            </span>
            <span className="cont-go">→</span>
          </button>
        )}
      </div>
    </div>
  )
}
