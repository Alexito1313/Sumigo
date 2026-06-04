import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useContent } from '../data/useContent'
import { useProgressRepo } from '../data/progress/ProgressContext'
import { buildExam, type ExamQuestion } from '../data/exam'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'

const EXAM_N = 10
const EXAM_SECONDS = 10 * 60

function fmtTime(s: number): string {
  const m = Math.floor(s / 60)
  return m + ':' + String(s % 60).padStart(2, '0')
}

export function SimulacroScreen() {
  const { variant } = useTheme()
  const { content, loading } = useContent()
  const repo = useProgressRepo()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<'intro' | 'exam' | 'results'>('intro')
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [marked, setMarked] = useState<boolean[]>([])
  const [secsLeft, setSecsLeft] = useState(EXAM_SECONDS)
  const submittedRef = useRef(false)

  const total = questions.length

  const submit = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    // las respuestas del examen cuentan para el progreso/racha
    questions.forEach((q, i) => {
      if (answers[i] !== null) repo.recordAnswer(q.jp, answers[i] === q.correct)
    })
    setPhase('results')
  }, [questions, answers, repo])

  const start = useCallback(() => {
    if (!content) return
    const qs = buildExam(content, EXAM_N)
    submittedRef.current = false
    setQuestions(qs)
    setAnswers(qs.map(() => null))
    setMarked(qs.map(() => false))
    setSecsLeft(EXAM_SECONDS)
    setQIndex(0)
    setPhase('exam')
  }, [content])

  // Temporizador: decrementa cada segundo; al llegar a 0, auto-entrega.
  useEffect(() => {
    if (phase !== 'exam') return
    if (secsLeft <= 0) {
      submit()
      return
    }
    const t = window.setTimeout(() => setSecsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, secsLeft, submit])

  const pick = (i: number) =>
    setAnswers((a) => {
      const n = [...a]
      n[qIndex] = i
      return n
    })
  const toggleMark = () =>
    setMarked((m) => {
      const n = [...m]
      n[qIndex] = !n[qIndex]
      return n
    })
  const go = (i: number) => setQIndex(Math.max(0, Math.min(total - 1, i)))

  if (loading || !content) {
    return (
      <div className="mode-frame proto sim">
        <div className="home-loading">読み込み中… · cargando</div>
      </div>
    )
  }

  /* ============================ INTRO ============================ */
  if (phase === 'intro') {
    return (
      <div className="mode-frame proto sim">
        <Backdrop variant={variant} />
        <div className="mode-inner">
          <StudyHeader title="Simulacro" subtitle="検 · JLPT N4" />
          <div className="sim-intro">
            <div className="sim-seal">検</div>
            <div className="sim-intro-eyebrow">模擬試験 · simulacro</div>
            <h1 className="sim-intro-title">
              Examen JLPT<span className="lvl">N4</span>
            </h1>
            <p className="sim-intro-desc">
              Examen cronometrado en condiciones reales. No verás los aciertos hasta el final.
              Puedes marcar preguntas para revisarlas y navegar libremente.
            </p>
            <div className="sim-rules">
              <div className="sim-rule">
                <span className="sr-ico">問</span>
                <div className="sr-text">
                  <b>{EXAM_N} preguntas</b>
                  <span>lectura · vocabulario</span>
                </div>
              </div>
              <div className="sim-rule">
                <span className="sr-ico">時</span>
                <div className="sr-text">
                  <b>{fmtTime(EXAM_SECONDS)} min</b>
                  <span>el examen se entrega al acabar el tiempo</span>
                </div>
              </div>
              <div className="sim-rule">
                <span className="sr-ico">点</span>
                <div className="sr-text">
                  <b>60% para aprobar</b>
                  <span>resultado y correcciones al final</span>
                </div>
              </div>
            </div>
            <button className="sim-start-btn" onClick={start}>
              Empezar examen <span className="jp">始める →</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ============================ RESULTS ============================ */
  if (phase === 'results') {
    const correctCount = answers.reduce<number>(
      (acc, a, i) => acc + (a === questions[i].correct ? 1 : 0),
      0,
    )
    const pct = total ? Math.round((correctCount / total) * 100) : 0
    const passed = pct >= 60
    const bySection: Record<string, { right: number; total: number }> = {}
    questions.forEach((qq, i) => {
      if (!bySection[qq.type]) bySection[qq.type] = { right: 0, total: 0 }
      bySection[qq.type].total++
      if (answers[i] === qq.correct) bySection[qq.type].right++
    })
    const wrong = questions
      .map((qq, i) => ({ qq, i, a: answers[i] }))
      .filter((x) => x.a !== x.qq.correct)

    return (
      <div className="mode-frame proto sim">
        <Backdrop variant={variant} />
        <div className="mode-scroll">
          <StudyHeader title="Simulacro" subtitle="検 · JLPT N4" />
          <div className="sim-results">
            <div className={'sim-verdict ' + (passed ? 'pass' : 'fail')}>
              <div className="sv-seal">{passed ? '合' : '否'}</div>
              <div className="sv-pct">
                {pct}
                <small>%</small>
              </div>
              <div className="sv-label">{passed ? '¡Aprobado!' : 'No alcanzado'}</div>
              <div className="sv-jp">
                {passed ? '合格 · よくできました' : '不合格 · sigue practicando'}
              </div>
            </div>

            <div className="sim-res-stats">
              <div className="srs">
                <span className="n good">{correctCount}</span>
                <span className="l">aciertos</span>
              </div>
              <div className="srs">
                <span className="n bad">{total - correctCount}</span>
                <span className="l">fallos</span>
              </div>
              <div className="srs">
                <span className="n">{fmtTime(EXAM_SECONDS - secsLeft)}</span>
                <span className="l">tiempo</span>
              </div>
            </div>

            <div className="sim-section-scores">
              {Object.entries(bySection).map(([name, v]) => (
                <div className="sim-sec-row" key={name}>
                  <span className="sec-name">{name}</span>
                  <div className="sec-bar">
                    <div className="sec-fill" style={{ width: (v.total ? (v.right / v.total) * 100 : 0) + '%' }}></div>
                  </div>
                  <span className="sec-score">
                    {v.right}/{v.total}
                  </span>
                </div>
              ))}
            </div>

            {wrong.length > 0 && (
              <div className="sim-review">
                <h3 className="sim-review-h">
                  <span className="strk bad"></span>
                  Para repasar <span className="jp-side">復習</span>
                  <span className="cnt">{wrong.length}</span>
                </h3>
                {wrong.map(({ qq, i, a }) => (
                  <div className="sim-wrong" key={i}>
                    <div className="sw-q">
                      {qq.type} · {qq.prompt}
                    </div>
                    <div className="sw-rows">
                      <div className="sw-line your">
                        <span className="sw-tag">tu respuesta</span>
                        {a === null ? (
                          <span className="sw-val muted">sin responder</span>
                        ) : (
                          <span className="sw-val">{qq.options[a]}</span>
                        )}
                      </div>
                      <div className="sw-line ok">
                        <span className="sw-tag">correcta</span>
                        <span className="sw-val">{qq.options[qq.correct]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sim-res-actions">
              <button className="sim-btn ghost" onClick={() => navigate('/')}>
                Salir<span className="jp-mini">終了</span>
              </button>
              <button className="sim-btn primary" onClick={start}>
                Repetir<span className="jp-mini">もう一度</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ============================ EXAM ============================ */
  const q = questions[qIndex]
  const answeredCount = answers.filter((a) => a !== null).length
  const lowTime = secsLeft <= 60

  return (
    <div className="mode-frame proto sim">
      <Backdrop variant={variant} />
      <div className="mode-inner">
        <div className="sim-header">
          <button className="sim-exit" onClick={() => setPhase('intro')}>
            ✕
          </button>
          <div className="sim-head-mid">
            <span className="sim-q-count">
              Pregunta {qIndex + 1} / {total}
            </span>
            <span className="sim-answered">{answeredCount} respondidas</span>
          </div>
          <div className={'sim-timer' + (lowTime ? ' low' : '')}>
            <span className="st-ico">時</span>
            {fmtTime(secsLeft)}
          </div>
        </div>

        <div className="sim-progress-track">
          <div className="sim-progress-fill" style={{ width: ((qIndex + 1) / total) * 100 + '%' }}></div>
        </div>

        <div className="sim-exam-body">
          <div className="sim-q-head">
            <span className="sim-q-type">
              {q.type} <span className="jp">{q.sub}</span>
            </span>
            <button className={'sim-mark' + (marked[qIndex] ? ' on' : '')} onClick={toggleMark}>
              {marked[qIndex] ? '★ marcada' : '☆ marcar'}
            </button>
          </div>

          <div className="sim-q-card">
            <p className="sim-q-prompt">
              {q.prompt.split(q.focus).map((part, i, arr) => (
                <Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="q-focus">{q.focus}</span>}
                </Fragment>
              ))}
            </p>
          </div>

          <div className="sim-options">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={'sim-option' + (answers[qIndex] === i ? ' selected' : '')}
                onClick={() => pick(i)}
              >
                <span className="so-letter">{i + 1}</span>
                <span className="so-text">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sim-bottom">
          <div className="sim-palette">
            {questions.map((_, i) => {
              let cls = 'pal'
              if (i === qIndex) cls += ' current'
              else if (marked[i]) cls += ' marked'
              else if (answers[i] !== null) cls += ' done'
              return (
                <button key={i} className={cls} onClick={() => go(i)}>
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="sim-nav">
            <button className="sim-nav-btn" onClick={() => go(qIndex - 1)} disabled={qIndex === 0}>
              ← Anterior
            </button>
            {qIndex < total - 1 ? (
              <button className="sim-nav-btn next" onClick={() => go(qIndex + 1)}>
                Siguiente →
              </button>
            ) : (
              <button className="sim-nav-btn finish" onClick={submit}>
                Finalizar 終了
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
