import React from 'react'
import { useTranslation } from 'react-i18next'
import './about.css'

// Sin Reveal a proposito: este bloque es el primero del contenido y en movil
// entra en el primer viewport, asi que es el elemento LCP. Con Motion nacia
// con opacity:0 inline en el prerender y no se pintaba hasta hidratar; su
// entrada vive ahora en el CSS, que llega antes que el bundle.
const About = () => {
  const { t } = useTranslation()
  const facts = t('about.facts', { returnObjects: true }) || []

  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <h2 id="about-title" className="about__title">{t('about.title')}</h2>

      <div className="about__content">
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
      </div>
    </section>
  )
}

export default About
