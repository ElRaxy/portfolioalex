import React from 'react'
import { useTranslation } from 'react-i18next'
import './services.css'
import { FaGraduationCap, FaLanguage, FaFolderOpen } from 'react-icons/fa'

const Services = () => {
  const { t } = useTranslation();

  const services = [
    {
      title: t('services.education.title'),
      description: t('services.education.description'),
      details: t('services.education.details', { returnObjects: true }),
      icon: <FaGraduationCap />
    },
    {
      title: t('services.languages.title'),
      description: t('services.languages.description'),
      details: t('services.languages.details', { returnObjects: true }),
      icon: <FaLanguage />
    },
    {
      title: t('services.projects.title'),
      description: t('services.projects.description'),
      details: t('services.projects.details', { returnObjects: true }),
      icon: <FaFolderOpen />
    },
  ];

  return (
    <section id="services">
      <h5>{t('services.subtitle')}</h5>
      <h2>{t('services.title')}</h2>

      <div className="container services__container">
        {services.map((service, index) => (
          <article key={index} className="service">
            <div className="service__head">
              <h3>{service.title}</h3>
              <div className="service__icon">{service.icon}</div>
            </div>
            <p className="service__description">{service.description}</p>
            <ul className="service__list">
              {service.details.map((detail, idx) => (
                <li key={idx}>
                  <span className="service__list-icon">✓</span>
                  <p>{detail}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Services
