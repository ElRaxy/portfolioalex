import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'
import './header.css'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'
import { SidebarNav } from '../nav/Nav'

const Header = () => {
  const { t } = useTranslation()
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
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
            '.hero__name, .hero__title, .hero__tagline, .hero__actions, .hero__socials',
            from,
            to,
          )
      })

      return () => media.revert()
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <header id="home" className="hero" ref={rootRef}>
      <div className="hero__intro">
        <h1 className="hero__name">{t('header.name')}</h1>
        <p className="hero__title">{t('header.title')}</p>
        <p className="hero__tagline">{t('header.tagline')}</p>
        <CTA />
      </div>

      <SidebarNav />
      <HeaderSocials />
    </header>
  )
}

export default Header
