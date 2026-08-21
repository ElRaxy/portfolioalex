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

// El idioma sale SOLO de la ruta. No se consulta localStorage ni
// navigator.language: el HTML de `/` viene prerenderizado en espanol y el de
// `/en/` en ingles, asi que arrancar en otro idioma romperia la hidratacion y
// haria que el contenido indexable cambiase segun el navegador.
// Este acceso va con guarda porque tambien se ejecuta en el render de servidor,
// donde no hay `window`.
const readLanguageFromPath = () => {
  try {
    if (typeof window === 'undefined') return 'es';
    return /^\/en(?:\/|$)/.test(window.location.pathname) ? 'en' : 'es';
  } catch {
    return 'es';
  }
};

const initialLanguage = readLanguageFromPath();

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
// pantalla lee el ingles con fonetica espanola. `localStorage` puede lanzar en
// navegacion privada, y eso no puede tumbar la pagina entera.
try {
  document.documentElement.lang = initialLanguage;
  window.localStorage.setItem('language', initialLanguage);
} catch {
  /* almacenamiento bloqueado: el idioma ya esta resuelto por la ruta */
}

export default i18n;
