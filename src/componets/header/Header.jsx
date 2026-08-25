import React from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import alexHeadshot from '../../assets/alex-headshot.jpg'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'
import { SidebarNav } from '../nav/Nav'

// En una pagina de caso el h1 es el titulo del caso, asi que el nombre baja a
// parrafo para que el documento conserve un solo titulo principal.
const Header = ({ nameAs = 'h1' }) => {
  const { t } = useTranslation()
  const name = t('header.name')

  return (
    <header id="home" className="hero">
      <div className="hero__portrait" aria-hidden="true">
        <img src={alexHeadshot} alt="" width="240" height="240" />
      </div>

      <div className="hero__intro">
        <p className="hero__title">{t('header.title')}</p>
        {React.createElement(
          nameAs,
          { className: 'hero__name' },
          name,
        )}
        <p className="hero__tagline">{t('header.tagline')}</p>
        <CTA />
      </div>

      <SidebarNav />

      <div className="hero__meta">
        <HeaderSocials />
        <p className="hero__availability">{t('header.availability')}</p>
      </div>
    </header>
  )
}

export default Header
