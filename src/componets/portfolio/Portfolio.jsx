import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './portfolio.css'

const FILTER_TAGS = {
  react: ['react'],
  node: ['node', 'express'],
  mongodb: ['mongodb'],
  python: ['python', 'typer'],
  ai: ['claudeapi'],
  infra: ['ldap', 'bind9', 'ubuntu']
}

const normalizeTag = (tag) => tag.toLocaleLowerCase().replace(/\s+/g, '')

function Portfolio() {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState('all')
  const filters = t('portfolio.filters', { returnObjects: true })
  const projects = t('portfolio.projects', { returnObjects: true })

  const visibleProjects = activeFilter === 'all'
    ? projects
    : projects.filter((project) => project.tags.some((tag) => (
      FILTER_TAGS[activeFilter].includes(normalizeTag(tag))
    )))

  return (
    <section id="portfolio" className="portfolio" aria-labelledby="portfolio-title">
      <div className="container">
        <header className="portfolio__heading">
          <h2 id="portfolio-title">{t('portfolio.title')}</h2>
          <p>{t('portfolio.subtitle')}</p>
        </header>

        <div className="portfolio__filters">
          {Object.entries(filters).map(([filterKey]) => (
            <button
              key={filterKey}
              className="portfolio__filter"
              type="button"
              aria-pressed={activeFilter === filterKey}
              onClick={() => setActiveFilter(filterKey)}
            >
              {t(`portfolio.filters.${filterKey}`)}
            </button>
          ))}
        </div>

        {visibleProjects.length > 0 ? (
          <div className="portfolio__grid">
            {visibleProjects.map((project) => {
              const projectIndex = projects.indexOf(project)

              return (
                <article className="portfolio__item" key={project.title}>
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
                    {project.closed ? (
                      <p className="portfolio__closed">{t('portfolio.closed_label')}</p>
                    ) : (
                      project.links.map((link, linkIndex) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t(`portfolio.projects.${projectIndex}.links.${linkIndex}.label`)}
                        </a>
                      ))
                    )}
                  </footer>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="portfolio__empty">{t('portfolio.subtitle')}</p>
        )}
      </div>
    </section>
  )
}

export default Portfolio
