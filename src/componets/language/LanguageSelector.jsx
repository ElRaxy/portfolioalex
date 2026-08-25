import React from 'react'
import { useTranslation } from 'react-i18next'
import './language.css'
import { parseRoute, caseHref } from '../../lib/routing'
import { ROUTE_CHANGE_EVENT, useRoutePathname } from '../../lib/routeContext'
import { runLanguageTransition, syncDocument } from '../../lib/smoothScroll'

const PATHS = { es: '/', en: '/en/' }

// Cada idioma tiene su URL propia y su HTML prerenderizado, pero cambiar de uno
// a otro no tiene por que recargar: hacerlo perdia el scroll y repetia todas
// las animaciones de entrada. Aqui se cambia en caliente y la URL se reescribe
// con pushState, asi que recargar o compartir el enlace sigue dando la version
// correcta servida desde el servidor.
const LanguageSelector = () => {
  const { t, i18n } = useTranslation()
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]
  const nextLanguage = currentLanguage === 'es' ? 'en' : 'es'
  const changeLabel = currentLanguage === 'es'
    ? 'Cambiar idioma a inglés'
    : 'Switch language to Spanish'
  // En una pagina de caso no se cambia en caliente: cada caso tiene su HTML
  // por idioma y su URL propia, asi que el enlace navega de verdad.
  // La ruta viene del contexto y no de `window`: en el prerender no hay
  // `window`, asi que las 8 paginas de caso servian el enlace de la portada
  // inglesa en vez del caso traducido, y el href servido no coincidia con el
  // que calculaba el cliente al hidratar.
  const route = parseRoute(useRoutePathname())
  const isCase = route.kind === 'case'
  const href = isCase ? caseHref(nextLanguage, route.slug) : PATHS[nextLanguage]

  const switchLanguage = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    if (isCase) return
    event.preventDefault()

    runLanguageTransition(async () => {
      await i18n.changeLanguage(nextLanguage)
      window.history.pushState(null, '', `${href}${window.location.hash}`)
      window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
      syncDocument(nextLanguage, i18n, href)
    })
  }

  return (
    <div className="language-selector" role="group" aria-label={t('controls.language')}>
      {currentLanguage === 'es' ? (
        <span className="language-selector__option language-selector__option--active" aria-current="true">
          ES
        </span>
      ) : (
        <a className="lang-btn" href={href} onClick={switchLanguage} aria-label={changeLabel}>
          ES
        </a>
      )}
      {currentLanguage === 'en' ? (
        <span className="language-selector__option language-selector__option--active" aria-current="true">
          EN
        </span>
      ) : (
        <a className="lang-btn" href={href} onClick={switchLanguage} aria-label={changeLabel}>
          EN
        </a>
      )}
    </div>
  )
}

export default LanguageSelector
