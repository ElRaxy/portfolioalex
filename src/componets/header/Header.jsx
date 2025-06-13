import React from 'react'
import { Link } from 'react-scroll'
import { useTranslation } from 'react-i18next'
import './header.css'
import CTA from './CTA'
import ME from '../../assets/profile-img-remove.png'
import HeaderSocials from './HeaderSocials'

const Header = () => {
  const { t } = useTranslation();

  return (
    <header id="home">
      <div className="container header__container">
        <h5>{t('header.greeting')}</h5>
        <h1>{t('header.name')}</h1>
        <h5 className="text-light">{t('header.title')}</h5>
        <CTA />
        <HeaderSocials />

        <div className="me">
          <img src={ME} alt="me" />
        </div>

        <Link to="contact" className="scroll__down">
          {t('header.cta')}
        </Link>
      </div>
    </header>
  )
}

export default Header
