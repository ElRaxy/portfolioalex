import React from 'react'
import { useTranslation } from 'react-i18next'
import Reveal from '../common/Reveal'
import './about.css'

const About = () => {
  const { t } = useTranslation()
  const facts = t('about.facts', { returnObjects: true })

  return (
    <section id="about" className="about">
      <Reveal as="h2">{t('about.title')}</Reveal>

      <Reveal className="about__content">
        <p className="about__lead">{t('about.lead')}</p>

        <ul className="about__facts">
          {facts.map((fact) => (
            <li className="about__fact" key={fact.label}>
              <b>{fact.value}</b>
              <span>{fact.label}</span>
            </li>
          ))}
        </ul>

        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
        <p className="about__languages">{t('about.languages')}</p>
      </Reveal>
    </section>
  )
}

export default About
