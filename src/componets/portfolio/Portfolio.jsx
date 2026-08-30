import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
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

const ProjectCardContent = ({ project, language, shouldReduceMotion }) => {
  const media = PROJECT_MEDIA[project.slug]
  const isPrimary = project.tier === 'primary'
  const visibleLinks = (project.links || []).slice(0, 1)
  const entrance = shouldReduceMotion
    ? undefined
    : {
        initial: { y: 18, scale: 0.985 },
        whileInView: { y: 0, scale: 1 },
        viewport: { once: true, margin: '0px 0px -10% 0px' },
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <>
      <figure className="portfolio__media">
        <div className="portfolio__media-frame">
          {isPrimary ? (
            <motion.div className="portfolio__media-motion" {...entrance}>
              <ProjectImage media={media} project={project} eager />
            </motion.div>
          ) : (
            <ProjectImage media={media} project={project} eager={false} />
          )}
        </div>
        <figcaption>{project.image_caption || project.title}</figcaption>
      </figure>

      <div className="portfolio__body">
        {isPrimary && <p className="portfolio__label">{project.label}</p>}
        <h3>{project.title}</h3>
        <p className="portfolio__description">{project.description}</p>

        {isPrimary ? (
          <p className="portfolio__proof">{project.proof}</p>
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

const ProjectCard = ({ project, language }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <article className={getItemClasses(project)} data-tier={project.tier}>
      <ProjectCardContent
        project={project}
        language={language}
        shouldReduceMotion={shouldReduceMotion}
      />
    </article>
  )
}

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
          <ProjectCard
            project={project}
            language={language}
            key={project.slug}
          />
        ))}

        <div className="portfolio__supporting">
          <p className="portfolio__supporting-title">{t('portfolio.supporting_title')}</p>
          <div className="portfolio__supporting-list">
            {supportingProjects.map((project) => (
              <ProjectCard
                project={project}
                language={language}
                key={project.slug}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Portfolio
