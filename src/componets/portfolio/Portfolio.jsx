import React from 'react'
import { useTranslation } from 'react-i18next'
import Reveal, { RevealGroup, RevealItem } from '../common/Reveal'
import './portfolio.css'

function Portfolio() {
  const { t } = useTranslation()
  const projects = t('portfolio.projects', { returnObjects: true })
  const technologies = [...new Set(projects.flatMap((project) => project.tags))]

  return (
    <section id="portfolio" className="portfolio" aria-labelledby="portfolio-title">
      <div className="container">
        <Reveal as="header" className="portfolio__heading">
          <h2 id="portfolio-title">{t('portfolio.title')}</h2>
          <p>{t('portfolio.subtitle')}</p>
        </Reveal>

        <RevealGroup as="ul" className="portfolio__legend">
          {technologies.map((technology) => (
            <RevealItem as="li" className="portfolio__legend-item" key={technology}>
              {technology}
            </RevealItem>
          ))}
        </RevealGroup>

        <RevealGroup className="portfolio__grid">
          {projects.map((project, projectIndex) => (
            <RevealItem
              as="article"
              className="portfolio__item"
              key={project.title}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
              <h3>{t(`portfolio.projects.${projectIndex}.title`)}</h3>
              <p className="portfolio__description">
                {t(`portfolio.projects.${projectIndex}.description`)}
              </p>

              <ul className="portfolio__tags">
                {project.tags.map((tag, tagIndex) => (
                  <li className="portfolio__tag" key={tag}>
                    {t(`portfolio.projects.${projectIndex}.tags.${tagIndex}`)}
                  </li>
                ))}
              </ul>

              <footer className="portfolio__footer">
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
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

export default Portfolio
