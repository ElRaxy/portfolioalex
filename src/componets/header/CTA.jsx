import React from 'react'
import { useTranslation } from 'react-i18next'
import CV from '../../assets/cv.pdf'
import { Link } from 'react-scroll'

function CTA() {
  const { t } = useTranslation();

  return (
    <div className="cta">
      <a href={CV} download className="btn">{t('header.download_cv')}</a>
      <Link
        to="contact"
        spy={true}
        smooth={true}
        offset={-80}
        duration={500}
        className="btn btn-primary"
      >
        {t('header.cta')}
      </Link>
    </div>
  )
}

export default CTA
