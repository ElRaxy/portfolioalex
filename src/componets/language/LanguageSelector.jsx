import React from 'react'
import { useTranslation } from 'react-i18next'
import './language.css'

const BASE_URL = 'https://portfolioalex-mico.vercel.app'
const PATHS = { es: '/', en: '/en/' }

// Cada idioma tiene su URL propia y su HTML prerenderizado, pero cambiar de uno
// a otro no tiene por que recargar: hacerlo perdia el scroll y repetia todas
// las animaciones de entrada. Aqui se cambia en caliente y la URL se reescribe
// con pushState, asi que recargar o compartir el enlace sigue dando la version
// correcta servida desde el servidor.
const syncDocument = (language) => {
  const url = `${BASE_URL}${PATHS[language]}`
  document.documentElement.lang = language

  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.href = url

  const ogUrl = document.querySelector('meta[property="og:url"]')
  if (ogUrl) ogUrl.content = url

  const ogLocale = document.querySelector('meta[property="og:locale"]')
  if (ogLocale) ogLocale.content = language === 'en' ? 'en_US' : 'es_ES'

  try {
    window.localStorage.setItem('language', language)
  } catch {
    /* almacenamiento bloqueado: la URL ya lleva el idioma */
  }
}

const LanguageSelector = () => {
  const { t, i18n } = useTranslation()
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0]
  const nextLanguage = currentLanguage === 'es' ? 'en' : 'es'
  const changeLabel = currentLanguage === 'es'
    ? 'Cambiar idioma a inglés'
    : 'Switch language to Spanish'
  const href = PATHS[nextLanguage]

  const switchLanguage = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()

    i18n.changeLanguage(nextLanguage).then(() => {
      syncDocument(nextLanguage)
      // El title se compone igual en los dos idiomas y en el prerender.
      document.title = `${t('header.name')} | ${t('header.title')}`
    })

    window.history.pushState(null, '', `${href}${window.location.hash}`)
  }

  return (
    <div className="language-selector">
      <a
        className="lang-btn"
        href={href}
        onClick={switchLanguage}
        aria-label={changeLabel}
      >
        {nextLanguage.toUpperCase()}
      </a>
    </div>
  )
}

export default LanguageSelector
