import React from 'react'
import { render, screen, within } from '@testing-library/react'
import App from '../App'
import '../i18n'

describe('la web entera', () => {
  it('pinta el nombre como unico H1', () => {
    render(<App />)

    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveAccessibleName('Alex Micó Robles')
  })

  it('monta las cinco secciones que anuncia la navegacion', () => {
    const { container } = render(<App />)

    const secciones = ['about', 'portfolio', 'experience', 'stack', 'contact']
    secciones.forEach((id) => expect(container.querySelector(`#${id}`)).toBeInTheDocument())
  })

  it('deja abiertas las tres vias de contacto, no solo el formulario', () => {
    const { container } = render(<App />)

    expect(container.querySelector('a[href^="mailto:"]')).toBeInTheDocument()
    expect(container.querySelector('a[href*="wa.me"], a[href*="whatsapp"]')).toBeInTheDocument()
    expect(container.querySelector('a[href*="github.com/ElRaxy"]')).toBeInTheDocument()
  })

  it('ofrece el CV como descarga y no como enlace suelto', () => {
    const { container } = render(<App />)

    const cv = container.querySelector('a[download], a[href$=".pdf"]')
    expect(cv).toBeInTheDocument()
  })

  it('no deja ningun enlace externo sin rel de seguridad', () => {
    const { container } = render(<App />)

    const externos = [...container.querySelectorAll('a[target="_blank"]')]
    expect(externos.length).toBeGreaterThan(0)
    externos.forEach((enlace) => {
      expect(enlace.getAttribute('rel') || '').toMatch(/noopener/)
    })
  })

  it('el boton de idioma apunta a la otra URL, no a un vacio', () => {
    const { container } = render(<App />)

    const botones = [...container.querySelectorAll('.lang-btn')]
    expect(botones.length).toBeGreaterThan(0)
    botones.forEach((boton) => expect(boton.getAttribute('href')).toBe('/en/'))
  })

  it('los proyectos que dicen tener codigo lo enlazan de verdad', () => {
    render(<App />)

    const portfolio = document.getElementById('portfolio')
    const enlaces = within(portfolio).getAllByRole('link')
    expect(enlaces.length).toBeGreaterThan(0)
    enlaces.forEach((enlace) => {
      expect(enlace.getAttribute('href')).toMatch(/^https?:\/\//)
    })
  })
})
