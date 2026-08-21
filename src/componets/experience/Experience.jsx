import React from 'react'
import { useTranslation } from 'react-i18next'
import './experience.css'

const stackGroups = ['frontend', 'backend', 'ai', 'python', 'devops', 'scale']

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
