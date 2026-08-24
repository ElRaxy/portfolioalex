import React, { createContext, useEffect, useState } from 'react'

export const ThemeContext = createContext()

// El tema ya lo dejo puesto el script del <head> antes del primer paint; aqui
// solo se lee, para que el estado de React no contradiga a lo que se ve.
const getPaintedTheme = () => (
  typeof document === 'undefined'
    ? 'dark'
    : document.documentElement.getAttribute('data-theme') || 'dark'
)

export function ThemeProvider({ children }) {
  // `null` hace que el primer render del navegador coincida con el HTML
  // prerenderizado. Tras hidratar se lee el tema que el script del <head> ya
  // pinto, y entonces los atributos accesibles pueden anunciar el estado real.
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    setTheme(getPaintedTheme())
  }, [])

  const toggleTheme = () => {
    const activeTheme = theme || getPaintedTheme()
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    try {
      window.localStorage.setItem('theme', newTheme)
    } catch {
      /* el tema cambia igual, solo no se recuerda */
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
} 
