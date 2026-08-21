import React from 'react'
import { Link } from 'react-scroll'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../language/LanguageSelector'
import ThemeToggle from '../theme/ThemeToggle'
import './nav.css'

const Nav = () => {
  const { t } = useTranslation()
  const brandName = t('header.name').split(/\s+/).slice(0, 2).join(' ')
  const links = [
    { target: 'home', label: t('nav.home') },
    { target: 'portfolio', label: t('nav.portfolio') },
    { target: 'stack', label: t('nav.stack') },
    { target: 'about', label: t('nav.about') },
    { target: 'contact', label: t('nav.contact') },
  ]

  return (
    <nav className="portfolio-nav">
      <div className="portfolio-nav__inner">
        <Link
          to="home"
          href="#home"
          smooth={true}
          offset={-64}
          duration={0}
          className="portfolio-nav__brand"
        >
          {brandName}
        </Link>

        <div className="portfolio-nav__links">
          {links.map(({ target, label }) => (
            <Link
              key={target}
              to={target}
              href={`#${target}`}
              spy={true}
              smooth={true}
              offset={-64}
              duration={0}
              activeClass="portfolio-nav__link--active"
              className="portfolio-nav__link"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="portfolio-nav__controls">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

export default Nav
