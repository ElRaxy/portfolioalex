import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import CTA from './CTA'
import HeroGrid from './HeroGrid'
import HeaderSocials from './HeaderSocials'
import { SidebarNav } from '../nav/Nav'

const Header = () => {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const name = t('header.name')

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let ctx
    let cancelled = false

    import('gsap').then(({ gsap }) => {
      if (cancelled) return

      ctx = gsap.context(() => {
        const media = gsap.matchMedia()
        const from = { y: 20, opacity: 0 }
        const to = {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
        }

        media.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.timeline()
            .fromTo(
              '.hero__char',
              { opacity: 0, y: 18, filter: 'blur(6px)' },
              {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.5,
                ease: 'power3.out',
                stagger: 0.035,
              },
            )
            .fromTo(
              '.hero__title, .hero__tagline, .hero__actions, .hero__socials',
              from,
              to,
            )
        })

        return () => media.revert()
      }, rootRef)
    }).catch(() => undefined)

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <header id="home" className="hero" ref={rootRef}>
      <HeroGrid />

      <div className="hero__intro">
        <h1 className="hero__name" aria-label={name}>
          {Array.from(name).map((character, index) => (
            <span className="hero__char" aria-hidden="true" key={`${character}-${index}`}>
              {character === ' ' ? '\u00a0' : character}
            </span>
          ))}
        </h1>
        <p className="hero__title">{t('header.title')}</p>
        <p className="hero__tagline">{t('header.tagline')}</p>
        <CTA />
      </div>

      <SidebarNav />
      <HeaderSocials />

      <p className="hero__availability">
        <span className="hero__availability-dot" aria-hidden="true" />
        {t('header.availability')}
      </p>
    </header>
  )
}

export default Header
