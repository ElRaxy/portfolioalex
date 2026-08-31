import React from 'react'
import { useTranslation } from 'react-i18next'
import { homeHref } from '../../lib/routing'
import saveMyMoneyNowImage from '../../assets/projects/savemymoneynow-detection.png'
import strevImage from '../../assets/projects/strev-product.png'
import atalayaImage from '../../assets/projects/atalaya-health.svg'
import serenoImage from '../../assets/projects/sereno-session-overview.webp'

const CASE_MEDIA = {
  savemymoneynow: {
    src: saveMyMoneyNowImage,
    width: 914,
    height: 911,
  },
  strev: {
    src: strevImage,
    width: 1440,
    height: 900,
  },
  atalaya: {
    src: atalayaImage,
    width: 1200,
    height: 675,
  },
  sereno: {
    src: serenoImage,
    width: 1560,
    height: 720,
  },
}

const CaseStudy = ({ language, slug }) => {
  const { t } = useTranslation()
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
  // Solo lo tiene Atalaya: es el unico de los casos actuales que compite con proyectos
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
  const media = CASE_MEDIA[slug]
  const mediaLabel = card?.image_alt || title
  const mediaCaption = card?.image_caption || title
  const backHref = `${homeHref(language)}#portfolio`
  const isPrimary = slug === 'strev' || slug === 'sereno'
  const mediaFigure = media && (
    <figure className={`case__media case__media--${slug}`}>
      <div className="case__media-frame">
        <img
          src={media.src}
          alt={mediaLabel}
          width={media.width}
          height={media.height}
          loading="eager"
          decoding="async"
        />
      </div>
      <figcaption>{mediaCaption}</figcaption>
    </figure>
  )

  return (
    <article className="case">
      <a className="case__back" href={backHref}>{t('case_study.back')}</a>

      <header
        aria-label={isPrimary ? title : undefined}
        className={`case__header case__header--${slug}${isPrimary ? ' case__header--primary' : ''}`}
        role={isPrimary ? 'group' : undefined}
      >
        {isPrimary ? (
          <>
            <div className="case__header-copy">
              <h1>{title}</h1>
              <p className="case__tagline">{tagline}</p>
            </div>
            {mediaFigure}
          </>
        ) : (
          <>
            <h1>{title}</h1>
            <p className="case__tagline">{tagline}</p>
          </>
        )}
      </header>

      <section className="case__block case__block--summary">
        <h2>{t('case_study.summary_label')}</h2>
        <p className="case__summary">{summary}</p>

        {!isPrimary && mediaFigure}
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
        <h2 aria-label={t('case_study.decisions_label')}>
          <span aria-hidden="true" className="case__scope">{scope}</span>
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
        <h2 aria-label={t('case_study.results_label')}>
          <span aria-hidden="true" className="case__scope">{scope}</span>
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
              rel="noopener noreferrer"
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
