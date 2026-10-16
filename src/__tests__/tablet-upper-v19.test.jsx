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
  const portfolioTablet = portfolioCss.slice(
    portfolioCss.indexOf('@media screen and (min-width: 701px)'),
    portfolioCss.indexOf('@media screen and (max-width: 700px)'),
  )

  it('usa una entrada personal sin escenario de capturas en tablet', () => {
    expect(headerCss).not.toMatch(/hero__stage|hero__preview/)
    render(<App pathname="/" />)
    expect(within(document.getElementById('home')).getByRole('link', { name: 'Conóceme' }))
      .toHaveAttribute('href', '#about')
  })

  it('mantiene Strev y Sereno en dos columnas sin sticky ni recorte', () => {
    expect(portfolioTablet).toMatch(/grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(portfolioCss).toMatch(/object-fit:\s*contain/)
    expect(portfolioTablet).not.toMatch(/position:\s*sticky|object-fit:\s*cover/)
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
