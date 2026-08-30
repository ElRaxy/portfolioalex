import React from 'react'
import { useTranslation } from 'react-i18next'
import { RevealGroup, RevealItem } from '../common/Reveal'
import './experience.css'

const stackGroups = ['product', 'automation', 'quality']

const TimelineList = ({ entries, headingLevel, identity }) => {
  const EntryHeading = headingLevel === 4 ? 'h4' : 'h3'

  return (
    <RevealGroup as="ul" className="timeline">
      {entries.map((entry, index) => (
        <RevealItem
          as="li"
          key={`${identity}-${index}`}
          className={`timeline__item${entry.current ? ' is-current' : ''}`}
        >
          <span className="timeline__dot" aria-hidden="true" />
          <div className="timeline__head">
            <EntryHeading className="timeline__role">{entry.role}</EntryHeading>
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
}

export const ExperienceTimeline = () => {
  const { t } = useTranslation()

  return (
    <section id="experience" className="experience" aria-labelledby="experience-title">
      <h2 id="experience-title">{t('experience.title')}</h2>

      <div className="container experience__content">
        <TimelineList
          entries={t('experience.roles', { returnObjects: true })}
          headingLevel={3}
          identity="role"
        />

        <div className="experience__education">
          <h3>{t('experience.education')}</h3>
          <TimelineList
            entries={t('experience.studies', { returnObjects: true })}
            headingLevel={4}
            identity="study"
          />
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
      {/* El primero de cada fila iba en color de acento y nada decia por que. */}
      <p className="stack__note">{t('stack.key_note')}</p>

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
