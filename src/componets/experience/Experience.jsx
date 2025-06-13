import React from 'react'
import { useTranslation } from 'react-i18next'
import './experience.css'
import { BsPatchCheckFill } from 'react-icons/bs'

const Experience = () => {
  const { t } = useTranslation();

  const frontendData = [
    {
      title: 'HTML',
      level: t('experience.experienced')
    },
    {
      title: 'CSS',
      level: t('experience.experienced')
    },
    {
      title: 'JavaScript',
      level: t('experience.experienced')
    },
    {
      title: 'React',
      level: t('experience.experienced')
    },
    {
      title: 'Bootstrap',
      level: t('experience.intermediate')
    }
  ]

  const backendData = [
    {
      title: 'Java',
      level: t('experience.experienced')
    },
    {
      title: 'Spring Boot',
      level: t('experience.experienced')
    },
    {
      title: 'MySQL',
      level: t('experience.experienced')
    },
    {
      title: 'REST APIs',
      level: t('experience.experienced')
    },
    {
      title: 'Git',
      level: t('experience.intermediate')
    }
  ]

  return (
    <section id="experience">
      <h5>{t('experience.subtitle')}</h5>
      <h2>{t('experience.title')}</h2>

      <div className="container experience__container">
        <div className="experience__frontend">
          <h3>{t('experience.frontend')}</h3>
          <div className="experience__content">
            {
              frontendData.map((item, index) => (
                <article key={index} className="experience__details">
                  <BsPatchCheckFill className="experience__details-icon" />
                  <div>
                    <h4>{item.title}</h4>
                    <small className="text-light">{item.level}</small>
                  </div>
                </article>
              ))
            }
          </div>
        </div>

        <div className="experience__backend">
          <h3>{t('experience.backend')}</h3>
          <div className="experience__content">
            {
              backendData.map((item, index) => (
                <article key={index} className="experience__details">
                  <BsPatchCheckFill className="experience__details-icon" />
                  <div>
                    <h4>{item.title}</h4>
                    <small className="text-light">{item.level}</small>
                  </div>
                </article>
              ))
            }
          </div>
        </div>
      </div>
    </section>
  )
}

export default Experience
