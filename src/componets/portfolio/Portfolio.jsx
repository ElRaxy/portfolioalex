import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { caseHref } from '../../lib/routing'
import Reveal, { RevealGroup, RevealItem } from '../common/Reveal'
import ProjectDiagram from './ProjectDiagram'
import TypewriterTerminal from './TypewriterTerminal'
import './portfolio.css'

const ATALAYA_METRICS = [
  { key: 'jobBoards', value: 7, labelKey: 'job_boards' },
  { key: 'tests', value: 162, labelKey: 'passing_tests' },
  { key: 'commands', value: 13, labelKey: 'commands' },
]

const FeaturedMetrics = () => {
  const { t } = useTranslation()
  const metricsRef = useRef(null)
  const numberRefs = useRef([])
  const hasCountedRef = useRef(false)

  useLayoutEffect(() => {
    const metricsElement = metricsRef.current
    if (!metricsElement) return undefined

    const writeValues = (values) => {
      ATALAYA_METRICS.forEach((metric, index) => {
        if (numberRefs.current[index]) {
          numberRefs.current[index].textContent = Math.round(values[metric.key])
        }
      })
    }

    const finalValues = Object.fromEntries(
      ATALAYA_METRICS.map((metric) => [metric.key, metric.value]),
    )

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hasCountedRef.current = true
      writeValues(finalValues)
      return undefined
    }

    let ctx
    let cancelled = false

    import('gsap').then(({ gsap }) => {
      if (cancelled) return

      ctx = gsap.context(() => {
        const media = gsap.matchMedia()

        media.add('(prefers-reduced-motion: no-preference)', () => {
          if (hasCountedRef.current) {
            writeValues(finalValues)
            return undefined
          }

          const counter = Object.fromEntries(
            ATALAYA_METRICS.map((metric) => [metric.key, 0]),
          )
          let tween

          const startCount = () => {
            if (tween || hasCountedRef.current) return

            writeValues(counter)
            tween = gsap.to(counter, {
              ...finalValues,
              duration: 1.1,
              ease: 'power2.out',
              onUpdate: () => writeValues(counter),
              onComplete: () => {
                hasCountedRef.current = true
                writeValues(finalValues)
              },
            })
          }

          if (!('IntersectionObserver' in window)) {
            startCount()
            return () => tween?.kill()
          }

          const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return

            observer.disconnect()
            startCount()
          }, { threshold: 0.3 })

          observer.observe(metricsElement)

          return () => {
            observer.disconnect()
            tween?.kill()
          }
        })

        return () => media.revert()
      }, metricsElement)
    }).catch(() => undefined)

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <ul className="portfolio__metrics" ref={metricsRef}>
      {ATALAYA_METRICS.map((metric, index) => (
        <li className="portfolio__metric" key={metric.key}>
          <span
            className="portfolio__metric-value"
            ref={(node) => { numberRefs.current[index] = node }}
          >
            {metric.value}
          </span>
          {/* El espacio no es decorativo: sin el, un extractor de texto lee
              "8job boards". Los dos span son de bloque, no se ve. */}
          {' '}
          <span className="portfolio__metric-label">
            {t(`portfolio.metrics.${metric.labelKey}`)}
          </span>
        </li>
      ))}
    </ul>
  )
}

const usePointerSpotlight = (rootRef) => {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const pointerQuery = window.matchMedia(
      '(hover: hover) and (prefers-reduced-motion: no-preference)',
    )
    let cards = []
    let frameId
    let latestPointer

    const updateSpotlight = () => {
      frameId = undefined
      if (!latestPointer) return

      const { element, clientX, clientY } = latestPointer
      const bounds = element.getBoundingClientRect()
      element.style.setProperty('--mx', `${clientX - bounds.left}px`)
      element.style.setProperty('--my', `${clientY - bounds.top}px`)
    }

    const handlePointerMove = (event) => {
      latestPointer = {
        element: event.currentTarget,
        clientX: event.clientX,
        clientY: event.clientY,
      }

      if (frameId === undefined) {
        frameId = window.requestAnimationFrame(updateSpotlight)
      }
    }

    const removeListeners = () => {
      cards.forEach((card) => card.removeEventListener('pointermove', handlePointerMove))
      cards = []
      latestPointer = undefined

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId)
        frameId = undefined
      }
    }

    const updateListeners = () => {
      removeListeners()
      if (!pointerQuery.matches) return

      cards = Array.from(root.querySelectorAll('.portfolio__featured, .portfolio__item'))
      cards.forEach((card) => {
        card.addEventListener('pointermove', handlePointerMove, { passive: true })
      })
    }

    updateListeners()
    pointerQuery.addEventListener('change', updateListeners)

    return () => {
      pointerQuery.removeEventListener('change', updateListeners)
      removeListeners()
    }
  }, [rootRef])
}

const ProjectDetails = ({ project, projectIndex }) => {
  const { t, i18n } = useTranslation()

  const language = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]

  return (
    <>
      {project.image && (
        <ProjectDiagram
          slug={project.image}
          label={t(`portfolio.projects.${projectIndex}.image_alt`)}
        />
      )}
      <h3>{t(`portfolio.projects.${projectIndex}.title`)}</h3>
      <p className="portfolio__description">
        {t(`portfolio.projects.${projectIndex}.description`)}
      </p>

      {project.featured && <FeaturedMetrics />}

      <ul className="portfolio__tags">
        {project.tags.map((tag, tagIndex) => (
          <li className="portfolio__tag" key={tag}>
            {t(`portfolio.projects.${projectIndex}.tags.${tagIndex}`)}
          </li>
        ))}
      </ul>

      <footer className="portfolio__footer">
        {project.slug && (
          <a className="portfolio__case-link" href={caseHref(language, project.slug)}>
            {t('portfolio.case_link')}
          </a>
        )}
        {(project.links || []).map((link, linkIndex) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t(`portfolio.projects.${projectIndex}.links.${linkIndex}.label`)}
          </a>
        ))}
        {project.closed && (
          <p className="portfolio__closed">
            {t(project.internal ? 'portfolio.internal_label' : 'portfolio.closed_label')}
          </p>
        )}
      </footer>
    </>
  )
}

function Portfolio() {
  const { t } = useTranslation()
  const portfolioRef = useRef(null)
  const projects = t('portfolio.projects', { returnObjects: true })
  const indexedProjects = projects.map((project, projectIndex) => ({ project, projectIndex }))
  const featuredProject = indexedProjects.find(({ project }) => project.featured)
  const regularProjects = indexedProjects.filter(({ project }) => !project.featured)

  usePointerSpotlight(portfolioRef)

  return (
    <section
      id="portfolio"
      className="portfolio"
      aria-labelledby="portfolio-title"
      ref={portfolioRef}
    >
      <div className="container">
        <Reveal as="header" className="portfolio__heading">
          <h2 id="portfolio-title">{t('portfolio.title')}</h2>
          <p>{t('portfolio.subtitle')}</p>
        </Reveal>

        {featuredProject && (
          <article className="portfolio__featured">
            <div className="portfolio__featured-copy">
              <p className="portfolio__featured-label">{t('portfolio.featured_label')}</p>
              <ProjectDetails {...featuredProject} />
            </div>

            <TypewriterTerminal />
          </article>
        )}

        {regularProjects.length > 0 && (
          <RevealGroup className="portfolio__grid">
            {regularProjects.map(({ project, projectIndex }) => (
              <RevealItem
                as="article"
                className="portfolio__item"
                key={project.title}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <ProjectDetails project={project} projectIndex={projectIndex} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  )
}

export default Portfolio
