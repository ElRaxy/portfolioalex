import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { FaBars, FaTimes } from 'react-icons/fa'
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import LanguageSelector from '../language/LanguageSelector'
import { parseRoute, homeHref } from '../../lib/routing'
import { useRoutePathname } from '../../lib/routeContext'
import ThemeToggle from '../theme/ThemeToggle'
import './nav.css'

const SECTION_TARGETS = ['portfolio', 'about', 'experience', 'stack', 'contact']

// Dentro de una pagina de caso las secciones no existen: el ancla suelta no
// llevaria a ninguna parte, asi que se prefija con la home de ese idioma.
const useAnchorBase = () => {
  const pathname = useRoutePathname()
  const route = parseRoute(pathname)
  return route.kind === 'case' ? homeHref(route.language) : ''
}
// El hero precede a las cinco secciones observadas. Cuando ninguna entra en la
// banda activa, seguimos en la portada y la marca apunta a `home`.
const OBSERVED_TARGETS = SECTION_TARGETS
const activeSectionListeners = new Set()
let activeSection = 'home'
let activeSectionObserver

const subscribeToActiveSection = (listener) => {
  activeSectionListeners.add(listener)

  if (activeSectionListeners.size === 1 && 'IntersectionObserver' in window) {
    const sections = OBSERVED_TARGETS
      .map((target) => document.getElementById(target))
      .filter(Boolean)

    const visibleSections = new Set()
    activeSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.add(entry.target.id)
        } else {
          visibleSections.delete(entry.target.id)
        }
      })

      // El top se mide AHORA: guardar el de cuando la seccion entro daba
      // desempates con datos viejos.
      const [nextSection] = visibleSections.size
        ? [...visibleSections]
          .map((id) => [id, document.getElementById(id)?.getBoundingClientRect().top ?? Infinity])
          .sort(([, firstTop], [, secondTop]) => Math.abs(firstTop) - Math.abs(secondTop))[0]
        : ['home']

      if (nextSection !== activeSection) {
        activeSection = nextSection
        activeSectionListeners.forEach((notify) => notify())
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

const Nav = () => {
  const { t } = useTranslation()
  const activeSection = useActiveSection()
  const anchorBase = useAnchorBase()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const wasMenuOpenRef = useRef(false)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const documentProgress = useSpring(scrollYProgress, {
    stiffness: 170,
    damping: 32,
    mass: 0.28,
  })
  const brandName = t('header.name').split(/\s+/).slice(0, 2).join(' ')
  const links = SECTION_TARGETS.map((target) => ({
    target,
    label: t(`nav.${target}`),
  }))

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
    <nav className="portfolio-nav" aria-label={t('nav.sections')}>
      <div className="portfolio-nav__inner">
        <a
          href={`${anchorBase}#home`}
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
              href={`${anchorBase}#${target}`}
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
      <motion.span
        className="portfolio-nav__progress"
        aria-hidden="true"
        style={{
          scaleX: shouldReduceMotion ? 1 : documentProgress,
          originX: 0,
        }}
      />
    </nav>
  )
}

export default Nav
