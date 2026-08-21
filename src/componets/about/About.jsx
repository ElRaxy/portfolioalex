import React from 'react'
import { useTranslation } from 'react-i18next'
import Reveal from '../common/Reveal'
import './about.css'

const About = () => {
  const { t } = useTranslation()

  return (
    <section id="about" className="about">
      <Reveal as="h2">{t('about.title')}</Reveal>

      <Reveal className="about__content">
        <p className="about__lead">{t('about.lead')}</p>

        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
        <p className="about__languages">{t('about.languages')}</p>
      </Reveal>
    </section>
  )
}

export default About
