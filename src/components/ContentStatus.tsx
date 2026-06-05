/* ============================================================
   ContentStatus — estado de carga / error del contenido.
   Sustituye al spinner "cargando" suelto: si la carga del contenido falla
   (p. ej. sin red en la primera visita), en vez de quedarse colgado o mostrar
   la app vacía sin salida, enseña un aviso con botón "Reintentar".
   ============================================================ */

export function ContentStatus({
  loading,
  onRetry,
  frame = 'home',
}: {
  loading: boolean
  onRetry?: () => void
  frame?: 'home' | 'mode'
}) {
  const cls = frame === 'mode' ? 'mode-frame proto' : 'home-frame'
  if (loading) {
    return (
      <div className={cls}>
        <div className="home-loading">読み込み中… · cargando</div>
      </div>
    )
  }
  return (
    <div className={cls}>
      <div
        className="home-loading"
        style={{ flexDirection: 'column', gap: 16, textAlign: 'center', padding: '0 32px' }}
      >
        <span style={{ fontSize: 40, opacity: 0.5 }} aria-hidden="true">
          ⚠
        </span>
        <span
          style={{ fontSize: 14, lineHeight: 1.6, letterSpacing: 'normal', color: 'var(--ink-2)' }}
        >
          No se pudo cargar el contenido. Revisa tu conexión e inténtalo de nuevo.
        </span>
        <button
          className="proto-btn-next"
          style={{ marginTop: 4 }}
          onClick={() => (onRetry ? onRetry() : window.location.reload())}
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
