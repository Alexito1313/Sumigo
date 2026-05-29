import { useMemo, useState } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import { useProgress } from '../data/progress/ProgressContext'
import { dayKey } from '../data/progress/srs'
import { Backdrop } from '../components/Backdrop'
import { Topbar } from '../components/Topbar'

const WEEK_LABELS = ['月', '火', '水', '木', '金', '土', '日']
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function intensity(count: number): number {
  if (count === 0) return 0
  if (count < 3) return 1
  if (count < 7) return 2
  if (count < 12) return 3
  return 4
}

type Cell =
  | { blank: true; key: string }
  | { blank: false; key: string; day: number; v: number; today: boolean; future: boolean }

export function CalendarScreen() {
  const { variant } = useTheme()
  const { snapshot } = useProgress()
  const [offset, setOffset] = useState(0) // 0 = mes actual, +1 = mes anterior…

  const { cells, label, monthCards, activeDays } = useMemo(() => {
    const now = new Date()
    const base = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (new Date(year, month, 1).getDay() + 6) % 7
    const todayKey = dayKey(now.getTime())

    const out: Cell[] = []
    for (let i = 0; i < lead; i++) out.push({ blank: true, key: 'b' + i })
    let monthCards = 0
    let activeDays = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const k = dayKey(d.getTime())
      const count = snapshot.streak.days[k] ?? 0
      if (count > 0) {
        monthCards += count
        activeDays++
      }
      out.push({
        blank: false,
        key: 'd' + day,
        day,
        v: intensity(count),
        today: k === todayKey,
        future: d.getTime() > now.getTime() && k !== todayKey,
      })
    }
    return {
      cells: out,
      label: `${MONTHS_ES[month]} ${year}`,
      monthCards,
      activeDays,
    }
  }, [offset, snapshot])

  const streak = snapshot.streak
  const milestones = [
    { days: 7, label: 'Una semana' },
    { days: 30, label: 'Un mes' },
    { days: 100, label: 'Centena' },
  ]

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <Topbar active="stats" />

        <div className="cal-wrap">
          <div className="cal-eyebrow">Calendario · 学習カレンダー</div>
          <h1 className="cal-title">
            Tu constancia.
            <span className="cal-sub">cada día cuenta para la racha</span>
          </h1>

          <div className="cal-month-nav">
            <button className="cmn-btn" onClick={() => setOffset((o) => o + 1)}>
              ←
            </button>
            <div className="cmn-label">{label}</div>
            <button className="cmn-btn" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 1))}>
              →
            </button>
          </div>

          <div className="cal-card">
            <div className="cal-grid-wrap">
              <div className="cal-week-head">
                {WEEK_LABELS.map((l, i) => (
                  <span key={i} className={'cwh' + (i >= 5 ? ' wknd' : '')}>
                    {l}
                  </span>
                ))}
              </div>
              <div className="cal-grid">
                {cells.map((c) =>
                  c.blank ? (
                    <span key={c.key} className="cal-cell blank"></span>
                  ) : (
                    <span
                      key={c.key}
                      className={
                        'cal-cell hm-' + c.v + (c.today ? ' today' : '') + (c.future ? ' future' : '')
                      }
                    >
                      <span className="cc-day">{c.day}</span>
                    </span>
                  ),
                )}
              </div>
            </div>
            <div className="cal-legend">
              <span className="cl-lbl">Menos</span>
              <span className="cl-dots">
                <span className="cal-cell hm-0"></span>
                <span className="cal-cell hm-1"></span>
                <span className="cal-cell hm-2"></span>
                <span className="cal-cell hm-3"></span>
                <span className="cal-cell hm-4"></span>
              </span>
              <span className="cl-lbl">Más</span>
            </div>
          </div>

          <div className="cal-stats">
            <div className="cs">
              <span className="n accent">{streak.current}</span>
              <span className="l">racha actual</span>
            </div>
            <div className="cs">
              <span className="n">{activeDays}</span>
              <span className="l">activos este mes</span>
            </div>
            <div className="cs">
              <span className="n">{monthCards}</span>
              <span className="l">cartas este mes</span>
            </div>
          </div>

          <div className="cal-section">
            <h3 className="cal-section-h">
              <span className="strk"></span>
              Hitos de racha <span className="jp-side">連続記録</span>
            </h3>
            <div className="cal-milestones">
              {milestones.map((m) => {
                const done = streak.longest >= m.days
                return (
                  <div className={'milestone' + (done ? ' done' : '')} key={m.days}>
                    <div className="ms-ring">
                      {done ? (
                        <span className="ms-check">✓</span>
                      ) : (
                        <span className="ms-prog">
                          {Math.min(streak.current, m.days)}
                          <small>/{m.days}</small>
                        </span>
                      )}
                    </div>
                    <div className="ms-info">
                      <span className="ms-days">{m.days} días</span>
                      <span className="ms-label">{m.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
