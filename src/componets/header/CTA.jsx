import React from 'react'
import { useTranslation } from 'react-i18next'
import CV from '../../assets/cv.pdf'
import { parseRoute, homeHref } from '../../lib/routing'
import { useRoutePathname } from '../../lib/routeContext'

const CTA = () => {
  const { t } = useTranslation()
  // En una pagina de caso no hay seccion de proyectos: el ancla suelta se
  // quedaba donde estaba. Se prefija con la portada de ese idioma.
  const route = parseRoute(useRoutePathname())
  const base = route.kind === 'case' ? homeHref(route.language) : ''

  return (
    <div className="hero__actions">
      <a href={`${base}#portfolio`} className="hero__button hero__button--projects">
        {t('header.view_projects')}
      </a>
      <a href={CV} download className="hero__button">
        {t('header.download_cv')}
      </a>
    </div>
  )
}

export default CTA
