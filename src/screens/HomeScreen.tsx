import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useContent } from '../data/useContent'
import { useProgress } from '../data/progress/ProgressContext'
import { dayKey, DAY_MS } from '../data/progress/srs'
import {
  KANJI_BLOCKS,
  VOCAB_BLOCKS,
  countByBlock,
  dailyIndex,
  type Card,
} from '../data/content'
import type { Selection } from '../data/deck'
import { Backdrop } from '../components/Backdrop'
import { Topbar } from '../components/Topbar'

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

function SectionTitle({ title, jp, toggle }: { title: string; jp?: string; toggle?: string }) {
  return (
    <div className="section-title">
      <h3>
        <span className="stroke"></span>
        {title}
        {jp && <span className="jp-side">{jp}</span>}
      </h3>
      {toggle && <span className="toggle">{toggle}</span>}
    </div>
  )
}

function StreakMini({
  days,
  week,
  completed,
  onOpenCalendar,
}: {
  days: number
  week: number[]
  completed: number
  onOpenCalendar: () => void
}) {
  return (
    <div className="streak-mini" onClick={onOpenCalendar} style={{ cursor: 'pointer' }}>
      <span className="pill">
        <span className="n">{days}</span>
        <span className="lbl">días · racha</span>
      </span>
      <span className="sep"></span>
      <span className="pill" style={{ gap: 8 }}>
        <span className="dots">
          {week.map((d, i) => (
            <span key={i} className={'dot ' + (d === 1 ? 'done' : d === 2 ? 'today' : '')}></span>
          ))}
        </span>
        <span className="lbl">{completed}/7 semana</span>
      </span>
    </div>
  )
}

function DailyMini({ card, onOpen }: { card: Card; onOpen: () => void }) {
  return (
    <button className="daily-mini" onClick={onOpen}>
      <div className="mini-kanji">{card.jp}</div>
      <div className="mini-info">
        <div className="mini-eyebrow">Kanji del día · 今日</div>
        <div className="mini-meaning">{card.mean}</div>
        <div className="mini-reading">
          {card.read} · {card.block}
        </div>
      </div>
      <div className="mini-arrow">→</div>
    </button>
  )
}

function LevelSelector({
  active,
  onSelect,
}: {
  active: string | null
  onSelect: (id: string) => void
}) {
  const levels = [
    { id: 'J1', sub: '1º año', locked: true },
    { id: 'J2', sub: '2º año', locked: true },
    { id: 'J3', sub: '3º año', locked: false },
    { id: 'J4', sub: '4º año', locked: true },
    { id: 'J5', sub: '5º año', locked: true },
    { id: 'J6', sub: '6º año', locked: true },
    { id: 'J7', sub: '7º año', locked: true },
  ]
  return (
    <div className="levels">
      {levels.map((l) => {
        let cls = 'level'
        if (l.id === active) cls += ' active'
        else if (l.locked) cls += ' locked'
        return (
          <button
            key={l.id}
            className={cls}
            disabled={l.locked}
            onClick={() => !l.locked && onSelect(l.id)}
          >
            <span className="l-id">{l.id}</span>
            <span className="l-sub">{l.sub}</span>
          </button>
        )
      })}
    </div>
  )
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
  active,
  onSelect,
}: {
  types: string[]
  active: string
  onSelect: (v: string) => void
}) {
  const items = [
    { value: 'all', label: 'Todos', jp: '全部' },
    ...types.map((t) => ({ value: t, ...(TYPE_LABELS[t] ?? { label: t, jp: '' }) })),
  ]
  return (
    <div className="chips">
      {items.map((i) => (
        <button
          key={i.value}
          className={'chip ' + (active === i.value ? 'active' : '')}
          onClick={() => onSelect(i.value)}
        >
          {i.label}
          {i.jp && <span className="jp-tiny">{i.jp}</span>}
        </button>
      ))}
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
          <span className="b-id">{b.id}</span>
          <span className="b-count">
            {b.count} {b.id[0] === 'D' ? 'kanji' : 'palabras'}
          </span>
        </button>
      ))}
    </div>
  )
}

function ModeTiles({ go, content }: { go: (path: string) => void; content: ContentSel | null }) {
  // La escritura (trazar el kanji) es exclusiva de kanji; no aplica a vocabulario.
  const showWrite = content !== 'vocab'
  return (
    <div className="modes">
      <div className="mode primary" onClick={() => go('/flash')} style={{ cursor: 'pointer' }}>
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
            <span className="m-pill">PRÓX.</span>
          </div>
          <div className="m-title">Escritura</div>
          <div className="m-desc">Trazar el kanji con el dedo</div>
          <div className="new-pill">新</div>
        </div>
      )}
      <div className="mode full" onClick={() => go('/simulacro')} style={{ cursor: 'pointer' }}>
        <div className="m-row">
          <span className="m-kanji">検</span>
          <span className="m-pill">EXAMEN JLPT</span>
        </div>
        <div className="m-title">Simulacro cronometrado</div>
        <div className="m-desc">formato N4 · cronometrado</div>
        <div className="new-pill">新</div>
      </div>
    </div>
  )
}

function StartButton({ count, onStart }: { count: number; onStart: () => void }) {
  return (
    <div className="start-wrap">
      <button className="btn-start" onClick={onStart} disabled={count === 0}>
        <div className="btn-start-content">
          <span>Empezar · {count} cartas</span>
          <span className="sub">始めましょう</span>
        </div>
        <span className="arrow">→</span>
      </button>
    </div>
  )
}

/* ---------- pantalla principal ---------- */

export function HomeScreen() {
  const { variant } = useTheme()
  const { content, loading } = useContent()
  const { snapshot } = useProgress()
  const navigate = useNavigate()
  const go = (path: string) => navigate(path)

  const [levelSel, setLevelSel] = useState<string | null>(null)
  const [contentSel, setContentSel] = useState<ContentSel | null>(null)
  const [typeSel, setTypeSel] = useState('all')
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set())

  const greet = useMemo(() => greeting(), [])
  const kanjiCounts = useMemo(() => (content ? countByBlock(content.kanji) : {}), [content])
  const vocabCounts = useMemo(() => (content ? countByBlock(content.vocab) : {}), [content])

  const blocks = useMemo(() => {
    const out: { id: string; count: number }[] = []
    if (!contentSel) return out
    if (contentSel !== 'vocab') KANJI_BLOCKS.forEach((b) => out.push({ id: b, count: kanjiCounts[b] ?? 0 }))
    if (contentSel !== 'kanji') VOCAB_BLOCKS.forEach((b) => out.push({ id: b, count: vocabCounts[b] ?? 0 }))
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

  // Tipo efectivo: si el elegido ya no está disponible, equivale a "todos".
  const effectiveType = typeSel !== 'all' && availableTypes.includes(typeSel) ? typeSel : 'all'

  // Mazo final (con filtro de tipo) → para el botón Empezar y la selección.
  const studyCards =
    effectiveType === 'all' ? blockCards : blockCards.filter((c) => c.type === effectiveType)
  const blockTotal = blockCards.length
  const total = studyCards.length

  const selection: Selection = {
    content: contentSel ?? 'kanji',
    blocks: [...selectedBlocks],
    type: effectiveType === 'all' ? undefined : effectiveType,
  }
  const goStudy = (path: string) => {
    if (!contentSel || selectedBlocks.size === 0) return
    navigate(path, { state: { selection } })
  }

  const daily = useMemo(
    () => (content && content.kanji.length ? content.kanji[dailyIndex(content.kanji.length)] : null),
    [content],
  )

  const selectLevel = (id: string) => {
    setLevelSel(id)
    // cambiar de nivel reinicia lo de abajo (la cascada se recalcula)
    setContentSel(null)
    setSelectedBlocks(new Set())
    setTypeSel('all')
  }
  const changeContent = (c: ContentSel) => {
    setContentSel(c)
    setSelectedBlocks(new Set()) // los bloques cambian según el contenido
    setTypeSel('all')
  }
  const toggleBlock = (id: string) =>
    setSelectedBlocks((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // Cascada: cada paso aparece cuando el anterior está elegido.
  const showContent = levelSel !== null
  const showBlocks = showContent && contentSel !== null
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

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <Topbar active="home" />

        <div className="greet-wrap">
          <div className="greet-eyebrow">
            <span className="dot"></span>
            <span className="meta">{greet.meta}</span>
          </div>
          <h1 className="greet-title">
            {greet.text}
            <span className="jp-sub">{greet.jpSub} — sigamos donde lo dejaste</span>
          </h1>
        </div>

        <StreakMini
          days={streak.current}
          week={week}
          completed={completedWeek}
          onOpenCalendar={() => go('/calendar')}
        />
        {daily && (
          <DailyMini card={daily} onOpen={() => go(`/detail/${encodeURIComponent(daily.jp)}`)} />
        )}

        <SectionTitle title="Nivel" jp="級" toggle={levelSel ? `${levelSel} activo` : 'elige nivel'} />
        <LevelSelector active={levelSel} onSelect={selectLevel} />

        {showContent && (
          <div className="reveal">
            <SectionTitle title="Contenido" jp="教材" />
            <ContentChips active={contentSel} onSelect={changeContent} />
          </div>
        )}

        {showBlocks && (
          <div className="reveal">
            <SectionTitle
              title="Bloques"
              jp={contentSel === 'vocab' ? 'MNN · L26—L36' : 'J3 · D1—D10'}
              toggle={blockTotal ? `${blockTotal} cartas` : 'elige bloques'}
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
                  toggle={effectiveType === 'all' ? undefined : `${total} cartas`}
                />
                <TypeChips types={availableTypes} active={effectiveType} onSelect={setTypeSel} />
              </>
            )}

            <SectionTitle title="Modo de estudio" jp="学習方法" />
            <ModeTiles go={goStudy} content={contentSel} />

            <StartButton count={total} onStart={() => goStudy('/flash')} />
          </div>
        )}
      </div>
    </div>
  )
}
