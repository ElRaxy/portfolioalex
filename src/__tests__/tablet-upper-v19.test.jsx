import fs from 'fs'
import path from 'path'
import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import '../i18n'

const read = (...parts) => fs.readFileSync(path.join(__dirname, '..', ...parts), 'utf8')

describe('la composicion superior propia de tablet v19', () => {
  const headerCss = read('componets', 'header', 'header.css')
  const portfolioCss = read('componets', 'portfolio', 'portfolio.css')
  const navCss = read('componets', 'nav', 'nav.css')
  const navSource = read('componets', 'nav', 'Nav.jsx')
  const headerTablet = headerCss.slice(
    headerCss.indexOf('/* v19: tablet tiene una composicion propia'),
    headerCss.indexOf('/* v16: composicion compacta', headerCss.indexOf('/* v19: tablet')),
  )
  const portfolioTablet = portfolioCss.slice(
    portfolioCss.indexOf('/* v19: los flagships conservan dos columnas'),
    portfolioCss.indexOf('@media screen and (max-width: 700px)', portfolioCss.indexOf('/* v19: los flagships')),
  )

  it('reserva 761-1050 para un hero de dos columnas con capturas completas', () => {
    expect(headerTablet).toMatch(
      /@media screen and \(min-width: 761px\) and \(max-width: 1050px\)/,
    )
    expect(headerTablet).toMatch(
      /\.hero\s*\{[\s\S]*?grid-template-columns:\s*minmax\(18rem, 0\.88fr\) minmax\(0, 1\.12fr\)/,
    )
    expect(headerTablet).toMatch(/\.hero__stage\s*\{[\s\S]*?height:\s*clamp\(29rem, 53vw, 33rem\)/)
    expect(headerCss).toMatch(/\.hero__preview img\s*\{[\s\S]*?object-fit:\s*contain/)
    expect(headerTablet).not.toMatch(/position:\s*sticky|transform:\s*scale|object-fit:\s*cover/)
  })

  it('mantiene Strev y Sereno en dos columnas sin sticky ni recorte', () => {
    expect(portfolioTablet).toMatch(
      /@media screen and \(min-width: 761px\) and \(max-width: 1050px\)/,
    )
    expect(portfolioTablet).toMatch(
      /\.portfolio__item--primary\s*\{[\s\S]*?grid-template-columns:\s*minmax\(18rem, 0\.9fr\) minmax\(0, 1\.1fr\)/,
    )
    expect(portfolioTablet).toMatch(/grid-template-areas:\s*'body media'/)
    expect(portfolioTablet).toMatch(/\.portfolio__media img\s*\{[\s\S]*?object-fit:\s*contain;[\s\S]*?transform:\s*none/)
    expect(portfolioTablet).not.toMatch(/position:\s*sticky|transform:\s*scale|object-fit:\s*cover/)
  })

  it('muestra la navegacion completa desde 901 y conserva el menu hasta 900', () => {
    expect(navCss).toMatch(/@media screen and \(max-width: 900px\)/)
    expect(navCss).not.toMatch(/@media screen and \(max-width: 1024px\)/)
    expect(navSource).toMatch(/matchMedia\('\(min-width: 901px\)'\)/)
    expect(navCss).toMatch(
      /\.portfolio-nav__menu-toggle\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px/,
    )
  })
})

describe('el menu tablet conserva teclado y bloqueo de scroll', () => {
  it('atrapa Tab, cierra con Escape y devuelve el foco', () => {
    render(<App pathname="/" />)

    const nav = screen.getByRole('navigation', { name: 'Navegación por secciones' })
    const menuButton = within(nav).getByRole('button', { name: 'Abrir menú' })
    const links = within(nav).getAllByRole('link')
      .filter((link) => link.classList.contains('portfolio-nav__link'))
    const firstLink = links[0]
    const lastLink = links[links.length - 1]

    fireEvent.click(menuButton)
    expect(document.body.style.overflow).toBe('hidden')
    expect(firstLink).toHaveFocus()

    lastLink.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(firstLink).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
})
