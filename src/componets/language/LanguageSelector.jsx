import React from 'react';
import { useTranslation } from 'react-i18next';
import './language.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'es').split('-')[0];
  const nextLanguage = currentLanguage === 'es' ? 'en' : 'es';
  const changeLabel = currentLanguage === 'es'
    ? 'Cambiar idioma a inglés'
    : 'Switch language to Spanish';
  // Cambiar de idioma cambia de URL: `/` es el espanol y `/en/` el ingles, y
  // cada uno se sirve prerenderizado. Es un <a> de verdad para que se pueda
  // abrir en otra pestana y lo anuncie un lector de pantalla; el onClick solo
  // se encarga de arrastrar el hash de la seccion en la que este el usuario.
  const href = nextLanguage === 'en' ? '/en/' : '/';

  const goToLanguage = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    window.location.assign(`${href}${window.location.hash}`);
  };

  return (
    <div className="language-selector">
      <a
        className="lang-btn"
        href={href}
        onClick={goToLanguage}
        aria-label={changeLabel}
      >
        {nextLanguage.toUpperCase()}
      </a>
    </div>
  );
};

export default LanguageSelector;
