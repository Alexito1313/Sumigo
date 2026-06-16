import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { useContent } from '../data/useContent'
import { useProgress } from '../data/progress/ProgressContext'
import { computeStats } from '../data/stats'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'
import { useIsDesktop } from '../components/useIsDesktop'
import { ContentStatus } from '../components/ContentStatus'
import { buildBackup, downloadJSON } from '../data/backup'
import { currentStreak } from '../data/progress/srs'
import { useTodayKey } from '../components/useTodayKey'

export function StatsScreen() {
  const { variant } = useTheme()
  const { content, loading, error, retry } = useContent()
  const { snapshot, repo } = useProgress()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  useTodayKey() // re-render al volver a primer plano: "hoy" puede haber cambiado

  const stats = useMemo(
    () => (content ? computeStats(content, snapshot) : null),
    [content, snapshot],
  )

  if (loading || error || !content || !stats) {
    return <ContentStatus loading={loading} onRetry={retry} />
  }

  const streak = snapshot.streak
  const streakNow = currentStreak(streak) // racha vigente (0 si se rompió)

  // Secciones reutilizadas por el layout móvil y el de escritorio.
  const heatmapSection = (
    <div className="stats-section">
      <div className="stats-section-h">
        <span className="strk"></span>
        Últimos 35 días <span className="jp-side">学習カレンダー</span>
        <span className="cnt">{stats.activeDays35}/35</span>
      </div>
      <div className="heatmap">
        <div className="heatmap-grid">
          {stats.heat.map((v, i) => (
            <div key={i} className={'hm-cell hm-' + v}></div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span className="legend-lbl">Menos</span>
          <span className="legend-dots">
            <span className="hm-cell hm-0"></span>
            <span className="hm-cell hm-1"></span>
            <span className="hm-cell hm-2"></span>
            <span className="hm-cell hm-3"></span>
          </span>
          <span className="legend-lbl">Más</span>
        </div>
      </div>
    </div>
  )

  const failedSection =
    stats.topFailed.length > 0 ? (
      <div className="stats-section">
        <div className="stats-section-h">
          <span className="strk bad"></span>
          Top cartas falladas <span className="jp-side">よく間違える</span>
          <span className="cnt">{stats.topFailed.length}</span>
        </div>
        <div className="failed-list">
          {stats.topFailed.map((c, i) => (
            <button
              className="failed-row"
              key={c.card.jp}
              onClick={() => navigate(`/detail/${encodeURIComponent(c.card.jp)}`)}
            >
              <div className="rank">{String(i + 1).padStart(2, '0')}</div>
              <div className="row-jp">{c.card.jp}</div>
              <div className="row-info">
                <div className="row-mean">{c.card.mean}</div>
                <div className="row-read">
                  {c.card.read} · {c.card.block}
                </div>
              </div>
              <div className="row-stats">
                <div className="failrate">
                  {Math.round((c.wrong / (c.wrong + c.right)) * 100)}%
                </div>
                <div className="ratio">
                  ✗{c.wrong} · ✓{c.right}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    ) : null

  const blockSection = (
    <div className="stats-section">
      <div className="stats-section-h">
        <span className="strk"></span>
        Progreso por bloque <span className="jp-side">J3 · D1—D10</span>
      </div>
      <div className="block-list">
        {stats.blocks.map((b) => (
          <div className="block-row" key={b.id}>
            <span className="b-id">{b.id}</span>
            <div className="b-bar">
              <div
                className="b-bar-fill"
                style={{ width: (b.total ? (b.done / b.total) * 100 : 0) + '%' }}
              ></div>
            </div>
            <span className="b-count">
              {b.done}/{b.total}
            </span>
            <span className="b-pct">{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )

  const typeSection =
    stats.types.length > 0 ? (
      <div className="stats-section">
        <div className="stats-section-h">
          <span className="strk"></span>
          Por tipo <span className="jp-side">品詞別</span>
        </div>
        <div className="type-list">
          {stats.types.map((t) => (
            <div className="type-row" key={t.type}>
              <div className="t-name">
                {t.label}
                <span className="t-jp">{t.jp}</span>
              </div>
              <div className="t-bar">
                <div className="t-bar-fill" style={{ width: t.pct + '%' }}></div>
              </div>
              <span className="t-count">{t.count}</span>
              <span className="t-pct">{t.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    ) : null

  const actions = (
    <div className="stats-actions">
      <button
        className="stats-btn ghost"
        onClick={() =>
          downloadJSON(
            `sumigo-progreso-${new Date().toISOString().slice(0, 10)}.json`,
            buildBackup(repo),
          )
        }
      >
        Exportar progreso
      </button>
      <button className="stats-btn primary" onClick={() => navigate('/repaso')}>
        Repasar más falladas
        <span className="jp-mini">復習</span>
      </button>
    </div>
  )

  // ---------- ESTADÍSTICAS ESCRITORIO: 6 KPIs + 2 columnas ----------
  if (isDesktop) {
    return (
      <div className="home-frame sd-frame">
        <Backdrop variant={variant} />
        <div className="home-content sd-content">
          <div className="stats-eyebrow">Estadísticas · 統計</div>
          <h1 className="stats-title">
            Cómo vas.
            <span className="stats-sub">{stats.cardsSeen} cartas estudiadas · J3</span>
          </h1>

          <div className="sd-kpis">
            <div className="sd-kpi">
              <span className="n">{stats.cardsSeen}</span>
              <span className="l">cartas vistas</span>
              <span className="jp">学習</span>
            </div>
            <div className="sd-kpi">
              <span className="n good">
                {stats.accuracy}
                <small>%</small>
              </span>
              <span className="l">acierto global</span>
              <span className="jp">正答率</span>
            </div>
            <div className="sd-kpi">
              <span className="n accent">{streakNow}</span>
              <span className="l">racha actual</span>
              <span className="jp">連続日</span>
            </div>
            <div className="sd-kpi">
              <span className="n">{streak.longest}</span>
              <span className="l">racha máxima</span>
              <span className="jp">最高連続</span>
            </div>
            <div className="sd-kpi">
              <span className="n">{stats.totalAnswers}</span>
              <span className="l">respuestas</span>
              <span className="jp">回答数</span>
            </div>
            <div className="sd-kpi">
              <span className="n">{Object.keys(streak.days).length}</span>
              <span className="l">días activos</span>
              <span className="jp">活動日</span>
            </div>
          </div>

          <div className="sd-grid">
            <div className="sd-col">
              {heatmapSection}
              {blockSection}
              {typeSection}
            </div>
            <div className="sd-col">
              {failedSection}
              {actions}
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
        <StudyHeader title="Estadísticas" subtitle="統計" />

        <div className="stats-wrap">
          {/* sin eyebrow: la cabecera de arriba ya dice "Estadísticas" */}
          <h1 className="stats-title">
            Cómo vas.
            <span className="stats-sub">{stats.cardsSeen} cartas estudiadas · J3</span>
          </h1>

          <div className="stats-hero">
            <div className="hero-item">
              <span className="num">{stats.cardsSeen}</span>
              <span className="lbl">cartas vistas</span>
              <span className="jp-mini">学習</span>
            </div>
            <div className="hero-divider"></div>
            <div className="hero-item">
              <span className="num good">
                {stats.accuracy}
                <small>%</small>
              </span>
              <span className="lbl">acierto global</span>
              <span className="jp-mini">正答率</span>
            </div>
            <div className="hero-divider"></div>
            <div className="hero-item">
              <span className="num accent">{streakNow}</span>
              <span className="lbl">racha actual</span>
              <span className="jp-mini">連続日</span>
            </div>
          </div>

          <div className="stats-mini-row">
            <div className="stats-mini">
              <span className="lbl">Racha máxima</span>
              <span className="num">{streak.longest}</span>
            </div>
            <div className="stats-mini">
              <span className="lbl">Respuestas</span>
              <span className="num">{stats.totalAnswers}</span>
            </div>
            <div className="stats-mini">
              <span className="lbl">Días activos</span>
              <span className="num">{Object.keys(streak.days).length}</span>
            </div>
          </div>

          {heatmapSection}
          {failedSection}
          {blockSection}
          {typeSection}
          {actions}
        </div>
      </div>
    </div>
  )
}
