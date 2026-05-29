import { useRef, type ReactNode } from 'react'
import { useTheme, type ThemePref } from '../theme/ThemeProvider'
import { useProgress } from '../data/progress/ProgressContext'
import { Backdrop } from '../components/Backdrop'

function downloadJSON(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function SettingsRow({
  label,
  jp,
  hint,
  control,
}: {
  label: string
  jp?: string
  hint?: string
  control: ReactNode
}) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">
          {label}
          {jp && <span className="setting-jp">{jp}</span>}
        </div>
        {hint && <div className="setting-hint">{hint}</div>}
      </div>
      <div className="setting-control">{control}</div>
    </div>
  )
}

function ChipGroup({
  value,
  options,
  onSelect,
}: {
  value: string
  options: { value: string; label: string }[]
  onSelect: (v: string) => void
}) {
  return (
    <div className="setting-chips">
      {options.map((o) => (
        <button
          key={o.value}
          className={'setting-chip' + (o.value === value ? ' active' : '')}
          onClick={() => onSelect(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsScreen() {
  const { variant, pref, setPref } = useTheme()
  const { snapshot, repo } = useProgress()
  const fileRef = useRef<HTMLInputElement>(null)

  const cardsStudied = Object.keys(snapshot.cards).length
  const totalViews = Object.values(snapshot.cards).reduce((s, c) => s + c.views, 0)
  const daysStudying = Object.keys(snapshot.streak.days).length

  const onExport = () =>
    downloadJSON(`japoweb-progreso-${new Date().toISOString().slice(0, 10)}.json`, repo.exportJSON())

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = repo.importJSON(String(reader.result))
      window.alert(ok ? 'Progreso importado correctamente.' : 'El archivo no es válido.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const onReset = () => {
    if (window.confirm('¿Borrar todo el progreso y las rachas? No se puede deshacer.')) repo.reset()
  }

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <div className="settings-wrap">
          <div className="settings-eyebrow">Ajustes · 設定</div>
          <h1 className="settings-title">
            Personaliza tu estudio.
            <span className="settings-sub">los cambios se guardan automáticamente</span>
          </h1>

          <div className="settings-section">
            <h3 className="settings-section-h">
              <span className="strk"></span>
              Apariencia
              <span className="jp-side">外観</span>
            </h3>
            <div className="settings-card">
              <SettingsRow
                label="Tema"
                jp="テーマ"
                control={
                  <ChipGroup
                    value={pref}
                    onSelect={(v) => setPref(v as ThemePref)}
                    options={[
                      { value: 'auto', label: 'Auto' },
                      { value: 'light', label: 'Claro' },
                      { value: 'dark', label: 'Oscuro' },
                    ]}
                  />
                }
              />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-h">
              <span className="strk"></span>
              Estudio
              <span className="jp-side">学習</span>
            </h3>
            <div className="settings-card">
              <SettingsRow
                label="Cartas por sesión"
                jp="一回の枚数"
                control={
                  <ChipGroup
                    value={String(snapshot.settings.cardsPerSession)}
                    onSelect={(v) => repo.setSettings({ cardsPerSession: Number(v) })}
                    options={[
                      { value: '10', label: '10' },
                      { value: '20', label: '20' },
                      { value: '30', label: '30' },
                      { value: '50', label: '50' },
                    ]}
                  />
                }
              />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-h">
              <span className="strk"></span>
              Progreso
              <span className="jp-side">進捗</span>
            </h3>
            <div className="settings-card">
              <SettingsRow label="Cartas estudiadas" control={<span className="setting-value">{cardsStudied}</span>} />
              <SettingsRow label="Repasos totales" control={<span className="setting-value">{totalViews}</span>} />
              <SettingsRow label="Días estudiando" control={<span className="setting-value">{daysStudying}</span>} />
              <div className="settings-actions-row">
                <button className="setting-btn ghost" onClick={onExport}>
                  <span className="b-glyph">↓</span>
                  Exportar
                </button>
                <button className="setting-btn ghost" onClick={() => fileRef.current?.click()}>
                  <span className="b-glyph">↑</span>
                  Importar
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  style={{ display: 'none' }}
                  onChange={onImportFile}
                />
              </div>
              <SettingsRow
                label="Resetear progreso"
                hint="Borra todas las cartas vistas y rachas"
                control={
                  <button className="setting-btn danger" onClick={onReset}>
                    Resetear
                  </button>
                }
              />
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-h">
              <span className="strk"></span>
              Acerca de
              <span className="jp-side">について</span>
            </h3>
            <div className="settings-card">
              <SettingsRow label="Versión" control={<span className="setting-value muted">0.1.0</span>} />
              <SettingsRow label="Contenido" control={<span className="setting-value muted">J3 · MNN L26-L36</span>} />
              <SettingsRow
                label="Repositorio"
                control={<span className="setting-value muted">Alexito1313/JapoWeb</span>}
              />
            </div>
          </div>

          <div className="settings-footer">
            <span className="brushstroke"></span>
            日本語 estudio
            <span className="brushstroke"></span>
          </div>
        </div>
      </div>
    </div>
  )
}
