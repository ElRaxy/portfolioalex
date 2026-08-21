import React from 'react'
import { render, screen, within } from '@testing-library/react'
import App from '../App'
import '../i18n'

const enlacesCon = (patron) => screen.getAllByRole('link')
  .filter((enlace) => patron.test(enlace.getAttribute('href') || ''))

describe('la web entera', () => {
  it('pinta el nombre como unico H1', () => {
    render(<App />)

    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveAccessibleName('Alex Micó Robles')
  })

  // Por rol `region` y no por id: obliga a que cada seccion tenga nombre
  // accesible, que es lo que la hace navegable con un lector de pantalla.
  it('monta las cinco secciones como landmarks con nombre', () => {
    render(<App />)

    const secciones = ['Sobre mí', 'Mis proyectos', 'Experiencia', 'Stack', 'Contáctame']
    secciones.forEach((nombre) => {
      expect(screen.getByRole('region', { name: nombre })).toBeInTheDocument()
    })
  })

  it('deja abiertas las tres vias de contacto, no solo el formulario', () => {
    render(<App />)

    expect(enlacesCon(/^mailto:/).length).toBeGreaterThan(0)
    expect(enlacesCon(/wa\.me|whatsapp/).length).toBeGreaterThan(0)
    expect(enlacesCon(/github\.com\/ElRaxy/).length).toBeGreaterThan(0)
  })

  // Una miniatura sin alt util es peor que ninguna: el lector de pantalla lee
  // el nombre del fichero. Y sin lazy, tres imagenes compiten con el primer paint.
  it('acompana cada proyecto que tiene captura con un alt propio y carga diferida', () => {
    render(<App />)

    const capturas = screen.getAllByRole('img')
      .filter((img) => (img.getAttribute('src') || '').startsWith('/projects/'))

    expect(capturas).toHaveLength(3)
    capturas.forEach((captura) => {
      expect(captura.getAttribute('alt')).toMatch(/\S{10,}/)
      expect(captura).toHaveAttribute('loading', 'lazy')
      expect(captura).toHaveAttribute('width', '800')
      expect(captura).toHaveAttribute('height', '500')
    })

    const textosAlternativos = capturas.map((captura) => captura.getAttribute('alt'))
    expect(new Set(textosAlternativos).size).toBe(capturas.length)
  })

  it('ofrece el CV como descarga', () => {
    render(<App />)

    expect(enlacesCon(/\.pdf$/).length).toBeGreaterThan(0)
  })

  it('no deja ningun enlace externo sin rel de seguridad', () => {
    render(<App />)

    const externos = screen.getAllByRole('link')
      .filter((enlace) => enlace.getAttribute('target') === '_blank')

    expect(externos.length).toBeGreaterThan(0)
    externos.forEach((enlace) => {
      expect(enlace.getAttribute('rel') || '').toMatch(/noopener/)
    })
  })

  it('el boton de idioma apunta a la otra URL, no a un vacio', () => {
    render(<App />)

    const botones = screen.getAllByRole('link', { name: /cambiar idioma|switch language/i })
    expect(botones.length).toBeGreaterThan(0)
    botones.forEach((boton) => expect(boton).toHaveAttribute('href', '/en/'))
  })

  it('los proyectos que dicen tener codigo lo enlazan de verdad', () => {
    render(<App />)

    const portfolio = screen.getByRole('region', { name: 'Mis proyectos' })
    const enlaces = within(portfolio).getAllByRole('link')

    expect(enlaces.length).toBeGreaterThan(0)
    enlaces.forEach((enlace) => {
      expect(enlace.getAttribute('href')).toMatch(/^https?:\/\//)
    })
  })
})
