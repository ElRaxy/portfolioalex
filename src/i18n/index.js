import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

const savedLanguage = localStorage.getItem('language');
const browserLanguage = navigator.language;
const initialLanguage = savedLanguage || (browserLanguage.startsWith('es') ? 'es' : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// El atributo lang del html debe seguir al idioma activo: si no, un lector de
// pantalla lee el ingles con fonetica espanola.
const syncHtmlLang = (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('language', lng);
};

syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
