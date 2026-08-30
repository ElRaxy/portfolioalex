import React, { useContext, useRef } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from './ThemeContext'
import './theme.css'

const THEME_TRANSITION_MS = 260

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const transitionRef = useRef(false)
  // Antes de hidratar, el HTML no conoce el tema guardado del navegador. Un
  // nombre neutro evita anunciar la accion inversa si el head pinta light.
  const actionLabel = theme === null
    ? t('controls.theme')
    : t(theme === 'dark' ? 'controls.theme_to_light' : 'controls.theme_to_dark')

  const handleThemeToggle = () => {
    const root = document.documentElement
    if (
      transitionRef.current
      || root.hasAttribute('data-theme-transition')
      || root.hasAttribute('data-view-transition')
    ) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    transitionRef.current = true
    root.setAttribute('data-theme-transition', '')

    // Lee el color anterior con la regla de transicion ya activa. Sin este
    // flush el navegador puede agrupar atributo y tema en el mismo paint.
    window.getComputedStyle(root).getPropertyValue('--surface-0')
    toggleTheme()

    const cleanup = () => {
      transitionRef.current = false
      root.removeAttribute('data-theme-transition')
    }

    window.setTimeout(cleanup, prefersReducedMotion ? 0 : THEME_TRANSITION_MS)
  }

  return (
    <button
      className="theme-toggle"
      onClick={handleThemeToggle}
      aria-label={actionLabel}
      type="button"
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <FaSun className="theme-toggle__icon theme-toggle__icon--to-light" />
        <FaMoon className="theme-toggle__icon theme-toggle__icon--to-dark" />
      </span>
    </button>
  )
}

export default ThemeToggle
