import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'

export const INTRO_SESSION_KEY = 'portfolio:identity-intro'

const Header = () => {
  const { t } = useTranslation()
  const heroRef = useRef(null)
  const introClaimed = useRef(false)

  useEffect(() => {
    const hero = heroRef.current
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!hero || !hero.animate || preference?.matches) return undefined
    // Storage denial leaves the static identity intact rather than repeating an intro.
    try {
      if (!introClaimed.current) {
        if (window.sessionStorage.getItem(INTRO_SESSION_KEY)) return undefined
        window.sessionStorage.setItem(INTRO_SESSION_KEY, 'seen')
        introClaimed.current = true
      }
    } catch { return undefined }

    const animations = []
    hero.querySelectorAll('.hero__word-text').forEach((word, index) => {
      animations.push(word.animate([
        { transform: `translate3d(${index ? '-12%' : '12%'}, 110%, 0) rotate(${index ? -3 : 3}deg)` },
        { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
      ], { duration: 750, delay: index * 100, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }))
    })
    hero.querySelectorAll('.hero__title, .hero__tagline, .hero__actions, .hero__signature').forEach((element, index) => {
      animations.push(element.animate([
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 350, delay: 400 + index * 80, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }))
    })
    const cancel = () => animations.forEach((animation) => animation.cancel())
    const onPreferenceChange = (event) => { if (event.matches) cancel() }
    preference?.addEventListener?.('change', onPreferenceChange)
    return () => {
      cancel()
      preference?.removeEventListener?.('change', onPreferenceChange)
    }
  }, [])

  return (
    <header id="home" className="hero" ref={heroRef}>
      <div className="hero__copy">
        <div className="hero__intro">
          <h1 className="hero__name" aria-label={t('header.name')}>
            <span className="hero__word"><span className="hero__word-text">Alex</span></span>{' '}
            <span className="hero__word"><span className="hero__word-text">Micó</span></span>
          </h1>
          <p className="hero__title">{t('header.title')}</p>
          <p className="hero__tagline">{t('header.tagline')}</p>
        </div>
        <CTA />
        <div className="hero__signature">
          <p className="hero__availability">{t('header.availability')}</p>
          <HeaderSocials />
        </div>
      </div>
    </header>
  )
}

export default Header
