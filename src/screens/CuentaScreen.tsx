import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../theme/ThemeProvider'
import { Backdrop } from '../components/Backdrop'
import { StudyHeader } from '../components/StudyHeader'
import { accountStore, useAccount } from '../data/account/accountStore'

/**
 * Pantalla de Cuenta (vista empujada desde el icono de la home). MAQUETA: el
 * login/registro no llama a ningún servidor todavía; aquí vive también el acceso
 * a Estadísticas (movido desde Ajustes).
 */
export function CuentaScreen() {
  const { variant } = useTheme()
  const navigate = useNavigate()
  const account = useAccount()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  const submit = () => {
    if (!email.trim()) return
    accountStore.signIn(email.trim()) // MAQUETA: sin backend
    setEmail('')
    setPass('')
  }

  return (
    <div className="home-frame">
      <Backdrop variant={variant} />
      <div className="home-content">
        <StudyHeader title="Cuenta" subtitle="アカウント" onBack={() => navigate(-1)} />

        <div className="cuenta-wrap">
          {account ? (
            <div className="acc-profile">
              <div className="acc-avatar">{account.email.slice(0, 1).toUpperCase()}</div>
              <div className="acc-id">
                <div className="acc-email">{account.email}</div>
                <div className="acc-status">Sesión iniciada · demo</div>
              </div>
            </div>
          ) : (
            <div className="acc-auth">
              <div className="mf-seg">
                <button
                  className={'mf-seg-btn' + (mode === 'login' ? ' on' : '')}
                  onClick={() => setMode('login')}
                >
                  Iniciar sesión
                </button>
                <button
                  className={'mf-seg-btn' + (mode === 'register' ? ' on' : '')}
                  onClick={() => setMode('register')}
                >
                  Registrarse
                </button>
              </div>
              <label className="mf-field">
                <span className="mf-label">Correo</span>
                <input
                  className="mf-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </label>
              <label className="mf-field">
                <span className="mf-label">Contraseña</span>
                <input
                  className="mf-input"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <button className="acc-submit" onClick={submit} disabled={!email.trim()}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
              <p className="acc-note">
                Maqueta · todavía sin servidor. De momento tu progreso se guarda en este dispositivo;
                las cuentas en la nube llegarán pronto.
              </p>
            </div>
          )}

          <h3 className="settings-section-h">
            <span className="strk"></span>
            Sincronización
            <span className="jp-side">同期</span>
          </h3>
          <div className="acc-card">
            <div className="acc-row">
              <span className="acc-row-l">Estado</span>
              <span className="acc-row-val">
                {account ? 'En la nube · demo' : 'Solo en este dispositivo'}
              </span>
            </div>
          </div>

          <h3 className="settings-section-h">
            <span className="strk"></span>
            Tu progreso
            <span className="jp-side">進捗</span>
          </h3>
          <button className="acc-link" onClick={() => navigate('/stats')}>
            <span className="acc-link-ico">統</span>
            <span className="acc-link-text">
              <b>Estadísticas</b>
              <small>racha, precisión y dominio</small>
            </span>
            <span className="acc-link-arrow">→</span>
          </button>

          {account && (
            <button className="acc-signout" onClick={() => accountStore.signOut()}>
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
