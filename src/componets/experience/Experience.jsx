import React from 'react'
import { useTranslation } from 'react-i18next'
import './experience.css'

const stackGroups = ['frontend', 'backend', 'ai', 'python', 'devops', 'scale']
const professionalItems = ['full_stack', 'it_support']
const educationItems = ['daw', 'smr']

export const ExperienceTimeline = () => {
  const { t } = useTranslation()

  return (
    <section className="experience" aria-labelledby="experience-title">
      <h2 id="experience-title">{t('experience.title')}</h2>

      <div className="container experience__content">
        <ul className="experience__timeline">
          {professionalItems.map((item) => (
            <li key={item}>{t(`about.timeline.${item}`)}</li>
          ))}
        </ul>

        <div className="experience__education">
          <h3>{t('experience.education')}</h3>
          <ul className="experience__timeline">
            {educationItems.map((item) => (
              <li key={item}>{t(`about.timeline.${item}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const Stack = () => {
  const { t } = useTranslation()

  return (
    <section id="stack" className="stack">
      <h2>{t('nav.stack')}</h2>

      <div className="container stack__grid">
        {stackGroups.map((group) => (
          <div className="stack__group" key={group}>
            <h4>{t(`stack.${group}.label`)}</h4>
            <p>{t(`stack.${group}.items`)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Stack
