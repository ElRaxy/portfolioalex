import React from 'react'
import { useTranslation } from 'react-i18next'
import './about.css'
import ME from '../../assets/profile-img.jpg'
import { FaAward } from 'react-icons/fa'
import { FiUsers } from 'react-icons/fi'
import { VscFolderLibrary } from 'react-icons/vsc'
import { Link } from 'react-scroll'

const About = () => {
  const { t } = useTranslation();

  return (
    <section id="about">
      <h5>{t('about.subtitle')}</h5>
      <h2>{t('about.title')}</h2>

      <div className="container about__container">
        <div className="about__me">
          <div className="about__me-image">
            <img src={ME} alt="About" />
          </div>
        </div>

        <div className="about__content">
          <div className="about__cards">
            <article className="about__card">
              <FaAward className="about__icon" />
              <h5>{t('experience.strengths.title')}</h5>
              <small>{t('experience.strengths.logic')}</small>
              <small>{t('experience.strengths.teamwork')}</small>
              <small>{t('experience.strengths.detail')}</small>
            </article>

            <article className="about__card">
              <FiUsers className="about__icon" />
              <h5>{t('experience.differentiator.title')}</h5>
              <small>{t('experience.differentiator.perfectionist')}</small>
              <small>{t('experience.differentiator.quality')}</small>
              <small>{t('experience.differentiator.real_projects')}</small>
            </article>

            <article className="about__card">
              <VscFolderLibrary className="about__icon" />
              <h5>{t('about.experience')}</h5>
              <small>{t('about.years_approx')}</small>
            </article>
          </div>

          <p>{t('about.description')}</p>

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
      </div>
    </section>
  )
}

export default About
