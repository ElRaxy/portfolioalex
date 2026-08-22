import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { FaBars, FaTimes } from 'react-icons/fa'
import LanguageSelector from '../language/LanguageSelector'
import { parseRoute, homeHref } from '../../lib/routing'
import ThemeToggle from '../theme/ThemeToggle'
import './nav.css'

const SIDEBAR_TARGETS = ['about', 'portfolio', 'experience', 'stack', 'contact']

// Dentro de una pagina de caso las secciones no existen: el ancla suelta no
// llevaria a ninguna parte, asi que se prefija con la home de ese idioma.
const useAnchorBase = () => {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname
  const route = parseRoute(pathname)
  return route.kind === 'case' ? homeHref(route.language) : ''
}
// `home` NO se observa: vive dentro del panel lateral pegajoso, asi que su
// getBoundingClientRect().top se queda clavado en 0 por mucho que bajes. Como
// el activo se elige por el |top| mas pequeno, ganaba siempre y no se marcaba
// ninguna seccion jamas. Cuando ninguna de las cinco esta en la banda, es que
// seguimos en el hero.
const OBSERVED_TARGETS = SIDEBAR_TARGETS
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

export const SidebarNav = () => {
  const { t } = useTranslation()
  const activeSection = useActiveSection()
  const anchorBase = useAnchorBase()
  const progressRef = useRef(null)

  useLayoutEffect(() => {
    const animationQuery = window.matchMedia(
      '(min-width: 1025px) and (prefers-reduced-motion: no-preference)',
    )
    let ctx
    let loading = false
    let cancelled = false

    const loadScrollProgress = () => {
      if (!animationQuery.matches || loading || ctx) return

      loading = true
      Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]).then(([{ gsap }, { ScrollTrigger }]) => {
        loading = false
        if (cancelled || !animationQuery.matches) return

        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          const media = gsap.matchMedia()

          media.add(
            '(min-width: 1025px) and (prefers-reduced-motion: no-preference)',
            () => {
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
            },
          )

          return () => media.revert()
        })
      }).catch(() => {
        loading = false
      })
    }

    loadScrollProgress()
    animationQuery.addEventListener('change', loadScrollProgress)

    return () => {
      cancelled = true
      animationQuery.removeEventListener('change', loadScrollProgress)
      ctx?.revert()
    }
  }, [])

  return (
    <nav className="sidebar-nav" aria-label={t('nav.sections')}>
      <span className="sidebar-nav__progress" aria-hidden="true" ref={progressRef} />
      <ul className="sidebar-nav__list">
        {SIDEBAR_TARGETS.map((target) => (
          <li key={target}>
            <a
              href={`${anchorBase}#${target}`}
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
  const anchorBase = useAnchorBase()
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
    </nav>
  )
}

export default Nav
