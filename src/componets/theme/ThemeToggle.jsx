import React, { useContext, useRef } from 'react'
import { flushSync } from 'react-dom'
import { FaSun, FaMoon } from 'react-icons/fa'
import { ThemeContext } from './ThemeContext'
import './theme.css'

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  const buttonRef = useRef(null)

  const handleThemeToggle = () => {
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
    const root = document.documentElement

    root.style.setProperty('--theme-transition-x', `${originX}px`)
    root.style.setProperty('--theme-transition-y', `${originY}px`)
    root.style.setProperty('--theme-transition-radius', `${radius}px`)

    const transition = document.startViewTransition(() => {
      flushSync(toggleTheme)
    })

    transition.finished
      .finally(() => {
        root.style.removeProperty('--theme-transition-x')
        root.style.removeProperty('--theme-transition-y')
        root.style.removeProperty('--theme-transition-radius')
      })
      .catch(() => {})
  }

  return (
    <button
      className="theme-toggle"
      onClick={handleThemeToggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      ref={buttonRef}
    >
      {theme === 'dark' ? (
        <FaSun className="theme-toggle-icon" />
      ) : (
        <FaMoon className="theme-toggle-icon" />
      )}
    </button>
  )
}

export default ThemeToggle
