import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ONBOARDED_KEY } from './screens/OnboardingScreen'

/** Layout raíz: contenido de la ruta + redirección a onboarding en la 1ª visita. */
export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  // Primera visita → onboarding (salvo que ya haya progreso guardado).
  useEffect(() => {
    const onboarded =
      localStorage.getItem(ONBOARDED_KEY) === '1' || !!localStorage.getItem('japoweb.progress')
    if (!onboarded && location.pathname === '/') navigate('/onboarding', { replace: true })
  }, [location.pathname, navigate])

  return (
    <div className="app-root">
      <Outlet />
    </div>
  )
}
