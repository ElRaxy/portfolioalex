import React from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import alexEditorialPortrait from '../../assets/alex-editorial-portrait-v1.webp'
import strevImage from '../../assets/projects/strev-product.png'
import serenoImage from '../../assets/projects/sereno-session-overview.webp'
import CTA from './CTA'
import HeaderSocials from './HeaderSocials'

const Header = () => {
  const { t } = useTranslation()

  return (
    <header id="home" className="hero">
      <div className="hero__copy">
        <p className="hero__title">{t('header.title')}</p>

        <div className="hero__intro">
          <h1 className="hero__name">{t('header.name')}</h1>
          <p className="hero__tagline">{t('header.tagline')}</p>
          <p className="hero__support">{t('header.support')}</p>
        </div>

        <CTA />

        <div className="hero__signature">
          <div className="hero__portrait" aria-hidden="true">
            <img src={alexEditorialPortrait} alt="" width="640" height="800" />
          </div>
          <div className="hero__contact">
            <p className="hero__availability">{t('header.availability')}</p>
            <HeaderSocials />
          </div>
        </div>
      </div>

      <div className="hero__stage" aria-hidden="true">
        <figure className="hero__preview hero__preview--strev">
          <div className="hero__preview-media">
            <img
              src={strevImage}
              alt=""
              width="1440"
              height="900"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
          <figcaption className="hero__preview-caption">Strev</figcaption>
        </figure>

        <figure className="hero__preview hero__preview--sereno">
          <div className="hero__preview-media">
            <img
              src={serenoImage}
              alt=""
              width="1200"
              height="554"
              loading="eager"
              decoding="async"
            />
          </div>
          <figcaption className="hero__preview-caption">Sereno</figcaption>
        </figure>
      </div>
    </header>
  )
}

export default Header
