import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-scroll'
import { useTranslation } from 'react-i18next'
import { FaBars, FaTimes } from 'react-icons/fa'
import LanguageSelector from '../language/LanguageSelector'
import ThemeToggle from '../theme/ThemeToggle'
import './nav.css'

const SIDEBAR_TARGETS = ['about', 'portfolio', 'stack', 'contact']

const useActiveSection = () => {
  const [activeSection, setActiveSection] = useState(SIDEBAR_TARGETS[0])

  useEffect(() => {
    const sections = SIDEBAR_TARGETS
      .map((target) => document.getElementById(target))
      .filter(Boolean)

    if (!sections.length || !('IntersectionObserver' in window)) return undefined

    const visibleSections = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.boundingClientRect.top)
        } else {
          visibleSections.delete(entry.target.id)
        }
      })

      if (visibleSections.size) {
        const [nextSection] = [...visibleSections.entries()]
          .sort(([, firstTop], [, secondTop]) => Math.abs(firstTop) - Math.abs(secondTop))[0]
        setActiveSection(nextSection)
      }
    }, {
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0,
    })

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return activeSection
}

export const SidebarNav = () => {
  const { t } = useTranslation()
  const activeSection = useActiveSection()

  return (
    <nav className="sidebar-nav" aria-label={t('nav.sections')}>
      <ul className="sidebar-nav__list">
        {SIDEBAR_TARGETS.map((target) => (
          <li key={target}>
            <a
              href={`#${target}`}
              className={`sidebar-nav__link${activeSection === target ? ' sidebar-nav__link--active' : ''}`}
              aria-current={activeSection === target ? 'location' : undefined}
            >
              <span className="sidebar-nav__line" aria-hidden="true" />
              <span>{t(`nav.${target}`)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const Nav = () => {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const wasMenuOpenRef = useRef(false)
  const brandName = t('header.name').split(/\s+/).slice(0, 2).join(' ')
  const links = [
    { target: 'home', label: t('nav.home') },
    { target: 'about', label: t('nav.about') },
    { target: 'portfolio', label: t('nav.portfolio') },
    { target: 'stack', label: t('nav.stack') },
    { target: 'contact', label: t('nav.contact') },
  ]

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const desktopQuery = window.matchMedia('(min-width: 1025px)')
    const menu = menuRef.current
    const menuLinks = [...(menu?.querySelectorAll('a[href]') ?? [])]
    const firstLink = menuLinks[0]
    const lastLink = menuLinks[menuLinks.length - 1]

    const closeOnDesktop = (event) => {
      if (event.matches) setIsMenuOpen(false)
    }

    const containFocus = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        return
      }

      if (event.key !== 'Tab' || !firstLink || !lastLink) return

      if (event.shiftKey && (document.activeElement === firstLink || !menu?.contains(document.activeElement))) {
        event.preventDefault()
        lastLink.focus()
      } else if (!event.shiftKey && (document.activeElement === lastLink || !menu?.contains(document.activeElement))) {
        event.preventDefault()
        firstLink.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    firstLink?.focus()
    document.addEventListener('keydown', containFocus)
    desktopQuery.addEventListener('change', closeOnDesktop)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', containFocus)
      desktopQuery.removeEventListener('change', closeOnDesktop)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (isMenuOpen) {
      wasMenuOpenRef.current = true
    } else if (wasMenuOpenRef.current) {
      wasMenuOpenRef.current = false
      menuButtonRef.current?.focus()
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
          ref={menuRef}
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
