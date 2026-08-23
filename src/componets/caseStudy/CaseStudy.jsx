import React from 'react'
import { useTranslation } from 'react-i18next'
import ProjectDiagram from '../portfolio/ProjectDiagram'
import TypewriterTerminal from '../portfolio/TypewriterTerminal'

const CaseStudy = ({ slug }) => {
  const { t, i18n } = useTranslation()
  const titleKey = `case_study.cases.${slug}.title`
  const title = t(titleKey)

  if (typeof title !== 'string' || title === titleKey) return null

  // Ambito de los dos bloques cuyos pasajes viajan sin sujeto: las decisiones
  // y los numeros. Un extractor levanta "174 tests" o "Los duplicados los corta
  // la base de datos" sueltos, y ni el rotulo ni el cuerpo decian de que
  // proyecto hablaban. El resumen, el problema y el hueco si se nombran en su
  // propia prosa, asi que ahi el ambito seria repeticion. Va en nominativo y
  // sin articulo: es una etiqueta, no parte de una frase.
  const scope = t(`case_study.cases.${slug}.scope`)
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
  const card = projects.find((project) => project.slug === slug)
  const links = card?.links || []
  const backHref = i18n.language.startsWith('en') ? '/en/' : '/'

  return (
    <article className="case">
      <a className="case__back" href={backHref}>{t('case_study.back')}</a>

      <header className="case__header">
        <h1>{title}</h1>
        <p className="case__tagline">{tagline}</p>
      </header>

      <section className="case__block case__block--summary">
        <h2>{t('case_study.summary_label')}</h2>
        <p className="case__summary">{summary}</p>

        {/* Atalaya ensena su terminal; los otros tres, el diagrama de la
            tarjeta. Es el mismo artefacto que ya hay en la portada, no uno
            nuevo: la pagina que profundiza no puede ser la unica sin nada
            que mirar. */}
        <div className="case__artifact">
          {slug === 'atalaya'
            ? <TypewriterTerminal />
            : <ProjectDiagram slug={slug} label={card?.image_alt} />}
        </div>
      </section>

      <section className="case__block">
        <h2>{t('case_study.problem_label')}</h2>
        {problema.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      {gapParrafos.length > 0 && (
        <section className="case__block">
          <h2>{t('case_study.gap_label')}</h2>
          {gapParrafos.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
      )}

      <section className="case__block">
        <h2>
          <span className="case__scope">{scope}</span>
          {/* Espacio de verdad: sin el, un extractor pega el ambito al rotulo. */}
          {' '}
          {t('case_study.decisions_label')}
        </h2>
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
        <h2>
          <span className="case__scope">{scope}</span>
          {/* Espacio de verdad: sin el, un extractor pega el ambito al rotulo. */}
          {' '}
          {t('case_study.results_label')}
        </h2>
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
