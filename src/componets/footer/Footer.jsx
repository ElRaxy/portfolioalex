import React from 'react'
import { useTranslation } from 'react-i18next'
import './footer.css'

const REPO_URL = 'https://github.com/ElRaxy/portfolioalex'
const EMAIL = 'alexmico2006@gmail.com'

const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="site-footer__cta">
        <p className="site-footer__availability">{t('footer.availability')}</p>
        <a className="site-footer__mail" href={`mailto:${EMAIL}`}>{t('footer.cta')}</a>
      </div>

      <div className="site-footer__legal">
        <small>{t('footer.built')}</small>
        <small>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t('footer.source')}</a>
        </small>
      </div>
    </footer>
  )
}

export default Footer
