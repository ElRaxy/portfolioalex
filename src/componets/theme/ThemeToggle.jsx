import React, { useContext, useRef } from 'react'
import { flushSync } from 'react-dom'
import { FaSun, FaMoon } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from './ThemeContext'
import './theme.css'

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const buttonRef = useRef(null)
  const transitionRef = useRef(false)

  const handleThemeToggle = () => {
    const root = document.documentElement
    if (transitionRef.current || root.hasAttribute('data-view-transition')) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!document.startViewTransition || prefersReducedMotion || !buttonRef.current) {
      toggleTheme()
      return
    }

    const bounds = buttonRef.current.getBoundingClientRect()
    const originX = bounds.left + bounds.width / 2
    const originY = bounds.top + bounds.height / 2
    const farthestX = Math.max(originX, window.innerWidth - originX)
    const farthestY = Math.max(originY, window.innerHeight - originY)
    const radius = Math.hypot(farthestX, farthestY)
    root.style.setProperty('--theme-transition-x', `${originX}px`)
    root.style.setProperty('--theme-transition-y', `${originY}px`)
    root.style.setProperty('--theme-transition-radius', `${radius}px`)
    root.setAttribute('data-view-transition', 'theme')
    transitionRef.current = true

    const cleanup = () => {
      transitionRef.current = false
      root.removeAttribute('data-view-transition')
      root.style.removeProperty('--theme-transition-x')
      root.style.removeProperty('--theme-transition-y')
      root.style.removeProperty('--theme-transition-radius')
    }

    try {
      const transition = document.startViewTransition(() => {
        flushSync(toggleTheme)
      })

      transition.finished.catch(() => {}).finally(cleanup)
    } catch {
      cleanup()
      toggleTheme()
    }
  }

  return (
    <button
      className="theme-toggle"
      onClick={handleThemeToggle}
      aria-label={t('controls.theme')}
      aria-pressed={theme === null ? undefined : theme === 'dark'}
      ref={buttonRef}
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
