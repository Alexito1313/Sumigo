import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  canWrite,
  customStore,
  isKanjiChar,
  useCustom,
  type CustomEntry,
} from '../../data/custom/customStore'

const VOCAB_TAGS = [
  { id: 'sustantivo', label: 'Sustantivo' },
  { id: 'verbo', label: 'Verbo' },
  { id: 'adjetivo-i', label: 'Adj. い' },
  { id: 'adjetivo-na', label: 'Adj. な' },
  { id: 'adverbio', label: 'Adverbio' },
  { id: 'expresion', label: 'Expresión' },
]

/** Pestaña "Míos": contenido propio del usuario (alta/lista/eliminar). */
export function MiosTab() {
  const navigate = useNavigate()
  const { entries } = useCustom()
  const [adding, setAdding] = useState(false)

  const [kind, setKind] = useState<'kanji' | 'vocab'>('kanji')
  const [jp, setJp] = useState('')
  const [read, setRead] = useState('')
  const [mean, setMean] = useState('')
  const [tag, setTag] = useState('sustantivo')
  const [examples, setExamples] = useState('')

  const jpChars = [...jp.trim()]
  const oneCharKanji = kind === 'kanji' && jpChars.length === 1 && isKanjiChar(jpChars[0])
  const canSave = jp.trim().length > 0 && mean.trim().length > 0

  const resetForm = () => {
    setKind('kanji')
    setJp('')
    setRead('')
    setMean('')
    setTag('sustantivo')
    setExamples('')
  }
  const cancel = () => {
    resetForm()
    setAdding(false)
  }
  const save = () => {
    if (!canSave) return
    customStore.add({
      jp: jp.trim(),
      read: read.trim(),
      mean: mean.trim(),
      kind,
      type: kind === 'vocab' ? tag : 'kanji',
      extras: kind === 'kanji' ? examples.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    })
    cancel()
  }

  const openEntry = (e: CustomEntry) => navigate('/detail/' + encodeURIComponent(e.jp))
  const traceEntry = (e: CustomEntry) =>
    navigate('/trazar/' + encodeURIComponent(e.jp), { state: { romaji: e.read, system: 'Kanji' } })

  // Texto del indicador "en vivo" de funciones según lo escrito.
  const writeStatus = oneCharKanji
    ? 'disponible'
    : kind === 'vocab'
      ? 'solo para kanji'
      : jp.trim().length === 0
        ? 'escribe un kanji'
        : 'solo kanji de 1 carácter'

  return (
    <div className="mios">
      <div className="mios-banner">
        <span className="mb-glyph">!</span>
        <span>
          El <b>modo escritura</b> solo está disponible para kanji de <b>un carácter</b> (los trazos
          los provee KanjiVG por código de carácter).
        </span>
      </div>

      {!adding && (
        <button className="mios-add-btn" onClick={() => setAdding(true)}>
          ＋ Añadir entrada
        </button>
      )}

      {adding && (
        <div className="mios-form">
          <div className="mf-seg">
            <button
              className={'mf-seg-btn' + (kind === 'kanji' ? ' on' : '')}
              onClick={() => setKind('kanji')}
            >
              Kanji 漢字
            </button>
            <button
              className={'mf-seg-btn' + (kind === 'vocab' ? ' on' : '')}
              onClick={() => setKind('vocab')}
            >
              Vocabulario 語彙
            </button>
          </div>

          <label className="mf-field">
            <span className="mf-label">{kind === 'kanji' ? 'Kanji' : 'Palabra'}</span>
            <input
              className="mf-input"
              value={jp}
              onChange={(e) => setJp(e.target.value)}
              placeholder={kind === 'kanji' ? '例: 朝' : '例: 朝ご飯'}
              maxLength={24}
            />
          </label>
          <label className="mf-field">
            <span className="mf-label">Lectura</span>
            <input
              className="mf-input"
              value={read}
              onChange={(e) => setRead(e.target.value)}
              placeholder="例: あさ / チョウ"
            />
          </label>
          <label className="mf-field">
            <span className="mf-label">Significado</span>
            <input
              className="mf-input"
              value={mean}
              onChange={(e) => setMean(e.target.value)}
              placeholder="ej: mañana, alba"
            />
          </label>

          {kind === 'vocab' && (
            <div className="mf-field">
              <span className="mf-label">Tipo gramatical</span>
              <div className="mf-tags">
                {VOCAB_TAGS.map((t) => (
                  <button
                    key={t.id}
                    className={'mf-tag' + (tag === t.id ? ' on' : '')}
                    onClick={() => setTag(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {kind === 'kanji' && (
            <label className="mf-field">
              <span className="mf-label">Ejemplos (uno por línea)</span>
              <textarea
                className="mf-input mf-textarea"
                value={examples}
                onChange={(e) => setExamples(e.target.value)}
                placeholder={'朝ご飯（あさごはん）— desayuno\n毎朝（まいあさ）— cada mañana'}
                rows={3}
              />
            </label>
          )}

          <div className="mf-functions">
            <span className="mf-fn-ico">✍️</span>
            Escritura: <b>{writeStatus}</b>
          </div>

          <div className="mf-actions">
            <button className="mf-btn ghost" onClick={cancel}>
              Cancelar
            </button>
            <button className="mf-btn primary" onClick={save} disabled={!canSave}>
              Guardar
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding && (
        <div className="mios-empty">
          <div className="mios-glyph">自</div>
          <p>
            Aún no tienes contenido propio. Pulsa <b>＋ Añadir</b> para crear tus kanji y palabras con
            etiquetas y ejemplos.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="mios-list">
          {entries.map((e) => {
            const writable = canWrite(e)
            return (
              <div key={e.id} className="mios-row">
                <button className="mios-row-main" onClick={() => openEntry(e)}>
                  <span className="mr-jp">{e.jp}</span>
                  <span className="mr-info">
                    <span className="mr-mean">{e.mean}</span>
                    <span className="mr-read">
                      {e.read}
                      {e.kind === 'vocab' && e.type ? ' · ' + e.type : ''}
                    </span>
                  </span>
                </button>
                <div className="mios-row-actions">
                  <button
                    className={'mr-write' + (writable ? '' : ' disabled')}
                    onClick={() => writable && traceEntry(e)}
                    disabled={!writable}
                    aria-label="Practicar escritura"
                    title={writable ? 'Practicar trazo' : 'Solo kanji de 1 carácter'}
                  >
                    書
                  </button>
                  <button
                    className="mr-del"
                    onClick={() => customStore.remove(e.id)}
                    aria-label="Eliminar entrada"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
