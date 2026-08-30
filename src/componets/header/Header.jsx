import React from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import alexHeadshot from '../../assets/alex-headshot.jpg'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'

const Header = () => {
  const { t } = useTranslation()

  return (
    <header id="home" className="hero">
      <div className="hero__identity">
        <p className="hero__title">{t('header.title')}</p>

        <div className="hero__intro">
          <h1 className="hero__name">{t('header.name')}</h1>
          <p className="hero__tagline">{t('header.tagline')}</p>
        </div>
      </div>

      <div className="hero__footer">
        <div className="hero__meta">
          <div className="hero__profile">
            <div className="hero__portrait" aria-hidden="true">
              <img src={alexHeadshot} alt="" width="240" height="240" />
            </div>
            <p className="hero__availability">{t('header.availability')}</p>
          </div>
          <CTA />
          <HeaderSocials />
        </div>
      </div>
    </header>
  )
}

export default Header
