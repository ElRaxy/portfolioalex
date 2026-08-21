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

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      <button
        className="lang-btn"
        type="button"
        onClick={() => changeLanguage(nextLanguage)}
        aria-label={changeLabel}
      >
        {nextLanguage.toUpperCase()}
      </button>
    </div>
  );
};

export default LanguageSelector;
