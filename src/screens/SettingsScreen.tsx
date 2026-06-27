import { useRef, type ReactNode } from 'react'
import { useTheme, type ThemePref } from '../theme/ThemeProvider'
import { useProgress } from '../data/progress/ProgressContext'
import { buildBackup, downloadJSON, importBackup } from '../data/backup'
import { Backdrop } from '../components/Backdrop'
import { useIsDesktop } from '../components/useIsDesktop'

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
          aria-pressed={o.value === value}
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
  const isDesktop = useIsDesktop()

  const cardsStudied = Object.keys(snapshot.cards).length
  const totalViews = Object.values(snapshot.cards).reduce((s, c) => s + c.views, 0)
  const daysStudying = Object.keys(snapshot.streak.days).length

  const onExport = () =>
    downloadJSON(`sumigo-progreso-${new Date().toISOString().slice(0, 10)}.json`, buildBackup(repo))

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importBackup(repo, String(reader.result))
      window.alert(ok ? 'Copia importada correctamente.' : 'El archivo no es válido.')
    }
    reader.onerror = () => window.alert('No se pudo leer el archivo.')
    reader.readAsText(file)
    e.target.value = ''
  }

  const onReset = () => {
    if (window.confirm('¿Borrar todo el progreso y las rachas? No se puede deshacer.')) repo.reset()
  }

  // Cabecera, secciones y footer reutilizados por móvil y escritorio.
  const header = (
    <>
      <div className="settings-eyebrow">Ajustes · 設定</div>
      <h1 className="settings-title">
        Personaliza tu estudio.
        <span className="settings-sub">los cambios se guardan automáticamente</span>
      </h1>
    </>
  )

  const secAppearance = (
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
  )

  const secStudy = (
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
  )

  const secProgress = (
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
  )

  const secAbout = (
    <div className="settings-section">
      <h3 className="settings-section-h">
        <span className="strk"></span>
        Acerca de
        <span className="jp-side">について</span>
      </h3>
      <div className="settings-card">
        <SettingsRow label="Versión" control={<span className="setting-value muted">0.1.0</span>} />
        <SettingsRow label="Contenido" control={<span className="setting-value muted">J3 · N4 · L26-L36</span>} />
        <SettingsRow
          label="Repositorio"
          control={<span className="setting-value muted">Alexito1313/Sumigo</span>}
        />
      </div>
    </div>
  )

  const secCredits = (
    <div className="settings-section">
      <h3 className="settings-section-h">
        <span className="strk"></span>
        Créditos y licencias
        <span className="jp-side">謝辞</span>
      </h3>
      <div className="settings-card set-credits">
        <div className="set-credit">
          <div className="sc-title">Trazos de kanji y kana</div>
          <div className="sc-desc">
            KanjiVG © Ulrich Apel —{' '}
            <a
              className="sc-link"
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-SA 3.0
            </a>
          </div>
        </div>
        <div className="set-credit">
          <div className="sc-title">Tipografías</div>
          <div className="sc-desc">
            Noto Sans JP, Noto Serif JP, Shippori Mincho e Inter —{' '}
            <a
              className="sc-link"
              href="https://openfontlicense.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              SIL Open Font License
            </a>
          </div>
        </div>
        <div className="set-credit">
          <div className="sc-title">Tecnología</div>
          <div className="sc-desc">
            Construido con React, Vite y otras librerías de código abierto.
          </div>
        </div>
      </div>
    </div>
  )

  // ---------- AJUSTES ESCRITORIO: cabecera ancha + 4 secciones en 2 columnas ----------
  if (isDesktop) {
    return (
      <div className="home-frame setk-frame">
        <Backdrop variant={variant} />
        <div className="home-content setk-content">
          <div className="setk-head">{header}</div>

          <div className="setk-grid">
            <div className="setk-col">
              {secAppearance}
              {secStudy}
              {secAbout}
            </div>
            <div className="setk-col">
              {secProgress}
              {secCredits}
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
        <div className="settings-wrap">
          {header}
          {secAppearance}
          {secStudy}
          {secProgress}
          {secAbout}
          {secCredits}
        </div>
      </div>
    </div>
  )
}
