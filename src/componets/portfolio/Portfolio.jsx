import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'motion/react'
import { caseHref } from '../../lib/routing'
import saveMyMoneyNowImage from '../../assets/projects/savemymoneynow-detection.png'
import strevImage from '../../assets/projects/strev-product.png'
import atalayaImage from '../../assets/projects/atalaya-health.svg'
import serenoImage from '../../assets/projects/sereno-session-overview.webp'
import serenoDemo from '../../assets/projects/sereno-demo.webp'
import './portfolio.css'

const PROJECT_MEDIA = {
  savemymoneynow: {
    src: saveMyMoneyNowImage,
    width: 914,
    height: 911,
    position: 'top',
  },
  strev: {
    src: strevImage,
    width: 1440,
    height: 900,
    position: 'center',
  },
  atalaya: {
    src: atalayaImage,
    width: 1200,
    height: 675,
    position: 'center',
  },
  sereno: {
    src: serenoDemo,
    still: serenoImage,
    width: 1200,
    height: 554,
    position: 'center',
    fit: 'cover',
  },
}

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined
    }

    const mediaQuery = window.matchMedia(query)
    const updateMatch = () => setMatches(mediaQuery.matches)
    updateMatch()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatch)
      return () => mediaQuery.removeEventListener('change', updateMatch)
    }

    mediaQuery.addListener(updateMatch)
    return () => mediaQuery.removeListener(updateMatch)
  }, [query])

  return matches
}

const ProjectImage = ({ media, project, eager, dynamicCrop = false }) => {
  const image = (
    <img
      src={media.src}
      alt={project.image_alt || project.title}
      width={media.width}
      height={media.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{
        objectFit: media.fit || 'cover',
        objectPosition: dynamicCrop ? 'var(--media-position, center)' : media.position,
      }}
    />
  )

  if (!media.still) return image

  return (
    <picture>
      <source media="(prefers-reduced-motion: reduce)" srcSet={media.still} />
      {image}
    </picture>
  )
}

const getItemClasses = (project) => [
  'portfolio__item',
  `portfolio__item--${project.tier}`,
  `portfolio__item--${project.slug}`,
].filter(Boolean).join(' ')

const ProjectCardContent = ({
  project,
  language,
  storyEnabled,
  mediaScale,
  scrollYProgress,
  activeStep,
  decisions,
  storyLabel,
  headingLevel,
}) => {
  const media = PROJECT_MEDIA[project.slug]
  const isPrimary = project.tier === 'primary'
  const ProjectHeading = headingLevel === 4 ? 'h4' : 'h3'
  const headingId = `project-${project.slug}-title`
  const shouldLoadImmediately = isPrimary || project.slug === 'savemymoneynow'
  const visibleLinks = (project.links || []).slice(0, 1)

  return (
    <>
      <figure className="portfolio__media">
        <div className="portfolio__media-frame">
          {isPrimary ? (
            <motion.div
              className="portfolio__media-motion"
              data-step={storyEnabled ? activeStep : 0}
              style={storyEnabled ? { scale: mediaScale } : undefined}
            >
              <ProjectImage media={media} project={project} eager dynamicCrop />
            </motion.div>
          ) : (
            <ProjectImage
              media={media}
              project={project}
              eager={shouldLoadImmediately}
            />
          )}
        </div>
        <figcaption>{project.image_caption || project.title}</figcaption>
      </figure>

      <div className="portfolio__body">
        {isPrimary && <p className="portfolio__label">{project.label}</p>}
        <ProjectHeading className="portfolio__title" id={headingId}>
          {project.title}
        </ProjectHeading>
        <p className="portfolio__description">{project.description}</p>

        {isPrimary ? (
          <>
            <p className="portfolio__proof">{project.proof}</p>
            <div className="portfolio__story">
              <span className="portfolio__story-track" aria-hidden="true">
                <motion.span
                  className="portfolio__story-progress"
                  style={{ scaleY: storyEnabled ? scrollYProgress : 1 }}
                />
              </span>
              <ol className="portfolio__story-steps" aria-label={storyLabel}>
                {decisions.map((decision, index) => (
                  <li
                    aria-current={index === activeStep ? 'step' : undefined}
                    className="portfolio__story-step"
                    data-active={index === activeStep}
                    key={decision.title}
                  >
                    <h4>{decision.title}</h4>
                    <p>{decision.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : (
          <ul className="portfolio__tags">
            {(project.tags || []).map((tag) => (
              <li className="portfolio__tag" key={tag}>{tag}</li>
            ))}
          </ul>
        )}

        <footer className="portfolio__footer">
          <div className="portfolio__links">
            {project.slug && (
              <a className="portfolio__case-link" href={caseHref(language, project.slug)}>
                {project.case_link}
              </a>
            )}
            {visibleLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {project.closed && (
            <p className="portfolio__closed">{project.closed_label}</p>
          )}
        </footer>
      </div>
    </>
  )
}

const ProjectCard = ({
  project,
  language,
  headingLevel,
  articleRef,
  storyEnabled,
  mediaScale,
  scrollYProgress,
  activeStep,
  decisions = [],
  storyLabel,
}) => {
  const headingId = `project-${project.slug}-title`

  return (
    <article
      ref={articleRef}
      aria-labelledby={headingId}
      className={getItemClasses(project)}
      data-story-mode={project.tier === 'primary' ? (storyEnabled ? 'scroll' : 'static') : undefined}
      data-story-step={project.tier === 'primary' ? activeStep : undefined}
      data-tier={project.tier}
    >
      <ProjectCardContent
        headingLevel={headingLevel}
        project={project}
        language={language}
        storyEnabled={storyEnabled}
        mediaScale={mediaScale}
        scrollYProgress={scrollYProgress}
        activeStep={activeStep}
        decisions={decisions}
        storyLabel={storyLabel}
      />
    </article>
  )
}

const PrimaryProjectCard = ({ project, language, headingLevel, decisions, storyLabel }) => {
  const articleRef = useRef(null)
  const [activeStep, setActiveStep] = useState(0)
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isDesktopStory = useMediaQuery('(min-width: 1051px)')
  const storyEnabled = isDesktopStory && !shouldReduceMotion
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ['start start', 'end end'],
  })
  const mediaScale = useTransform(
    scrollYProgress,
    [0, 0.34, 0.67, 1],
    [1.015, 1.045, 1.08, 1.11],
  )

  useEffect(() => {
    if (!storyEnabled) setActiveStep(0)
  }, [storyEnabled])

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (!storyEnabled) return

    const nextStep = latest >= 0.67 ? 2 : latest >= 0.34 ? 1 : 0
    setActiveStep((currentStep) => (currentStep === nextStep ? currentStep : nextStep))
  })

  return (
    <ProjectCard
      articleRef={articleRef}
      headingLevel={headingLevel}
      project={project}
      language={language}
      storyEnabled={storyEnabled}
      mediaScale={mediaScale}
      scrollYProgress={scrollYProgress}
      activeStep={storyEnabled ? activeStep : 0}
      decisions={decisions}
      storyLabel={storyLabel}
    />
  )
}

function Portfolio() {
  const { t, i18n } = useTranslation()
  const language = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]
  const projects = t('portfolio.projects', { returnObjects: true })
  const caseStudies = t('case_study.cases', { returnObjects: true })
  const visibleProjects = Array.isArray(projects)
    ? projects.filter((project) => PROJECT_MEDIA[project.slug])
    : []

  const enrichedProjects = visibleProjects.map((project) => ({
    ...project,
    case_link: t('portfolio.case_link'),
    closed_label: t(project.internal ? 'portfolio.internal_label' : 'portfolio.closed_label'),
  }))
  const primaryProjects = enrichedProjects.filter((project) => project.tier === 'primary')
  const supportingProjects = enrichedProjects.filter((project) => project.tier === 'supporting')

  return (
    <section id="portfolio" className="portfolio" aria-labelledby="portfolio-title">
      <header className="portfolio__heading">
        <h2 id="portfolio-title">{t('portfolio.title')}</h2>
        <p>{t('portfolio.subtitle')}</p>
      </header>

      <div className="portfolio__grid">
        {primaryProjects.map((project) => (
          <PrimaryProjectCard
            project={project}
            language={language}
            headingLevel={3}
            decisions={(caseStudies?.[project.slug]?.decisions || []).slice(0, 3)}
            storyLabel={t('portfolio.story_label', { project: project.title })}
            key={project.slug}
          />
        ))}

        <section
          aria-labelledby="portfolio-supporting-title"
          className="portfolio__supporting"
        >
          <h3 className="portfolio__supporting-title" id="portfolio-supporting-title">
            {t('portfolio.supporting_title')}
          </h3>
          <div className="portfolio__supporting-list">
            {supportingProjects.map((project) => (
              <ProjectCard
                project={project}
                language={language}
                headingLevel={4}
                key={project.slug}
              />
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Portfolio
