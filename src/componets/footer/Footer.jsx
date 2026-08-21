import React from 'react'
import { useTranslation } from 'react-i18next'
import './footer.css'

const Footer = () => {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="footer__copyright">
        <small>&copy; {t('footer.copyright')}</small>
      </div>
    </footer>
  )
}

export default Footer
