import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-scroll'
import { useTranslation } from 'react-i18next'
import { FaBars, FaTimes } from 'react-icons/fa'
import LanguageSelector from '../language/LanguageSelector'
import ThemeToggle from '../theme/ThemeToggle'
import './nav.css'

const Nav = () => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const brandName = t('header.name').split(/\s+/).slice(0, 2).join(' ')
  const links = [
    { target: 'home', label: t('nav.home') },
    { target: 'portfolio', label: t('nav.portfolio') },
    { target: 'stack', label: t('nav.stack') },
    { target: 'about', label: t('nav.about') },
    { target: 'contact', label: t('nav.contact') },
  ]

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const desktopQuery = window.matchMedia('(min-width: 768px)')

    const closeOnDesktop = (event) => {
      if (event.matches) setIsMenuOpen(false)
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    desktopQuery.addEventListener('change', closeOnDesktop)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      desktopQuery.removeEventListener('change', closeOnDesktop)
    }
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="portfolio-nav">
      <div className="portfolio-nav__inner">
        <Link
          to="home"
          href="#home"
          smooth={true}
          offset={-64}
          duration={0}
          className="portfolio-nav__brand"
        >
          {brandName}
        </Link>

        <div
          id="portfolio-mobile-menu"
          className={`portfolio-nav__links${isMenuOpen ? ' portfolio-nav__links--open' : ''}`}
        >
          {links.map(({ target, label }) => (
            <Link
              key={target}
              to={target}
              href={`#${target}`}
              spy={true}
              smooth={true}
              offset={-64}
              duration={0}
              activeClass="portfolio-nav__link--active"
              className="portfolio-nav__link"
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="portfolio-nav__controls">
          <LanguageSelector />
          <ThemeToggle />
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="portfolio-nav__menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="portfolio-mobile-menu"
          aria-label={t(isMenuOpen ? 'nav.close_menu' : 'nav.open_menu')}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {isMenuOpen
            ? <FaTimes aria-hidden="true" />
            : <FaBars aria-hidden="true" />}
        </button>
      </div>
    </nav>
  )
}

export default Nav
