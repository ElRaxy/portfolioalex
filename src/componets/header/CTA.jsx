import React from 'react'
import { useTranslation } from 'react-i18next'
import CV_ES from '../../assets/cv-es.pdf'
import CV_EN from '../../assets/cv-en.pdf'
import { parseRoute, homeHref } from '../../lib/routing'
import { useRoutePathname } from '../../lib/routeContext'

// El PDF va por idioma de la ruta, no por el de i18next: en el prerender no hay
// deteccion de navegador y las 5 paginas en ingles se generaban con el CV en
// castellano. `download` con nombre para que el recruiter no reciba el hash de CRA.
const CV = { es: CV_ES, en: CV_EN }
const NOMBRE_DESCARGA = { es: 'Alex-Mico-CV-es.pdf', en: 'Alex-Mico-CV-en.pdf' }

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
      <a href={CV[route.language]} download={NOMBRE_DESCARGA[route.language]} className="hero__button">
        {t('header.download_cv')}
      </a>
    </div>
  )
}

export default CTA
