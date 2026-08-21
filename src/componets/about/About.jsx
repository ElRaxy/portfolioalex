import React from 'react'
import { useTranslation } from 'react-i18next'
import './about.css'

const metricItems = ['sites', 'servers', 'months']

const About = () => {
  const { t } = useTranslation()

  return (
    <section id="about" className="about">
      <h2>{t('about.title')}</h2>

      <div className="container about__content">
        <dl className="about__metrics">
          {metricItems.map((metric) => (
            <div className="about__metric" key={metric}>
              <dt>{t(`about.metrics.${metric}.label`)}</dt>
              <dd>{t(`about.metrics.${metric}.value`)}</dd>
            </div>
          ))}
        </dl>

        <div className="about__intro">
          <p>{t('about.p2')}</p>
        </div>

        <p className="about__languages">{t('about.languages')}</p>
      </div>
    </section>
  )
}

export default About
