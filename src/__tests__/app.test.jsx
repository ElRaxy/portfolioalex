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
      // Antes se exigia /\S{10,}/, que en realidad medía la palabra mas
      // larga del alt: un texto bueno sin ninguna palabra de 10 letras lo
      // suspendia. Lo que hace util a un alt es que describa, asi que se
      // mide eso: longitud y numero de palabras.
      const alt = captura.getAttribute('alt') || ''
      expect(alt.trim().length).toBeGreaterThanOrEqual(20)
      expect(alt.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4)
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
    // Desde que cada proyecto tiene su caso, en el pie de la tarjeta conviven
    // enlaces internos y externos: lo que se exige de cada uno es distinto.
    const destinos = enlaces.map((enlace) => enlace.getAttribute('href'))
    const internos = destinos.filter((href) => href.startsWith('/'))
    const externos = destinos.filter((href) => !href.startsWith('/'))

    expect(internos.every((href) => /^\/(proyectos|en\/projects)\/[a-z]+\/$/.test(href))).toBe(true)
    expect(externos.every((href) => /^https?:\/\//.test(href))).toBe(true)
  })
})

// El 2026-08-22 se midio en produccion que con `prefers-reduced-motion: reduce`
// los 18 envoltorios de Reveal se quedaban a `opacity: 0` para siempre: el
// prerender escribe el estilo inline y React, al hidratar sin prop `style`, no
// lo retira. La reparacion vive en el CSS, asi que se vigila desde el CSS: en
// jsdom no hay cascada real que medir.
describe('reparacion de reduced-motion', () => {
  it('el CSS devuelve la visibilidad a lo que el prerender dejo en opacity:0', () => {
    const fs = require('fs')
    const path = require('path')
    const css = fs.readFileSync(path.join(__dirname, '..', 'index.css'), 'utf8')

    const bloques = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g) || []
    const reparacion = bloques.find((bloque) => (
      bloque.includes('[style*="opacity:0"]') && bloque.includes('opacity: 1 !important')
    ))

    expect(reparacion).toBeDefined()
  })
})

// Las paginas de caso son URLs propias y prerenderizadas: lo que se vigila aqui
// es que la ruta elija la pagina correcta y que el contenido llegue entero.
describe('paginas de caso de estudio', () => {
  const { parseRoute, caseHref, CASE_SLUGS } = require('../lib/routing')

  it('reconoce las rutas de caso en los dos idiomas y descarta las inventadas', () => {
    expect(parseRoute('/proyectos/atalaya/')).toEqual({ kind: 'case', language: 'es', slug: 'atalaya' })
    expect(parseRoute('/en/projects/strev/')).toEqual({ kind: 'case', language: 'en', slug: 'strev' })
    expect(parseRoute('/proyectos/atalaya')).toEqual({ kind: 'case', language: 'es', slug: 'atalaya' })
    expect(parseRoute('/proyectos/lo-que-sea/').kind).toBe('home')
    expect(parseRoute('/').kind).toBe('home')
    expect(parseRoute('/en/')).toEqual({ kind: 'home', language: 'en', slug: null })
  })

  it('tiene contenido de caso para cada slug, en castellano y en ingles', () => {
    const idiomas = ['es', 'en']

    idiomas.forEach((idioma) => {
      const diccionario = require(`../i18n/locales/${idioma}/translation.json`)

      CASE_SLUGS.forEach((slug) => {
        const caso = diccionario.case_study.cases[slug]

        expect(caso).toBeDefined()
        expect(caso.title.length).toBeGreaterThan(0)
        expect(caso.summary.length).toBeGreaterThan(40)
        expect(caso.problem.length).toBeGreaterThanOrEqual(1)
        expect(caso.decisions.length).toBeGreaterThanOrEqual(3)
        expect(caso.results.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  it('cada proyecto de la portada enlaza a su caso', () => {
    const diccionario = require('../i18n/locales/es/translation.json')
    const slugs = diccionario.portfolio.projects.map((proyecto) => proyecto.slug)

    expect(slugs.filter(Boolean)).toHaveLength(diccionario.portfolio.projects.length)
    slugs.forEach((slug) => expect(CASE_SLUGS).toContain(slug))
    expect(caseHref('es', 'atalaya')).toBe('/proyectos/atalaya/')
    expect(caseHref('en', 'atalaya')).toBe('/en/projects/atalaya/')
  })
})
