import React from 'react'
import { useTranslation } from 'react-i18next'
import './about.css'

// Sin Reveal a proposito: este bloque es el primero del contenido y en movil
// entra en el primer viewport, asi que es el elemento LCP. Con Motion nacia
// con opacity:0 inline en el prerender y no se pintaba hasta hidratar; su
// entrada vive ahora en el CSS, que llega antes que el bundle.
const About = () => {
  const { t } = useTranslation()

  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <h2 id="about-title" className="about__title">{t('about.title')}</h2>

      <div className="about__content">
        <p className="about__lead">{t('about.lead')}</p>

        <p>{t('about.p2')}</p>
        <p>{t('about.p3')}</p>
        <p className="about__languages">{t('about.languages')}</p>
      </div>
    </section>
  )
}

export default About
