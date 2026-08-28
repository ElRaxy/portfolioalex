import React from 'react'
import { useTranslation } from 'react-i18next'
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

const ProjectCard = ({ project, projectIndex, language }) => {
  const media = PROJECT_MEDIA[project.slug]
  const isPrimary = project.tier === 'primary'
  const itemClasses = [
    'portfolio__item',
    `portfolio__item--${project.tier}`,
    `portfolio__item--${project.slug}`,
  ].filter(Boolean).join(' ')

  return (
    <article className={itemClasses} data-tier={project.tier}>
      <figure className="portfolio__media">
        <div className="portfolio__media-frame">
          <ProjectImage media={media} project={project} eager={isPrimary} />
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
