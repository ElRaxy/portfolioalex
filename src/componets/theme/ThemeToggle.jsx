import React, { useContext, useRef } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from './ThemeContext'
import './theme.css'

const THEME_TRANSITION_MS = 420

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const transitionRef = useRef(false)

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
      aria-label={t('controls.theme')}
      aria-pressed={theme === null ? undefined : theme === 'dark'}
      type="button"
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb" />
        <FaSun className="theme-toggle__icon theme-toggle__icon--sun" />
        <FaMoon className="theme-toggle__icon theme-toggle__icon--moon" />
      </span>
    </button>
  )
}

export default ThemeToggle
