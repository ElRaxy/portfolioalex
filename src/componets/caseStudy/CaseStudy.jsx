import React from 'react'
import { useTranslation } from 'react-i18next'

const CaseStudy = ({ slug }) => {
  const { t, i18n } = useTranslation()
  const titleKey = `case_study.cases.${slug}.title`
  const title = t(titleKey)

  if (typeof title !== 'string' || title === titleKey) return null

  // El nombre corto es el que entra en los encabezados: el titulo largo de
  // WordPress ("Automatizacion de WordPress en produccion") no cabe dentro de
  // una frase. Los encabezados nombran el proyecto para que cada seccion se
  // entienda sola cuando alguien (o un LLM) la extrae del resto de la pagina.
  const project = t(`case_study.cases.${slug}.short`)
  const tagline = t(`case_study.cases.${slug}.tagline`)
  const summary = t(`case_study.cases.${slug}.summary`)
  const problema = t(`case_study.cases.${slug}.problem`, { returnObjects: true }) || []
  // Solo lo tiene Atalaya: es el unico de los cuatro que compite con proyectos
  // conocidos, y sin decirlo el caso no responde "por que esto y no aquello".
  const gap = t(`case_study.cases.${slug}.gap`, { returnObjects: true })
  const gapParrafos = Array.isArray(gap) ? gap : []
  const decisions = t(`case_study.cases.${slug}.decisions`, { returnObjects: true }) || []
  const results = t(`case_study.cases.${slug}.results`, { returnObjects: true }) || []
  const note = t(`case_study.cases.${slug}.note`)
  // Los enlaces salen de la tarjeta de la portada, que ya los tiene: un caso
  // que convence y no deja pulsar el codigo pierde al lector en el mejor
  // momento. Los proyectos cerrados no tienen ninguno y no pintan el bloque.
  const projects = t('portfolio.projects', { returnObjects: true }) || []
  const links = projects.find((project) => project.slug === slug)?.links || []
  const backHref = i18n.language.startsWith('en') ? '/en/' : '/'

  return (
    <article className="case">
      <a className="case__back" href={backHref}>{t('case_study.back')}</a>

      <header className="case__header">
        <h1>{title}</h1>
        <p className="case__tagline">{tagline}</p>
      </header>

      <section className="case__block case__block--summary">
        <h2>{t('case_study.summary_label', { project })}</h2>
        <p className="case__summary">{summary}</p>
      </section>

      <section className="case__block">
        <h2>{t('case_study.problem_label', { project })}</h2>
        {problema.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      {gapParrafos.length > 0 && (
        <section className="case__block">
          <h2>{t('case_study.gap_label')}</h2>
          {gapParrafos.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      )}

      <section className="case__block">
        <h2>{t('case_study.decisions_label', { project })}</h2>
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
        <h2>{t('case_study.results_label', { project })}</h2>
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

      {links.length > 0 && (
        <nav className="case__links" aria-label={t('case_study.links_label')}>
          {links.map((link) => (
            <a
              className="case__link"
              href={link.url}
              key={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </article>
  )
}

export default CaseStudy
