import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark')

  // En navegacion privada `localStorage` lanza al leerlo. Sin guarda, la
  // excepcion sube y la web se queda sin pintar.
  useEffect(() => {
    let savedTheme = 'dark'
    try {
      savedTheme = window.localStorage.getItem('theme') || 'dark'
    } catch {
      /* almacenamiento bloqueado: nos quedamos con el tema por defecto */
    }
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
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
