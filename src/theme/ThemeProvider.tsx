import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

/**
 * Tema de la app.
 * - Preferencia del usuario: 'auto' | 'light' | 'dark' (persistida en localStorage).
 * - Variante resuelta que se aplica como clase CSS: 'a' (Washi/claro) | 'b' (Yoru/oscuro).
 *   Las clases .va / .vb (definidas en styles.css) cambian las variables CSS de tema.
 */
export type ThemePref = 'auto' | 'light' | 'dark'
export type Variant = 'a' | 'b'

interface ThemeContextValue {
  pref: ThemePref
  variant: Variant
  setPref: (p: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'japoweb.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function resolveVariant(pref: ThemePref): Variant {
  if (pref === 'light') return 'a'
  if (pref === 'dark') return 'b'
  return window.matchMedia(DARK_QUERY).matches ? 'b' : 'a'
}

function readStoredPref(): ThemePref {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'auto'
    ? stored
    : 'auto'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readStoredPref)
  const [variant, setVariant] = useState<Variant>(() => resolveVariant(pref))

  // Recalcula la variante cuando cambia la preferencia; si es 'auto', escucha al SO.
  useEffect(() => {
    setVariant(resolveVariant(pref))
    if (pref !== 'auto') return
    const mq = window.matchMedia(DARK_QUERY)
    const onChange = () => setVariant(resolveVariant('auto'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  // Aplica la clase de tema al <html> para que las variables CSS cascadeen a todo.
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('va', 'vb')
    root.classList.add(variant === 'a' ? 'va' : 'vb')
  }, [variant])

  const setPref = (p: ThemePref) => {
    setPrefState(p)
    try {
      localStorage.setItem(STORAGE_KEY, p)
    } catch {
      /* almacenamiento no disponible: no es crítico */
    }
  }

  return (
    <ThemeContext.Provider value={{ pref, variant, setPref }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}
