import React from 'react'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { createInstance } from 'i18next'
import App from '../App'
import translationEN from '../i18n/locales/en/translation.json'
import translationES from '../i18n/locales/es/translation.json'

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
}

export const createPrerenderApp = (language) => {
  const i18n = createInstance()

  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    initImmediate: false,
    interpolation: { escapeValue: false },
  })

  return (
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  )
}
