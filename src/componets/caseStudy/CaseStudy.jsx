import React from 'react'
import { useTranslation } from 'react-i18next'

const CaseStudy = ({ slug }) => {
  const { t, i18n } = useTranslation()
  const titleKey = `case_study.cases.${slug}.title`
  const title = t(titleKey)

  if (typeof title !== 'string' || title === titleKey) return null

  const tagline = t(`case_study.cases.${slug}.tagline`)
  const summary = t(`case_study.cases.${slug}.summary`)
  const problema = t(`case_study.cases.${slug}.problem`, { returnObjects: true }) || []
  const decisions = t(`case_study.cases.${slug}.decisions`, { returnObjects: true }) || []
  const results = t(`case_study.cases.${slug}.results`, { returnObjects: true }) || []
  const note = t(`case_study.cases.${slug}.note`)
  const backHref = i18n.language.startsWith('en') ? '/en/' : '/'

  return (
    <article className="case">
      <a className="case__back" href={backHref}>{t('case_study.back')}</a>

      <header className="case__header">
        <h1>{title}</h1>
        <p className="case__tagline">{tagline}</p>
        <p className="case__summary">{summary}</p>
      </header>

      <section className="case__block">
        <h2>{t('case_study.problem_label')}</h2>
        {problema.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      <section className="case__block">
        <h2>{t('case_study.decisions_label')}</h2>
        <ol className="case__decisions">
          {decisions.map((decision, index) => (
            <li className="case__decision" key={`${decision.title}-${index}`}>
              <h3>{decision.title}</h3>
              <p>{decision.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="case__block">
        <h2>{t('case_study.results_label')}</h2>
        <ul className="case__results">
          {results.map((result, index) => (
            <li
              className="case__result"
              key={`${result.value}-${result.label}-${index}`}
            >
              <span className="case__result-value">{result.value}</span>
              {/* Evita que un extractor una el valor y la etiqueta. */}
              {' '}
              <span className="case__result-label">{result.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="case__note">{note}</p>
    </article>
  )
}

export default CaseStudy
