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
      title: 'React Hooks',
      level: t('experience.experienced')
    },
    {
      title: 'React Router',
      level: t('experience.intermediate')
    },
    {
      title: 'Axios',
      level: t('experience.intermediate')
    },
    {
      title: 'React',
      level: t('experience.experienced')
    },
    {
      title: 'Git',
      level: t('experience.intermediate')
    },
  ]

  const backendData = [
    {
      title: 'Node.js',
      level: t('experience.experienced')
    },
    {
      title: 'Express',
      level: t('experience.experienced')
    },
    {
      title: 'MongoDB (Mongoose)',
      level: t('experience.experienced')
    },
    {
      title: 'MySQL',
      level: t('experience.experienced')
    },
    {
      title: 'JWT + bcrypt + Cookies',
      level: t('experience.experienced')
    },
    {
      title: 'Claude API (Anthropic SDK)',
      level: t('experience.experienced')
    },
    {
      title: 'Python',
      level: t('experience.intermediate')
    },
    {
      title: 'Linux / Ubuntu Server',
      level: t('experience.intermediate')
    },
    {
      title: 'Apache2 / Nginx / DNS',
      level: t('experience.intermediate')
    },
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
