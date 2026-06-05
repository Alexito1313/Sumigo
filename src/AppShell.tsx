import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ONBOARDED_KEY } from './screens/OnboardingScreen'
import { TabBar } from './components/TabBar'
import { DesktopNav } from './components/DesktopNav'

// Rutas de "sección" que muestran la tab bar inferior. Los modos de estudio y
// las vistas empujadas (detalle, stats, onboarding) NO la muestran.
const SECTION_PATHS = ['/', '/tablas', '/calendar', '/settings']

/** Layout raíz: contenido de la ruta + tab bar en secciones + gate de onboarding. */
export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  // Primera visita → onboarding (salvo que ya haya progreso guardado).
  useEffect(() => {
    const onboarded =
      localStorage.getItem(ONBOARDED_KEY) === '1' || !!localStorage.getItem('japoweb.progress')
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
      {showDesktopNav && <DesktopNav />}
      <Outlet />
      {showTabBar && <TabBar />}
    </div>
  )
}
