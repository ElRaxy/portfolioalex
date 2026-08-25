import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from '../App'
import i18n from '../i18n'

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

  it('hace encontrables el objetivo Full Stack y las herramientas de calidad', () => {
    render(<App pathname="/" />)

    expect(screen.getAllByText(/oportunidades Full Stack/i).length).toBeGreaterThan(0)
    const stack = screen.getByRole('region', { name: 'Stack' })
    const grupos = ['Producto web', 'Automatización aplicada', 'Calidad de entrega']

    expect(within(stack).getAllByRole('heading', { level: 3 })).toHaveLength(3)
    grupos.forEach((grupo) => {
      expect(within(stack).getByRole('heading', { name: grupo })).toBeInTheDocument()
    })
    ;['React', 'Node.js', 'Python', 'Typer', 'Jest', 'Vitest', 'React Testing Library', 'pytest', 'GitHub Actions']
      .forEach((skill) => expect(within(stack).getByText(skill)).toBeInTheDocument())
  })

  it('mantiene fuera de la narrativa publica las cifras y el lenguaje de flota', () => {
    render(<App pathname="/" />)

    const patron = /1[.,]004|1[.,]000|581|8 (?:servidores|servers)|\b(?:flota|fleet)\b/i
    const diccionarios = [
      require('../i18n/locales/es/translation.json'),
      require('../i18n/locales/en/translation.json'),
    ]

    diccionarios.forEach((diccionario) => {
      expect(JSON.stringify(diccionario)).not.toMatch(patron)
      const { experience, ...fueraDeExperiencia } = diccionario
      expect(JSON.stringify(fueraDeExperiencia)).not.toMatch(/Anuubis Solutions/i)
      expect(experience.roles.filter((rol) => /Anuubis Solutions/i.test(rol.org))).toHaveLength(1)
    })

    expect(screen.queryByText(patron)).not.toBeInTheDocument()
  })

  it('da a cada imagen de proyecto un nombre accesible propio y descriptivo', () => {
    render(<App />)

    const portfolio = screen.getByRole('region', { name: 'Mis proyectos' })
    const imagenes = within(portfolio).getAllByRole('img')

    expect(imagenes).toHaveLength(3)
    imagenes.forEach((imagen) => {
      // Antes se exigia /\S{10,}/, que en realidad medía la palabra mas
      // larga: un texto bueno sin ninguna palabra de 10 letras lo suspendia.
      // Lo que hace util a una descripcion es que describa, asi que se mide
      // eso: longitud y numero de palabras.
      const nombre = imagen.getAttribute('alt') || ''
      expect(nombre.trim().length).toBeGreaterThanOrEqual(20)
      expect(nombre.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4)
    })

    const nombres = imagenes.map((imagen) => imagen.getAttribute('alt'))
    expect(new Set(nombres).size).toBe(imagenes.length)
  })

  it('deja visible como pie la descripcion de cada imagen de proyecto', () => {
    render(<App />)

    const portfolio = screen.getByRole('region', { name: 'Mis proyectos' })
    const diccionario = require('../i18n/locales/es/translation.json')

    diccionario.portfolio.projects.forEach((proyecto) => {
      expect(within(portfolio).getByText(proyecto.image_caption)).toBeInTheDocument()
    })
  })

  // El PDF sale de la ruta, no del idioma de i18next: en el prerender no hay
  // navegador que detectar y las paginas inglesas servian el CV castellano.
  it.each([
    ['/', '/Alex_Mico_Robles_CV_ES.pdf'],
    ['/en/', '/Alex_Mico_Robles_CV_EN.pdf'],
    ['/proyectos/atalaya/', '/Alex_Mico_Robles_CV_ES.pdf'],
    ['/en/projects/atalaya/', '/Alex_Mico_Robles_CV_EN.pdf'],
  ])('en %s descarga el CV desde %s', (ruta, esperado) => {
    render(<App pathname={ruta} />)

    const descargas = enlacesCon(/\.pdf$/)
    expect(descargas).toHaveLength(1)
    expect(descargas[0]).toHaveAttribute('href', esperado)
    expect(descargas[0]).toHaveAttribute('download', esperado.slice(1))
  })

  it('actualiza el CV al cambiar de idioma sin recargar', async () => {
    window.history.replaceState(null, '', '/en/')
    await act(() => i18n.changeLanguage('en'))
    render(<App />)

    try {
      fireEvent.click(screen.getAllByRole('link', { name: 'Switch language to Spanish' })[0])

      await waitFor(() => expect(
        screen.getByRole('link', { name: 'Descargar CV' }),
      ).toHaveAttribute('href', '/Alex_Mico_Robles_CV_ES.pdf'), { timeout: 5000 })

      expect(screen.getByRole('link', { name: 'Descargar CV' }))
        .toHaveAttribute('download', 'Alex_Mico_Robles_CV_ES.pdf')
    } finally {
      document.documentElement.removeAttribute('data-language-transition')
      window.history.replaceState(null, '', '/')
      await act(() => i18n.changeLanguage('es'))
    }
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

  it('el selector de tema comunica y actualiza su estado accesible', () => {
    jest.useFakeTimers()
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.setAttribute('data-language-transition', 'settling')
    document.startViewTransition = jest.fn()

    try {
      render(<App />)

      const selectores = screen.getAllByRole('button', { name: /tema|theme/i })
      expect(selectores).toHaveLength(2)
      selectores.forEach((selector) => expect(selector).toHaveAttribute('aria-pressed', 'true'))

      fireEvent.click(selectores[0])

      selectores.forEach((selector) => expect(selector).toHaveAttribute('aria-pressed', 'false'))
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
      expect(document.documentElement).toHaveAttribute('data-theme-transition')
      expect(document.startViewTransition).not.toHaveBeenCalled()

      fireEvent.click(selectores[1])
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')

      act(() => jest.advanceTimersByTime(420))
      expect(document.documentElement).not.toHaveAttribute('data-theme-transition')
    } finally {
      delete document.startViewTransition
      document.documentElement.removeAttribute('data-theme-transition')
      document.documentElement.removeAttribute('data-language-transition')
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    }
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

  it('conserva las tarjetas animadas al traducir contenido ya revelado', async () => {
    await act(() => i18n.changeLanguage('es'))
    render(<App pathname="/" />)

    const articuloPorTitulo = (nombre) => screen.getAllByRole('article')
      .find((articulo) => within(articulo).queryByRole('heading', { name: nombre }))
    const experienciaPorRol = (nombre) => within(
      screen.getByRole('region', { name: /Experiencia|Experience/i }),
    ).getAllByRole('listitem')
      .find((item) => within(item).queryByText(nombre))

    const proyecto = articuloPorTitulo('SaveMyMoneyNow')
    const experiencia = experienciaPorRol('Desarrollador Full Stack')

    try {
      await act(() => i18n.changeLanguage('en'))

      expect(articuloPorTitulo('SaveMyMoneyNow')).toBe(proyecto)
      expect(experienciaPorRol('Full Stack Developer')).toBe(experiencia)
    } finally {
      await act(() => i18n.changeLanguage('es'))
    }
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
  it('la navegación lateral sigue el orden real de las secciones', () => {
    render(<App />)

    const navegacion = screen.getByRole('navigation', { name: 'Navegación por secciones' })
    const etiquetas = within(navegacion).getAllByRole('link')
      .map((enlace) => enlace.textContent.trim())

    expect(etiquetas).toEqual(['Proyectos', 'Sobre Mí', 'Experiencia', 'Stack', 'Contacto'])
  })

  it('el idioma va antes que el hero en el orden de tabulacion', () => {
    render(<App />)

    // `getAllByRole` devuelve los elementos en orden del documento, que es el
    // mismo que sigue el tabulador mientras nadie toque `tabindex`.
    const enlaces = screen.getAllByRole('link')
    const idioma = enlaces.findIndex((enlace) => (
      /Cambiar idioma/i.test(enlace.getAttribute('aria-label') || '')
    ))
    const verProyectos = enlaces.findIndex((enlace) => enlace.textContent === 'Ver proyectos')

    expect(idioma).toBeGreaterThanOrEqual(0)
    expect(verProyectos).toBeGreaterThan(idioma)
  })

  it('los controles clave conservan un objetivo tactil de 44 px', () => {
    const fs = require('fs')
    const path = require('path')
    const navCss = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'nav', 'nav.css'), 'utf8',
    )
    const caseCss = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'caseStudy', 'caseStudy.css'), 'utf8',
    )

    const marca = navCss.match(/\.portfolio-nav__brand \{[\s\S]*?\n {2}\}/)
    const idioma = navCss.match(
      /\.portfolio-nav__controls \.lang-btn,\s*\n\s*\.portfolio-nav__controls \.language-selector__option \{[\s\S]*?\n {2}\}/,
    )
    const tema = navCss.match(/\.portfolio-nav__controls \.theme-toggle \{[\s\S]*?\n {2}\}/)
    const volver = caseCss.match(/\.case__back \{[\s\S]*?\n\}/)
    const accion = caseCss.match(/\.case__link \{[\s\S]*?\n\}/)

    expect(marca).not.toBeNull()
    expect(marca[0]).toMatch(/min-height:\s*44px/)
    expect(idioma).not.toBeNull()
    expect(idioma[0]).toMatch(/min-width:\s*44px/)
    expect(idioma[0]).toMatch(/height:\s*44px/)
    expect(tema).not.toBeNull()
    expect(tema[0]).toMatch(/width:\s*44px/)
    expect(tema[0]).toMatch(/height:\s*44px/)
    expect(volver).not.toBeNull()
    expect(volver[0]).toMatch(/min-height:\s*44px/)
    expect(accion).not.toBeNull()
    expect(accion[0]).toMatch(/min-height:\s*44px/)
  })
})

// El 2026-08-22 se vio que las 8 paginas de caso servian `#about`, `#portfolio`,
// `#experience`, `#stack` y `#portfolio` (el CTA) apuntando a secciones que en
// ese HTML no existen: la nav leia la ruta de `window`, que en el prerender no
// hay, asi que todo se prerenderizaba como si fuera la portada. La ruta ahora
// baja por contexto desde App, que es quien la sabe.
describe('las anclas de una pagina de caso apuntan a la portada', () => {
  it('ninguna ancla queda suelta cuando la ruta es un caso', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    expect(enlacesCon(/^#/)).toEqual([])
  })

  it('la portada conserva sus anclas locales', () => {
    render(<App pathname="/" />)

    const locales = enlacesCon(/^#/).map((enlace) => enlace.getAttribute('href'))
    expect(locales).toEqual(expect.arrayContaining(['#about', '#portfolio', '#contact']))
  })

  // Dos h1 en el mismo documento dejan la pagina sin titulo principal.
  it('la pagina de caso tiene un solo h1 y es el titulo del caso', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveTextContent('Atalaya')
    expect(screen.getByText('Alex Micó Robles')).toBeInTheDocument()
  })
})

// El selector de idioma leia la ruta de `window`, que en el prerender no
// existe: las 8 paginas de caso servian el enlace a la portada inglesa en vez
// de al caso traducido, y el href servido no coincidia con el que calculaba el
// cliente al hidratar.
describe('el selector de idioma apunta a la traduccion de la pagina', () => {
  const hrefDelSelector = () => screen.getAllByRole('link')
    .find((enlace) => /Cambiar idioma|Switch language/i.test(
      enlace.getAttribute('aria-label') || '',
    ))
    .getAttribute('href')

  it('en un caso lleva al mismo caso en el otro idioma', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    expect(hrefDelSelector()).toBe('/en/projects/atalaya/')
  })

  it('en la portada lleva a la portada del otro idioma', () => {
    render(<App pathname="/" />)

    expect(hrefDelSelector()).toBe('/en/')
  })
})

// Hallazgo 7 de la auditoria del 22/08: ningun encabezado se entendia fuera de
// su pagina y no habia un bloque corto que respondiera "que es esto". Un
// extractor que se lleva una seccion suelta necesita las dos cosas.
//
// Variante 1 del 23/08: quien lleva el nombre es la prosa, no el rotulo. Un
// extractor que levanta un pasaje se lleva el texto del pasaje, no el
// encabezado de arriba, asi que el rotulo lo repetia para nadie y de paso
// tartamudeaba tres veces seguidas. La cobertura no baja: el resumen ya se
// nombraba solo y al problema se le anadio la frase que le faltaba.
//
// Rail de ambito del 23/08: quedaban dos bloques cuyos pasajes no se nombran ni
// en el rotulo ni en el cuerpo, y son los mas citables de la pagina ("174
// tests", "Los duplicados los corta la base de datos"). Esos dos, y solo esos,
// abren con el nombre en un span visible: en aria-label o en sr-only el
// extractor no lo ve, medido con defuddle.
describe('cada seccion se entiende fuera de su pagina', () => {
  it('solo las decisiones y los numeros abren con el nombre del proyecto', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    const titulos = screen.getAllByRole('heading', { level: 2 })
      .map((titulo) => titulo.textContent)
    const delCaso = titulos.filter((texto) => !/Contáctame/i.test(texto))

    expect(delCaso.length).toBeGreaterThanOrEqual(4)
    // Es el mismo hecho que cuenta scripts/check-prerender.mjs en las ocho
    // paginas del build; aqui se mide sobre el arbol renderizado. El nombre va
    // en el texto del encabezado, no en un atributo: si alguien lo esconde,
    // esta lista se queda vacia y el test cae.
    expect(delCaso.filter((texto) => /Atalaya/.test(texto)))
      .toEqual(['Atalaya Cómo funciona', 'Atalaya Dónde está el listón'])
  })

  it('el resumen y el problema de cada caso nombran el proyecto en su texto', () => {
    const { CASE_SLUGS } = require('../lib/routing')

    ;['es', 'en'].forEach((idioma) => {
      const diccionario = require(`../i18n/locales/${idioma}/translation.json`)

      CASE_SLUGS.forEach((slug) => {
        const caso = diccionario.case_study.cases[slug]
        const nombre = caso.short.toLowerCase()

        expect(caso.summary.toLowerCase()).toContain(nombre)
        expect(caso.problem.join(' ').toLowerCase()).toContain(nombre)
      })
    })
  })

  it('no publica una comparativa de competidores sin fuentes enlazadas', () => {
    render(<App pathname="/proyectos/atalaya/" />)
    expect(screen.queryByRole('heading', { name: /Por qué no valía/ })).toBeNull()
  })

  it('el caso abre con un bloque que dice que es el proyecto', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    const resumen = screen.getByText(/^Atalaya es un CLI en Python/)
    expect(resumen).toBeInTheDocument()
    expect(resumen.textContent.split(/\s+/).length).toBeLessThanOrEqual(60)
  })

  it('la portada sirve los datos de contacto como lista de definiciones', () => {
    render(<App pathname="/" />)

    // El bloque de contacto tiene su propia lista, asi que se busca dentro de
    // la seccion.
    const sobreMi = within(screen.getByRole('region', { name: 'Sobre mí' }))
    const terminos = sobreMi.getAllByRole('term').map((termino) => termino.textContent)
    const valores = sobreMi.getAllByRole('definition')

    expect(terminos).toEqual(['Dónde', 'Disponible', 'Stack', 'Idiomas'])
    expect(valores).toHaveLength(4)
    expect(valores.every((valor) => valor.textContent.trim().length > 0)).toBe(true)
  })

  it('el primer parrafo de Sobre mi se nombra a si mismo', () => {
    render(<App pathname="/" />)

    expect(screen.getByText(/^Soy Alex,/)).toBeInTheDocument()
  })
})

// Las paginas de caso son URLs propias y prerenderizadas: lo que se vigila aqui
// es que la ruta elija la pagina correcta y que el contenido llegue entero.
describe('paginas de caso de estudio', () => {
  const { parseRoute, caseHref, CASE_SLUGS } = require('../lib/routing')

  it.each([
    ['savemymoneynow', 'savemymoneynow-detection.png'],
    ['strev', 'strev-product.png'],
    ['atalaya', 'atalaya-health.svg'],
  ])('muestra evidencia real en el caso %s', (slug, asset) => {
    const diccionario = require('../i18n/locales/es/translation.json')
    const proyecto = diccionario.portfolio.projects.find((item) => item.slug === slug)

    render(<App pathname={`/proyectos/${slug}/`} />)

    const caso = screen.getByRole('article')
    const imagen = within(caso).getByRole('img', { name: proyecto.image_alt })
    expect(imagen).toHaveAttribute('src', asset)
    expect(within(caso).getByText(proyecto.image_caption)).toBeInTheDocument()
  })

  it('no depende de diagramas ni terminales sinteticos', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'caseStudy', 'CaseStudy.jsx'),
      'utf8',
    )

    expect(source).not.toMatch(/ProjectDiagram|TypewriterTerminal/)
  })

  it('reconoce las rutas de caso en los dos idiomas y descarta las inventadas', () => {
    expect(parseRoute('/proyectos/atalaya/')).toEqual({ kind: 'case', language: 'es', slug: 'atalaya' })
    expect(parseRoute('/en/projects/strev/')).toEqual({ kind: 'case', language: 'en', slug: 'strev' })
    expect(parseRoute('/proyectos/atalaya')).toEqual({ kind: 'case', language: 'es', slug: 'atalaya' })
    expect(parseRoute('/proyectos/wordpress/').kind).toBe('home')
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

    expect(slugs).toEqual(['savemymoneynow', 'strev', 'atalaya'])
    expect(CASE_SLUGS).toEqual(slugs)
    expect(diccionario.portfolio.projects.filter((proyecto) => proyecto.featured).map((proyecto) => proyecto.slug))
      .toEqual(['savemymoneynow'])
    expect(slugs.filter(Boolean)).toHaveLength(diccionario.portfolio.projects.length)
    slugs.forEach((slug) => expect(CASE_SLUGS).toContain(slug))
    expect(caseHref('es', 'atalaya')).toBe('/proyectos/atalaya/')
    expect(caseHref('en', 'atalaya')).toBe('/en/projects/atalaya/')
  })
})
