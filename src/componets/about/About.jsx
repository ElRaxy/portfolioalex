import React from 'react'
import { useTranslation } from 'react-i18next'
import './about.css'
import Reveal from '../common/Reveal'

const About = () => {
  const { t } = useTranslation()
  const facts = t('about.facts', { returnObjects: true }) || []

  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <Reveal as="h2" id="about-title" className="about__title">{t('about.title')}</Reveal>

      <Reveal className="about__content" delay={0.06}>
        <p className="about__lead">{t('about.lead')}</p>

        <div className="about__narrative">
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>
        </div>

        {/* Los cuatro datos que se preguntan primero, como lista de
            definiciones: un extractor se los lleva emparejados. */}
        <dl className="about__facts">
          {facts.map((fact) => (
            <div className="about__fact" key={fact.term}>
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  )
}

export default About
