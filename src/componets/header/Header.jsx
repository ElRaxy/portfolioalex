import React from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import CTA from './CTA'
import HeroGrid from './HeroGrid'
import HeaderSocials from './HeaderSocials'
import { SidebarNav } from '../nav/Nav'

const Header = () => {
  const { t } = useTranslation()
  const name = t('header.name')

  return (
    <header id="home" className="hero">
      <HeroGrid />

      <div className="hero__intro">
        <h1 className="hero__name" aria-label={name}>
          {Array.from(name).map((character, index) => (
            <span
              className="hero__char"
              aria-hidden="true"
              style={{ '--i': index }}
              key={`${character}-${index}`}
            >
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
