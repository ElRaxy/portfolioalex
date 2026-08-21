import React from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'
import { SidebarNav } from '../nav/Nav'

const Header = () => {
  const { t } = useTranslation()

  return (
    <header id="home" className="hero">
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
