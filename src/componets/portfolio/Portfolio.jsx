import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
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
    fit: 'contain',
  },
}

const ProjectImage = ({ media, project, eager }) => {
  const image = (
    <img
      src={media.src}
      alt={project.image_alt || project.title}
      width={media.width}
      height={media.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ objectFit: media.fit || 'cover', objectPosition: media.position }}
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

const ProjectCardContent = ({ project, projectIndex, language, mediaStyle, railStyle }) => {
  const media = PROJECT_MEDIA[project.slug]
  const isPrimary = project.tier === 'primary'

  return (
    <>
      <figure className="portfolio__media">
        <div className="portfolio__media-frame">
          {isPrimary ? (
            <>
              <motion.div className="portfolio__media-motion" style={mediaStyle}>
                <ProjectImage media={media} project={project} eager />
              </motion.div>
              <motion.span
                className="portfolio__chapter-progress"
                aria-hidden="true"
                style={railStyle}
              />
            </>
          ) : (
            <ProjectImage media={media} project={project} eager={false} />
          )}
        </div>
        <figcaption>{project.image_caption || project.title}</figcaption>
      </figure>

      <div className="portfolio__body">
        <p className="portfolio__eyebrow">
          <span>{String(projectIndex + 1).padStart(2, '0')}</span>
          <span>{project.tier_label}</span>
        </p>

        <h3>{project.title}</h3>
        <p className="portfolio__description">{project.description}</p>

        <ul className="portfolio__tags">
          {(project.tags || []).map((tag) => (
            <li className="portfolio__tag" key={tag}>{tag}</li>
          ))}
        </ul>

        <footer className="portfolio__footer">
          <div className="portfolio__links">
            {project.slug && (
              <a className="portfolio__case-link" href={caseHref(language, project.slug)}>
                {project.case_link}
              </a>
            )}
            {(project.links || []).map((link) => (
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

const PrimaryProjectCard = ({ project, projectIndex, language }) => {
  const cardRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  })
  const chapterProgress = useSpring(scrollYProgress, {
    stiffness: 145,
    damping: 30,
    mass: 0.32,
  })
  const mediaY = useTransform(chapterProgress, [0, 0.5, 1], [-3, 0, 3])
  const mediaScale = useTransform(chapterProgress, [0, 0.5, 1], [1, 1.018, 1])
  const mediaStyle = shouldReduceMotion ? undefined : { y: mediaY, scale: mediaScale }
  const railStyle = shouldReduceMotion ? undefined : { scaleX: chapterProgress, originX: 0 }

  return (
    <article ref={cardRef} className={getItemClasses(project)} data-tier={project.tier}>
      <ProjectCardContent
        project={project}
        projectIndex={projectIndex}
        language={language}
        mediaStyle={mediaStyle}
        railStyle={railStyle}
      />
    </article>
  )
}

const SupportingProjectCard = ({ project, projectIndex, language }) => (
  <article className={getItemClasses(project)} data-tier={project.tier}>
    <ProjectCardContent
      project={project}
      projectIndex={projectIndex}
      language={language}
    />
  </article>
)

const ProjectCard = (props) => (
  props.project.tier === 'primary'
    ? <PrimaryProjectCard {...props} />
    : <SupportingProjectCard {...props} />
)

function Portfolio() {
  const { t, i18n } = useTranslation()
  const language = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]
  const projects = t('portfolio.projects', { returnObjects: true })
  const visibleProjects = Array.isArray(projects)
    ? projects.filter((project) => PROJECT_MEDIA[project.slug])
    : []

  const enrichedProjects = visibleProjects.map((project) => ({
    ...project,
    case_link: t('portfolio.case_link'),
    closed_label: t(project.internal ? 'portfolio.internal_label' : 'portfolio.closed_label'),
    tier_label: t(`portfolio.${project.tier}_label`),
  }))

  return (
    <section id="portfolio" className="portfolio" aria-labelledby="portfolio-title">
      <header className="portfolio__heading">
        <h2 id="portfolio-title">{t('portfolio.title')}</h2>
        <p>{t('portfolio.subtitle')}</p>
      </header>

      <div className="portfolio__grid">
        {enrichedProjects.map((project, projectIndex) => (
          <ProjectCard
            project={project}
            projectIndex={projectIndex}
            language={language}
            key={project.slug}
          />
        ))}
      </div>
    </section>
  )
}

export default Portfolio
