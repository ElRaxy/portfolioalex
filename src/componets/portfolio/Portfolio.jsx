import React from 'react'
import { useTranslation } from 'react-i18next'
import { caseHref } from '../../lib/routing'
import saveMyMoneyNowImage from '../../assets/projects/savemymoneynow-detection.png'
import strevImage from '../../assets/projects/strev-product.png'
import atalayaImage from '../../assets/projects/atalaya-health.svg'
import serenoImage from '../../assets/projects/sereno-session-overview.webp'
import './portfolio.css'
import Reveal from '../common/Reveal'

const PROJECT_MEDIA = {
  savemymoneynow: {
    src: saveMyMoneyNowImage,
    width: 914,
    height: 911,
    position: 'center',
    fit: 'contain',
  },
  strev: {
    src: strevImage,
    width: 1440,
    height: 900,
    position: 'center',
    fit: 'contain',
  },
  atalaya: {
    src: atalayaImage,
    width: 1200,
    height: 675,
    position: 'center',
    fit: 'contain',
  },
  sereno: {
    src: serenoImage,
    width: 1560,
    height: 720,
    position: 'center',
    fit: 'contain',
  },
}

const ProjectCard = ({ project, language, headingLevel = 3 }) => {
  const media = PROJECT_MEDIA[project.slug]
  const Heading = headingLevel === 4 ? 'h4' : 'h3'
  const headingId = `project-${project.slug}-title`
  return (
    <Reveal as="article" className={`portfolio__item portfolio__item--${project.tier} portfolio__item--${project.slug}`} aria-labelledby={headingId} data-tier={project.tier}>
      <figure className="portfolio__media">
        <div className="portfolio__media-frame">
          <img src={media.src} alt={project.image_alt || project.title} width={media.width} height={media.height} loading="lazy" decoding="async" style={{ objectFit: media.fit, objectPosition: media.position }} />
        </div>
        <figcaption>{project.image_caption || project.title}</figcaption>
      </figure>
      <div className="portfolio__body">
        <Heading className="portfolio__title" id={headingId}>{project.title}</Heading>
        <p className="portfolio__description">{project.description}</p>
        <footer className="portfolio__footer">
          <div className="portfolio__links">
            <a className="portfolio__case-link" href={caseHref(language, project.slug)}>{project.case_link}<span className="portfolio__arrow" aria-hidden="true">↗</span></a>
            {(project.links || []).slice(0, 1).map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}<span className="portfolio__arrow" aria-hidden="true">↗</span></a>
            ))}
          </div>
          {project.closed && <p className="portfolio__closed">{project.closed_label}</p>}
        </footer>
      </div>
    </Reveal>
  )
}

function Portfolio() {
  const { t, i18n } = useTranslation()
  const language = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]
  const projects = t('portfolio.projects', { returnObjects: true })
  const visibleProjects = (Array.isArray(projects) ? projects : []).filter((project) => PROJECT_MEDIA[project.slug]).map((project) => ({
    ...project,
    case_link: t('portfolio.case_link'),
    closed_label: t(project.internal ? 'portfolio.internal_label' : 'portfolio.closed_label'),
  }))
  return (
    <section id="portfolio" className="portfolio" aria-labelledby="portfolio-title">
      <Reveal as="header" className="portfolio__heading">
        <h2 id="portfolio-title">{t('portfolio.title')}</h2>
        <p>{t('portfolio.subtitle')}</p>
      </Reveal>
      <div className="portfolio__grid">
        {visibleProjects.filter((project) => project.tier === 'primary').map((project) => <ProjectCard project={project} language={language} key={project.slug} />)}
        <section aria-labelledby="portfolio-supporting-title" className="portfolio__supporting">
          <h3 className="portfolio__supporting-title" id="portfolio-supporting-title">{t('portfolio.supporting_title')}</h3>
          <div className="portfolio__supporting-list">
            {visibleProjects.filter((project) => project.tier === 'supporting').map((project) => <ProjectCard project={project} language={language} headingLevel={4} key={project.slug} />)}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Portfolio
