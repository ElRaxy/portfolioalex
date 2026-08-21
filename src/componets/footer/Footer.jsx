import React from 'react'
import { useTranslation } from 'react-i18next'
import './footer.css'
import { FaGithub } from 'react-icons/fa'
import { MdOutlineEmail } from 'react-icons/md'
import { BsWhatsapp } from 'react-icons/bs'
import { Link } from 'react-scroll'

const Footer = () => {
  const { t } = useTranslation()
  const links = [
    { target: 'home', label: t('nav.home') },
    { target: 'portfolio', label: t('nav.portfolio') },
    { target: 'stack', label: t('nav.stack') },
    { target: 'about', label: t('nav.about') },
    { target: 'contact', label: t('nav.contact') },
  ]

  return (
    <footer>
      <div className="footer__logo">ALEX</div>

      <ul className="permalinks">
        {links.map(({ target, label }) => (
          <li key={target}>
            <Link
              to={target}
              href={`#${target}`}
              spy={true}
              smooth={true}
              offset={-64}
              duration={0}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="footer__socials">
        <a href="https://github.com/ElRaxy" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <FaGithub aria-hidden="true" />
        </a>
        <a href="mailto:alexmico2006@gmail.com" aria-label={t('contact.email')}>
          <MdOutlineEmail aria-hidden="true" />
        </a>
        <a href="https://wa.me/34693912460" target="_blank" rel="noopener noreferrer" aria-label={t('contact.whatsapp')}>
          <BsWhatsapp aria-hidden="true" />
        </a>
      </div>

      <div className="footer__copyright">
        <small>&copy; {t('footer.copyright')}</small>
      </div>
    </footer>
  )
}

export default Footer
