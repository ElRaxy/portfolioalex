import React from 'react'
import { useTranslation } from 'react-i18next'
import Reveal, { RevealGroup, RevealItem } from '../common/Reveal'
import './portfolio.css'

const ATALAYA_HELP_OUTPUT = `$ bhound --help

 Usage: bhound [OPTIONS] COMMAND [ARGS]...

 Atalaya - tu vigia de ofertas dev remoto.

 Commands:
   search        Scrapea y puntua ofertas
   list          Lista ofertas por score
   letter        Genera carta tailored
   cv            Genera CV tailored
   apply-batch   Aplica en batch al top N
   ingest-email  Ingesta alertas de email
   export        Exporta a CSV o JSON`

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

const ProjectDetails = ({ project, projectIndex }) => {
  const { t } = useTranslation()

  return (
    <>
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
    </>
  )
}

function Portfolio() {
  const { t } = useTranslation()
  const projects = t('portfolio.projects', { returnObjects: true })
  const indexedProjects = projects.map((project, projectIndex) => ({ project, projectIndex }))
  const featuredProject = indexedProjects.find(({ project }) => project.featured)
  const regularProjects = indexedProjects.filter(({ project }) => !project.featured)

  return (
    <section id="portfolio" className="portfolio" aria-labelledby="portfolio-title">
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

            <Reveal
              className="portfolio__terminal"
              aria-hidden="true"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="portfolio__terminal-bar">bhound --help</div>
              <div className="portfolio__terminal-body">
                {ATALAYA_HELP_OUTPUT.split('\n').map((line, lineIndex, lines) => (
                  <React.Fragment key={`${lineIndex}-${line}`}>
                    {renderTerminalLine(line)}
                    {lineIndex < lines.length - 1 && '\n'}
                  </React.Fragment>
                ))}
              </div>
            </Reveal>
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
