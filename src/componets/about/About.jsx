import React from 'react'
import { useTranslation } from 'react-i18next'
import './about.css'

const timelineItems = [
  'full_stack',
  'it_support',
  'daw',
  'smr'
]

const About = () => {
  const { t } = useTranslation()

  return (
    <section id="about" className="about">
      <h2>{t('about.title')}</h2>

      <div className="container about__content">
        <div className="about__intro">
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
        </div>

        <ul className="about__timeline">
          {timelineItems.map((item) => (
            <li key={item}>{t(`about.timeline.${item}`)}</li>
          ))}
        </ul>

        <p className="about__languages">{t('about.languages')}</p>
      </div>
    </section>
  )
}

export default About
