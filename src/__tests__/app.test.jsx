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

// El 2026-08-22 se midio que el elemento LCP de la home, en movil y en
// escritorio, es un parrafo del bloque "Sobre mi". Envuelto en Reveal nacia con
// `opacity:0` inline en el prerender y no se pintaba hasta que hidrataba el
// bundle: el LCP llegaba ~480 ms despues del FCP. Su entrada vive ahora en el
// CSS y no toca la opacidad, porque un bloque a opacity 0 tampoco cuenta como
// pintado. Se vigila desde el fuente: en jsdom no hay cascada que medir.
describe('el bloque LCP no espera al JavaScript', () => {
  const fs = require('fs')
  const path = require('path')
  const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

  it('Sobre mi no se envuelve en Reveal', () => {
    expect(leer('componets', 'about', 'About.jsx')).not.toMatch(/^import .*Reveal/m)
  })

  it('su entrada por CSS anima el desplazamiento, nunca la opacidad', () => {
    const css = leer('componets', 'about', 'about.css')

    const keyframes = css.match(/@keyframes about-block-in\s*\{[\s\S]*?\n\}/)
    expect(keyframes).not.toBeNull()
    expect(keyframes[0]).toMatch(/transform/)
    expect(keyframes[0]).not.toMatch(/opacity/)

    const reglas = css.match(/\.js \.about__title,[\s\S]*?\n\}/)
    expect(reglas).not.toBeNull()
    expect(reglas[0]).not.toMatch(/opacity/)
  })
})

// El 2026-08-22 se midio que idioma y tema eran las paradas 11 y 12 del
// tabulador en escritorio estando en la posicion mas alta de la pagina
// (WCAG 2.4.3): vivian dentro del <main>, despues del hero y de la nav
// lateral. El orden de foco lo fija el DOM, no la rejilla, asi que la
// comprobacion es sobre el DOM.
describe('el orden de foco sigue al orden visual', () => {
  it('idioma y tema van antes que el hero en el documento', () => {
    const { container } = render(<App />)

    const controles = container.querySelector('.site-shell__controls')
    const sidebar = container.querySelector('.site-shell__sidebar')

    expect(controles).not.toBeNull()
    expect(sidebar).not.toBeNull()
    // eslint-disable-next-line no-bitwise
    const vaAntes = controles.compareDocumentPosition(sidebar) & Node.DOCUMENT_POSITION_FOLLOWING
    expect(vaAntes).toBeTruthy()
  })

  // WCAG 2.5.8 (AA en 2.2): 24x24 px. Era la unica zona pulsable por debajo.
  it('la marca de la barra tiene al menos 24 px de alto', () => {
    const fs = require('fs')
    const path = require('path')
    const css = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'nav', 'nav.css'), 'utf8',
    )

    const regla = css.match(/\.portfolio-nav__brand \{[\s\S]*?\n  \}/)
    expect(regla).not.toBeNull()
    expect(regla[0]).toMatch(/min-height:\s*24px/)
  })
})

// El 2026-08-22 se vio que las 8 paginas de caso servian `#about`, `#portfolio`,
// `#experience`, `#stack` y `#portfolio` (el CTA) apuntando a secciones que en
// ese HTML no existen: la nav leia la ruta de `window`, que en el prerender no
// hay, asi que todo se prerenderizaba como si fuera la portada. La ruta ahora
// baja por contexto desde App, que es quien la sabe.
describe('las anclas de una pagina de caso apuntan a la portada', () => {
  it('ninguna ancla queda suelta cuando la ruta es un caso', () => {
    const { container } = render(<App pathname="/proyectos/atalaya/" />)

    const sueltas = [...container.querySelectorAll('a[href^="#"]')]
      .map((enlace) => enlace.getAttribute('href'))

    expect(sueltas).toEqual([])
  })

  it('la portada conserva sus anclas locales', () => {
    const { container } = render(<App pathname="/" />)

    const locales = [...container.querySelectorAll('a[href^="#"]')]
      .map((enlace) => enlace.getAttribute('href'))

    expect(locales).toEqual(expect.arrayContaining(['#about', '#portfolio', '#contact']))
  })

  // Dos h1 en el mismo documento dejan la pagina sin titulo principal.
  it('la pagina de caso tiene un solo h1 y es el titulo del caso', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveTextContent('Atalaya')
    // El nombre sigue anunciandose, ahora como imagen con su etiqueta.
    expect(screen.getByRole('img', { name: 'Alex Micó Robles' })).toBeInTheDocument()
  })
})

// Hallazgo 7 de la auditoria del 22/08: ningun encabezado se entendia fuera de
// su pagina y no habia un bloque corto que respondiera "que es esto". Un
// extractor que se lleva una seccion suelta necesita las dos cosas.
describe('cada seccion se entiende fuera de su pagina', () => {
  it('los encabezados de un caso nombran el proyecto', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    const titulos = screen.getAllByRole('heading', { level: 2 })
      .map((titulo) => titulo.textContent)
    const delCaso = titulos.filter((texto) => !/Contáctame/i.test(texto))

    expect(delCaso.length).toBeGreaterThanOrEqual(4)
    delCaso.forEach((texto) => expect(texto).toMatch(/Atalaya/))
  })

  it('el caso abre con un bloque que dice que es el proyecto', () => {
    const { container } = render(<App pathname="/proyectos/atalaya/" />)

    const resumen = container.querySelector('.case__summary')
    expect(resumen).not.toBeNull()
    expect(resumen.textContent).toMatch(/^Atalaya es/)
    expect(resumen.textContent.split(/\s+/).length).toBeLessThanOrEqual(60)
  })

  it('la portada sirve los datos de contacto como lista de definiciones', () => {
    const { container } = render(<App pathname="/" />)

    const terminos = [...container.querySelectorAll('.about__facts dt')]
      .map((termino) => termino.textContent)
    const valores = [...container.querySelectorAll('.about__facts dd')]

    expect(terminos).toEqual(['Dónde', 'Disponible', 'Stack', 'Idiomas'])
    expect(valores).toHaveLength(4)
    expect(valores.every((valor) => valor.textContent.trim().length > 0)).toBe(true)
  })

  it('el primer parrafo de Sobre mi se nombra a si mismo', () => {
    const { container } = render(<App pathname="/" />)

    expect(container.querySelector('.about__lead').textContent).toMatch(/Alex Micó Robles/)
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
