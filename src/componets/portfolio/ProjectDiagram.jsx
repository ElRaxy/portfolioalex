import React from 'react'
import { useTranslation } from 'react-i18next'
import './projectDiagram.css'

const DIAGRAM_SLUGS = ['wordpress', 'savemymoneynow', 'strev']

export default function ProjectDiagram({ slug, label }) {
  const { t } = useTranslation()

  if (!DIAGRAM_SLUGS.includes(slug)) return null

  const key = `portfolio.diagrams.${slug}`
  const prompt = t(`${key}.prompt`)
  const bar = t(`${key}.bar`)
  const badge = t(`${key}.badge`)
  const steps = t(`${key}.steps`, { returnObjects: true })
  const before = t(`${key}.before`)
  const after = t(`${key}.after`)

  if (!Array.isArray(steps)) return null

  return (
    <div className={'pdiag pdiag--' + slug} role="img" aria-label={label}>
      <div className="pdiag__bar">
        {prompt && <span className="pdiag__prompt" aria-hidden="true">{prompt}</span>}
        <span className="pdiag__cmd">{bar}</span>
        <span className="pdiag__badge">{badge}</span>
      </div>
      <ol className="pdiag__flow">
        {steps.map((step, index) => (
          <li
            className={`pdiag__step${index === 2 ? ' pdiag__step--out' : ''}`}
            key={`${step.title}-${index}`}
          >
            <span className="pdiag__step-title">{step.title}</span>
            <span className="pdiag__step-note">{step.note}</span>
          </li>
        ))}
      </ol>
      <p className="pdiag__before">{before}</p>
      <p className="pdiag__after">{after}</p>
    </div>
  )
}
