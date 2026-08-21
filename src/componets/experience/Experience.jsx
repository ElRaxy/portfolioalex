import React from 'react'
import { useTranslation } from 'react-i18next'
import { RevealGroup, RevealItem } from '../common/Reveal'
import './experience.css'

const stackGroups = ['frontend', 'backend', 'ai', 'python', 'devops', 'scale']

const TimelineList = ({ entries }) => (
  <RevealGroup as="ul" className="timeline">
    {entries.map((entry) => (
      <RevealItem
        as="li"
        key={entry.role}
        className={`timeline__item${entry.current ? ' is-current' : ''}`}
      >
        <span className="timeline__dot" aria-hidden="true" />
        <div className="timeline__head">
          <span className="timeline__role">{entry.role}</span>
          <span className="timeline__when">{entry.when}</span>
        </div>
        <p className="timeline__org">{entry.org}</p>
        {entry.bullets?.length > 0 && (
          <ul className="timeline__bullets">
            {entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        )}
      </RevealItem>
    ))}
  </RevealGroup>
)

export const ExperienceTimeline = () => {
  const { t } = useTranslation()

  return (
    <section id="experience" className="experience" aria-labelledby="experience-title">
      <h2 id="experience-title">{t('experience.title')}</h2>

      <div className="container experience__content">
        <TimelineList entries={t('experience.roles', { returnObjects: true })} />

        <div className="experience__education">
          <h3>{t('experience.education')}</h3>
          <TimelineList entries={t('experience.studies', { returnObjects: true })} />
        </div>
      </div>
    </section>
  )
}

const Stack = () => {
  const { t } = useTranslation()

  return (
    <section id="stack" className="stack" aria-labelledby="stack-title">
      <h2 id="stack-title">{t('nav.stack')}</h2>

      <RevealGroup className="container stack__grid">
        {stackGroups.map((group) => (
          <RevealItem className="stack__group" key={group}>
            <h3>{t(`stack.${group}.label`)}</h3>
            <ul className="stack__chips">
              {t(`stack.${group}.chips`, { returnObjects: true }).map((chip, index) => (
                <li className={`stack__chip${index === 0 ? ' is-key' : ''}`} key={chip}>{chip}</li>
              ))}
            </ul>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  )
}

export default Stack
