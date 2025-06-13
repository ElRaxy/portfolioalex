import React from 'react'
import { useTranslation } from 'react-i18next'
import './footer.css'
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { Link } from 'react-scroll'

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer>
      <Link
        to="home"
        spy={true}
        smooth={true}
        offset={-80}
        duration={500}
        className="footer__logo"
      >
        ALEX
      </Link>

      <ul className="permalinks">
        <li><Link to="home" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.home')}</Link></li>
        <li><Link to="about" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.about')}</Link></li>
        <li><Link to="experience" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.experience')}</Link></li>
        <li><Link to="services" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.services')}</Link></li>
        <li><Link to="portfolio" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.portfolio')}</Link></li>
        <li><Link to="testimonials" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.testimonials')}</Link></li>
        <li><Link to="contact" spy={true} smooth={true} offset={-80} duration={500}>{t('nav.contact')}</Link></li>
      </ul>

      <div className="footer__socials">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
      </div>

      <div className="footer__copyright">
        <small>&copy; {t('footer.copyright')}</small>
      </div>
    </footer>
  )
}

export default Footer
