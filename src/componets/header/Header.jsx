import React from 'react'
import { useTranslation } from 'react-i18next'
import './header.css'
import CTA from './CTA'
import HeroGrid from './HeroGrid'
import HeaderSocials from './HeaderSocials'
import { SidebarNav } from '../nav/Nav'

// En una pagina de caso el h1 es el titulo del caso, asi que el nombre baja a
// parrafo: dos h1 en el mismo documento dejan la pagina sin titulo principal.
// El <p> lleva `role="img"` porque `aria-label` solo se expone sobre elementos
// con rol; sirve ademas el nombre entero de una pieza, que es lo que hace falta
// con el nombre troceado en 16 spans.
const Header = ({ nameAs = 'h1' }) => {
  const { t } = useTranslation()
  const name = t('header.name')
  const esTitulo = nameAs === 'h1'

  const caracteres = Array.from(name).map((character, index) => (
    <span
      className="hero__char"
      aria-hidden="true"
      style={{ '--i': index }}
      key={`${character}-${index}`}
    >
      {character === ' ' ? '\u00a0' : character}
    </span>
  ))

  return (
    <header id="home" className="hero">
      <HeroGrid />

      <div className="hero__intro">
        {React.createElement(
          nameAs,
          esTitulo
            ? { className: 'hero__name', 'aria-label': name }
            : { className: 'hero__name', role: 'img', 'aria-label': name },
          caracteres,
        )}
        {/* nbsp antes del separador: con espacio normal el punto medio caia
            solo al principio de la segunda linea. El <title> no se toca. */}
        <p className="hero__title">{t('header.title').replace(' \u00b7 ', '\u00a0\u00b7 ')}</p>
        <p className="hero__tagline">{t('header.tagline')}</p>
        <CTA />
      </div>

      <SidebarNav />
      <HeaderSocials />

      <p className="hero__availability">
        <span className="hero__availability-dot" aria-hidden="true" />
        {t('header.availability')}
      </p>
    </header>
  )
}

export default Header
