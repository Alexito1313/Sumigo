import { useNavigate } from 'react-router-dom'
import { StudyHeader } from '../StudyHeader'

/* ============================================================
   ModeEmpty — estado vacío de un modo de estudio.
   Se usa cuando la selección no produce ninguna carta, para no
   dejar al usuario en el spinner de "cargando" indefinidamente.
   ============================================================ */

export function ModeEmpty({
  title,
  subtitle,
  message = 'No hay cartas para esta selección.',
}: {
  title: string
  subtitle?: string
  message?: string
}) {
  const navigate = useNavigate()
  return (
    <div className="mode-frame proto">
      <div className="mode-inner">
        <StudyHeader title={title} subtitle={subtitle} />
        <div
          style={{
            flex: 1,
            minHeight: '55vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 44, opacity: 0.45 }}>📭</div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, maxWidth: 280 }}>{message}</p>
          <button
            className="proto-btn-next"
            onClick={() => navigate('/')}
            style={{ marginTop: 6 }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
