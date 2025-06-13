import React from 'react'
import { useTranslation } from 'react-i18next'
import './services.css'
import { FaCode, FaRobot } from 'react-icons/fa'

const Services = () => {
  const { t } = useTranslation();

  const services = [
    {
      title: t('services.webdev.title'),
      description: t('services.webdev.description'),
      details: t('services.webdev.details', { returnObjects: true }),
      icon: <FaCode />
    },
    {
      title: t('services.automation.title'),
      description: t('services.automation.description'),
      details: t('services.automation.details', { returnObjects: true }),
      icon: <FaRobot />
    }
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
