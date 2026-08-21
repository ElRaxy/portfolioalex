import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { FaBars, FaTimes } from 'react-icons/fa'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LanguageSelector from '../language/LanguageSelector'
import ThemeToggle from '../theme/ThemeToggle'
import './nav.css'

gsap.registerPlugin(ScrollTrigger)

const SIDEBAR_TARGETS = ['about', 'portfolio', 'experience', 'stack', 'contact']
const OBSERVED_TARGETS = ['home', ...SIDEBAR_TARGETS]
const activeSectionListeners = new Set()
let activeSection = OBSERVED_TARGETS[0]
let activeSectionObserver

const subscribeToActiveSection = (listener) => {
  activeSectionListeners.add(listener)

  if (activeSectionListeners.size === 1 && 'IntersectionObserver' in window) {
    const sections = OBSERVED_TARGETS
      .map((target) => document.getElementById(target))
      .filter(Boolean)

    const visibleSections = new Map()
    activeSectionObserver = new IntersectionObserver((entries) => {
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

        if (nextSection !== activeSection) {
          activeSection = nextSection
          activeSectionListeners.forEach((notify) => notify())
        }
      }
    }, {
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0,
    })

    sections.forEach((section) => activeSectionObserver.observe(section))
  }

  return () => {
    activeSectionListeners.delete(listener)

    if (!activeSectionListeners.size) {
      activeSectionObserver?.disconnect()
      activeSectionObserver = undefined
    }
  }
}

const getActiveSection = () => activeSection
const useActiveSection = () => useSyncExternalStore(
  subscribeToActiveSection,
  getActiveSection,
  getActiveSection,
)

export const SidebarNav = () => {
  const { t } = useTranslation()
  const activeSection = useActiveSection()
  const progressRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const media = gsap.matchMedia()

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(progressRef.current, {
          scaleY: 0,
          transformOrigin: 'top',
        }, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        })
      })

      return () => media.revert()
    })

    return () => ctx.revert()
  }, [])

  return (
    <nav className="sidebar-nav" aria-label={t('nav.sections')}>
      <span className="sidebar-nav__progress" aria-hidden="true" ref={progressRef} />
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
  const activeSection = useActiveSection()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const wasMenuOpenRef = useRef(false)
  const brandName = t('header.name').split(/\s+/).slice(0, 2).join(' ')
  const links = [
    { target: 'home', label: t('nav.home') },
    { target: 'about', label: t('nav.about') },
    { target: 'portfolio', label: t('nav.portfolio') },
    { target: 'experience', label: t('nav.experience') },
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
        <a
          href="#home"
          className="portfolio-nav__brand"
        >
          {brandName}
        </a>

        <div
          ref={menuRef}
          id="portfolio-mobile-menu"
          className={`portfolio-nav__links${isMenuOpen ? ' portfolio-nav__links--open' : ''}`}
        >
          {links.map(({ target, label }) => (
            <a
              key={target}
              href={`#${target}`}
              className={`portfolio-nav__link${activeSection === target ? ' portfolio-nav__link--active' : ''}`}
              aria-current={activeSection === target ? 'location' : undefined}
              onClick={closeMenu}
            >
              {label}
            </a>
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
