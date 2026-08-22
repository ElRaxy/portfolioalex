import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { caseHref } from '../../lib/routing'
import { useReducedMotion } from 'motion/react'
import Reveal, { RevealGroup, RevealItem } from '../common/Reveal'
import './portfolio.css'

const PROJECT_IMAGES = {
  wordpress: '/projects/wp-flow.svg',
  savemymoneynow: '/projects/savemymoneynow.svg',
  strev: '/projects/strev.webp',
}

// Copia abreviada de la salida real de `bhound --help`. Las descripciones son
// las del CLI, recortadas para que quepan en la tarjeta; el CLI hablaba
// castellano hasta el 2026-08-22 y esto se veia en ingles a medias.
const ATALAYA_HELP_OUTPUT = `$ bhound --help

 Usage: bhound [OPTIONS] COMMAND [ARGS]...

 Atalaya - your lookout for remote dev jobs.

 Commands:
   search        Scrape a job board, score and store
   list          List stored offers by score
   letter        Draft a tailored cover letter
   cv            Draft a tailored CV variant
   apply-batch   Apply to the top N offers
   ingest-email  Ingest offers from email alerts
   export        Export to CSV or JSON`

const ATALAYA_HELP_LINES = ATALAYA_HELP_OUTPUT.split('\n')
const ATALAYA_METRICS = [
  { key: 'jobBoards', value: 7, labelKey: 'job_boards' },
  { key: 'tests', value: 162, labelKey: 'passing_tests' },
  { key: 'commands', value: 13, labelKey: 'commands' },
]

const renderTerminalLine = (line) => {
  if (line === '$ bhound --help') {
    return (
      <>
        <span className="portfolio__terminal-accent">$</span>
        {' '}
        <span className="portfolio__terminal-accent">bhound --help</span>
      </>
    )
  }

  const commandLine = line.match(/^( {3})([a-z-]+)( +)(.*)$/)

  if (commandLine) {
    return (
      <>
        {commandLine[1]}
        <span className="portfolio__terminal-command">{commandLine[2]}</span>
        {commandLine[3]}
        <span>{commandLine[4]}</span>
      </>
    )
  }

  return line
}

const TypewriterTerminal = () => {
  const shouldReduceMotion = useReducedMotion()
  const bodyRef = useRef(null)
  const hasStartedRef = useRef(false)
  const [visibleLineCount, setVisibleLineCount] = useState(
    shouldReduceMotion ? ATALAYA_HELP_LINES.length : 0,
  )

  useEffect(() => {
    if (shouldReduceMotion) {
      hasStartedRef.current = true
      setVisibleLineCount(ATALAYA_HELP_LINES.length)
      return undefined
    }

    const terminalBody = bodyRef.current
    if (!terminalBody || hasStartedRef.current) return undefined

    let intervalId

    const startTyping = () => {
      if (hasStartedRef.current) return

      hasStartedRef.current = true
      let nextLineCount = 1
      setVisibleLineCount(nextLineCount)

      if (ATALAYA_HELP_LINES.length <= 1) return

      intervalId = window.setInterval(() => {
        nextLineCount += 1
        setVisibleLineCount(nextLineCount)

        if (nextLineCount >= ATALAYA_HELP_LINES.length) {
          window.clearInterval(intervalId)
        }
      }, 90)
    }

    if (!('IntersectionObserver' in window)) {
      startTyping()
      return () => window.clearInterval(intervalId)
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return

      observer.disconnect()
      startTyping()
    }, { threshold: 0.3 })

    observer.observe(terminalBody)

    return () => {
      observer.disconnect()
      window.clearInterval(intervalId)
    }
  }, [shouldReduceMotion])

  return (
    <Reveal
      className="portfolio__terminal"
      aria-hidden="true"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="portfolio__terminal-bar">bhound --help</div>
      <div className="portfolio__terminal-body" ref={bodyRef}>
        {ATALAYA_HELP_LINES.map((line, lineIndex) => {
          const isVisible = lineIndex < visibleLineCount
          const hasCursor = isVisible
            && lineIndex === visibleLineCount - 1
            && visibleLineCount < ATALAYA_HELP_LINES.length

          return (
            <span
              className={`portfolio__terminal-line${isVisible ? ' is-visible' : ''}`}
              key={`${lineIndex}-${line}`}
            >
              {line ? renderTerminalLine(line) : '\u00a0'}
              {hasCursor && <span className="portfolio__terminal-cursor">▋</span>}
            </span>
          )
        })}
      </div>
    </Reveal>
  )
}

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

  const projectImage = PROJECT_IMAGES[project.image]
  const language = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]

  return (
    <>
      {projectImage && (
        <img
          className="portfolio__shot"
          src={projectImage}
          alt={t(`portfolio.projects.${projectIndex}.image_alt`)}
          width="800"
          height="500"
          loading="lazy"
          decoding="async"
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
