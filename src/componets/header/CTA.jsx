import React from 'react'
import { useTranslation } from 'react-i18next'
import CV from '../../assets/cv.pdf'

const CTA = () => {
  const { t } = useTranslation()

  return (
    <div className="hero__actions">
      <a href="#portfolio" className="hero__button hero__button--projects">
        {t('nav.portfolio')}
      </a>
      <a href={CV} download className="hero__button">
        {t('header.download_cv')}
      </a>
    </div>
  )
}

export default CTA
