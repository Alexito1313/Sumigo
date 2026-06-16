import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom'
import { ONBOARDED_KEY } from './screens/OnboardingScreen'
import { TabBar } from './components/TabBar'
import { DesktopNav } from './components/DesktopNav'
import { SaveErrorBanner } from './components/SaveErrorBanner'

// Rutas de "sección" que muestran la tab bar inferior. Los modos de estudio y
// las vistas empujadas (detalle, stats, onboarding) NO la muestran.
const SECTION_PATHS = ['/', '/tablas', '/calendar', '/settings']

/** Layout raíz: contenido de la ruta + tab bar en secciones + gate de onboarding. */
export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  // Primera visita → onboarding (salvo que ya haya progreso guardado).
  useEffect(() => {
    // Con el almacenamiento bloqueado, getItem LANZA: mejor tratar como
    // onboarded (dejar pasar) que atrapar al usuario en un bucle de error.
    let onboarded = true
    try {
      onboarded =
        localStorage.getItem(ONBOARDED_KEY) === '1' || !!localStorage.getItem('japoweb.progress')
    } catch {
      /* storage bloqueado */
    }
    // Fuerza el onboarding en CUALQUIER ruta para un usuario nuevo (antes solo en
    // '/', así que un deep-link a una sub-ruta se lo saltaba entero).
    if (!onboarded && location.pathname !== '/onboarding')
      navigate('/onboarding', { replace: true })
  }, [location.pathname, navigate])

  const showTabBar = SECTION_PATHS.includes(location.pathname)
  // La sidebar de escritorio se muestra en todas las rutas salvo onboarding
  // (el CSS la oculta por debajo de 960px → móvil sin cambios).
  const showDesktopNav = location.pathname !== '/onboarding'

  return (
    <div
      className={
        'app-root' + (showTabBar ? ' has-tabbar' : '') + (showDesktopNav ? ' dk-host' : '')
      }
    >
      <SaveErrorBanner />
      {showDesktopNav && <DesktopNav />}
      <Outlet />
      {showTabBar && <TabBar />}
      {/* Resetea el scroll al navegar (push) y lo restaura al volver atrás;
          sin esto se llegaba a mitad de página en la ruta nueva. */}
      <ScrollRestoration />
    </div>
  )
}
