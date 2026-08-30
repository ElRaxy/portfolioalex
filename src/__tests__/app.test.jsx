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

    const secciones = ['Sobre mí', 'Trabajo seleccionado', 'Experiencia', 'Stack', 'Contáctame']
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

    const portfolio = screen.getByRole('region', { name: 'Trabajo seleccionado' })
    const imagenes = within(portfolio).getAllByRole('img')

    expect(imagenes).toHaveLength(4)
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

    const portfolio = screen.getByRole('region', { name: 'Trabajo seleccionado' })
    const diccionario = require('../i18n/locales/es/translation.json')

    diccionario.portfolio.projects.forEach((proyecto) => {
      expect(within(portfolio).getByText(proyecto.image_caption)).toBeInTheDocument()
    })
  })

  it('presenta Sereno como proyecto completo y enlaza su caso, codigo y release', () => {
    render(<App />)

    const portfolio = screen.getByRole('region', { name: 'Trabajo seleccionado' })
    const sereno = within(portfolio).getAllByRole('article')
      .find((article) => within(article).queryByRole('heading', { name: 'Sereno' }))

    expect(sereno).toBeDefined()
    expect(within(sereno).getByRole('link', { name: 'Ver el caso' }))
      .toHaveAttribute('href', '/proyectos/sereno/')
    expect(within(sereno).getByRole('link', { name: 'Código' }))
      .toHaveAttribute('href', 'https://github.com/ElRaxy/sereno')
    expect(within(sereno).getByRole('link', { name: 'Última versión' }))
      .toHaveAttribute('href', 'https://github.com/ElRaxy/sereno/releases/latest')

    const diccionario = require('../i18n/locales/es/translation.json')
    expect(diccionario.portfolio.side_project).toBeUndefined()
  })

  // El PDF sale de la ruta, no del idioma de i18next: en el prerender no hay
  // navegador que detectar y las paginas inglesas servian el CV castellano.
  it.each([
    ['/', '/Alex_Mico_Robles_CV_ES.pdf'],
    ['/en/', '/Alex_Mico_Robles_CV_EN.pdf'],
    ['/proyectos/atalaya/', '/Alex_Mico_Robles_CV_ES.pdf'],
    ['/en/projects/atalaya/', '/Alex_Mico_Robles_CV_EN.pdf'],
    ['/proyectos/sereno/', '/Alex_Mico_Robles_CV_ES.pdf'],
    ['/en/projects/sereno/', '/Alex_Mico_Robles_CV_EN.pdf'],
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
      expect(selectores).toHaveLength(1)
      expect(selectores[0]).toHaveAttribute('aria-pressed', 'true')

      fireEvent.click(selectores[0])

      expect(selectores[0]).toHaveAttribute('aria-pressed', 'false')
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
      expect(document.documentElement).toHaveAttribute('data-theme-transition')
      expect(document.startViewTransition).not.toHaveBeenCalled()

      act(() => jest.advanceTimersByTime(260))
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

    const portfolio = screen.getByRole('region', { name: 'Trabajo seleccionado' })
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

  it('conserva los nodos de proyecto al traducir contenido ya revelado', async () => {
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

describe('el casebook usa movimiento como señal y no como bloqueo', () => {
  const fs = require('fs')
  const path = require('path')
  const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

  it('liga una línea de la masthead al progreso global y la retira con reduced motion', () => {
    const nav = leer('componets', 'nav', 'Nav.jsx')
    const css = leer('componets', 'nav', 'nav.css')

    expect(nav).toMatch(/const \{ scrollYProgress \} = useScroll\(\)/)
    expect(nav).toMatch(/useSpring\(scrollYProgress/)
    expect(nav).toMatch(/className="portfolio-nav__progress"/)
    expect(nav).toMatch(/originX:\s*0/)
    expect(css).toMatch(/\.portfolio-nav__progress\s*\{[\s\S]*?height:\s*1px/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.portfolio-nav__progress\s*\{[\s\S]*?display:\s*none/)
  })

  it('reserva el progreso local para Strev y Sereno y anima solo la media interior', () => {
    render(<App pathname="/" />)

    const portfolio = screen.getByRole('region', { name: 'Trabajo seleccionado' })
    const articulos = within(portfolio).getAllByRole('article')
    const principales = articulos.filter((article) => article.dataset.tier === 'primary')
    const secundarios = articulos.filter((article) => article.dataset.tier === 'supporting')

    expect(principales).toHaveLength(2)
    principales.forEach((article) => {
      expect(article.querySelector('.portfolio__media-motion')).toBeInTheDocument()
      expect(article.querySelector('.portfolio__chapter-progress')).toBeInTheDocument()
    })
    secundarios.forEach((article) => {
      expect(article.querySelector('.portfolio__media-motion')).not.toBeInTheDocument()
      expect(article.querySelector('.portfolio__chapter-progress')).not.toBeInTheDocument()
    })

    const source = leer('componets', 'portfolio', 'Portfolio.jsx')
    expect(source.match(/useScroll\(\{/g)).toHaveLength(1)
    expect(source).toMatch(/target:\s*cardRef/)
    expect(source).toMatch(/\[-3, 0, 3\]/)
    expect(source).toMatch(/\[1, 1\.018, 1\]/)
    expect(source).not.toMatch(/opacity/)

    const css = leer('componets', 'portfolio', 'portfolio.css')
    expect(css).toMatch(/\.portfolio__media-motion\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*-4px/)
    expect(css).not.toMatch(/\.portfolio__item:hover \.portfolio__media img/)
  })

  it('invierte Sereno solo en escritorio y anula los transforms en móvil', () => {
    const css = leer('componets', 'portfolio', 'portfolio.css')

    expect(css).toMatch(/\.portfolio__item--sereno \.portfolio__media\s*\{[\s\S]*?grid-column:\s*2/)
    expect(css).toMatch(/\.portfolio__item--sereno \.portfolio__body\s*\{[\s\S]*?grid-column:\s*1/)
    expect(css).toMatch(/@media screen and \(max-width: 860px\)[\s\S]*?\.portfolio__item--sereno \.portfolio__media,[\s\S]*?grid-column:\s*1/)
    expect(css).toMatch(/@media screen and \(max-width: 860px\)[\s\S]*?\.portfolio__media-motion,[\s\S]*?transform:\s*none !important/)
  })

  it('revela contenido visible con un gesto breve y adelantado', () => {
    const source = leer('componets', 'common', 'Reveal.jsx')

    expect(source).not.toMatch(/opacity:\s*0/)
    expect(source).not.toMatch(/y:\s*(?:9|1[0-9])/)
    expect(source).toMatch(/duration:\s*0\.22/)
    expect(source).toMatch(/staggerChildren:\s*0\.02/)
    expect(source).toMatch(/margin:\s*'0px 0px 12% 0px'/)
  })

  it('abre y cierra el menú sin display brusco y deja reduced motion estático', () => {
    const css = leer('componets', 'nav', 'nav.css')
    const menuClosed = css.match(/\.portfolio-nav__links\s*\{[\s\S]*?\n\s*\}/g)
      ?.find((rule) => rule.includes('visibility: hidden'))

    expect(menuClosed).toBeDefined()
    expect(css).toMatch(/\.portfolio-nav__links\s*\{[\s\S]*?visibility:\s*hidden/)
    expect(css).toMatch(/\.portfolio-nav__links--open\s*\{[\s\S]*?visibility:\s*visible/)
    expect(css).toMatch(/opacity 180ms ease/)
    expect(css).toMatch(/transition-duration:\s*200ms, 200ms, 0s/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.portfolio-nav__links,[\s\S]*?transition:\s*none/)
    expect(menuClosed).not.toMatch(/display:\s*none/)
  })

  it('acorta tema e idioma y presenta Stack como un ledger responsive', () => {
    const theme = leer('componets', 'theme', 'ThemeToggle.jsx')
    const index = leer('index.css')
    const language = leer('componets', 'language', 'language.css')
    const experience = leer('componets', 'experience', 'experience.css')

    expect(theme).toMatch(/THEME_TRANSITION_MS = 260/)
    expect(index).not.toMatch(/:root\[data-theme-transition\][\s\S]*?360ms/)
    expect(index).toMatch(/:root\[data-theme-transition\][\s\S]*?260ms/)
    expect(language).toMatch(/language-content-settle 190ms/)
    expect(language).toMatch(/prefers-reduced-motion: reduce[\s\S]*?animation:\s*none/)

    const grupo = experience.match(/\.stack__group\s*\{[\s\S]*?\n\}/)
    expect(grupo).not.toBeNull()
    expect(grupo[0]).toMatch(/display:\s*grid/)
    expect(grupo[0]).toMatch(/grid-template-columns:\s*minmax\(10rem, 0\.32fr\) minmax\(0, 0\.68fr\)/)
    expect(grupo[0]).toMatch(/border-top:\s*1px solid var\(--line-soft\)/)
    expect(experience).toMatch(/max-width: 600px[\s\S]*?\.stack__group\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(experience).not.toMatch(/\.stack\s*\{[^}]*min-height/)
    expect(experience).not.toMatch(/opacity:\s*0/)
  })
})

// La masthead es la unica navegacion y contiene los unicos controles de idioma
// y tema. Su orden en el DOM tiene que coincidir con el orden visual.
describe('el orden de foco sigue al orden visual', () => {
  it('la masthead sigue el orden real de las secciones', () => {
    render(<App />)

    const navegacion = screen.getByRole('navigation', { name: 'Navegación por secciones' })
    const etiquetas = within(navegacion).getAllByRole('link')
      .map((enlace) => enlace.textContent.trim())

    expect(etiquetas).toEqual([
      'Alex Micó',
      'Proyectos',
      'Sobre Mí',
      'Experiencia',
      'Stack',
      'Contacto',
      'EN',
    ])
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

  it('resume la marca en la masthead y conserva el nombre completo como H1', () => {
    render(<App pathname="/" />)

    const navegacion = screen.getByRole('navigation', { name: 'Navegación por secciones' })
    expect(within(navegacion).getByRole('link', { name: 'Alex Micó' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Alex Micó Robles' })).toBeInTheDocument()

    const fs = require('fs')
    const path = require('path')
    const navCss = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'nav', 'nav.css'), 'utf8',
    )
    const brandRules = [...navCss.matchAll(/\.portfolio-nav__brand\s*\{([^}]*)\}/g)]
      .map((match) => match[1])
    expect(brandRules.join('\n')).not.toMatch(/overflow|text-overflow/)
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

    const marca = navCss.match(/\.portfolio-nav__brand \{[\s\S]*?\n\}/)
    const idioma = navCss.match(
      /\.portfolio-nav__controls \.lang-btn,\s*\n\s*\.portfolio-nav__controls \.language-selector__option \{[\s\S]*?\n\}/,
    )
    const tema = navCss.match(/\.portfolio-nav__controls \.theme-toggle \{[\s\S]*?\n\}/)
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

// El 2026-08-22 se vio que las paginas de caso servian `#about`, `#portfolio`,
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
    expect(screen.getByText('Alex Micó')).toBeInTheDocument()
  })
})

// El selector de idioma leia la ruta de `window`, que en el prerender no
// existe: las paginas de caso servian el enlace a la portada inglesa en vez
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

  it('mantiene Sereno en la misma ruta al pasar al ingles', () => {
    render(<App pathname="/proyectos/sereno/" />)

    expect(hrefDelSelector()).toBe('/en/projects/sereno/')
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
    // Es el mismo hecho que cuenta scripts/check-prerender.mjs en las diez
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

  it('Sobre mi sostiene la narrativa de Strev y Sereno en ambos idiomas', () => {
    ;['es', 'en'].forEach((idioma) => {
      const { about } = require(`../i18n/locales/${idioma}/translation.json`)
      const texto = [about.lead, about.p2, about.p3].join(' ')

      expect(texto).toMatch(/\bStrev\b/)
      expect(texto).toMatch(/\bSereno\b/)
      expect(texto).not.toMatch(/—/)
    })
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
    ['sereno', 'sereno-session-overview.webp'],
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
    expect(parseRoute('/proyectos/sereno/')).toEqual({ kind: 'case', language: 'es', slug: 'sereno' })
    expect(parseRoute('/en/projects/sereno/')).toEqual({ kind: 'case', language: 'en', slug: 'sereno' })
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

  it('mantiene el contrato factual de Sereno en los dos idiomas', () => {
    const es = require('../i18n/locales/es/translation.json').case_study.cases.sereno
    const en = require('../i18n/locales/en/translation.json').case_study.cases.sereno

    expect(es.results.map((result) => result.value)).toEqual(['1 archivo', '0 dependencias', '4 CLI'])
    expect(en.results.map((result) => result.value)).toEqual(['1 file', '0 dependencies', '4 CLIs'])
    expect(es.decisions).toHaveLength(en.decisions.length)
    expect(es.decisions).toHaveLength(5)
    expect(JSON.stringify([es, en])).toMatch(/tool_use/)
    expect(JSON.stringify([es, en])).toMatch(/tool_result/)
    expect(JSON.stringify([es, en])).toMatch(/stop_reason/)
    expect(JSON.stringify([es, en])).not.toMatch(/[—]/)
  })

  it('cada proyecto de la portada enlaza a su caso', () => {
    const diccionario = require('../i18n/locales/es/translation.json')
    const slugs = diccionario.portfolio.projects.map((proyecto) => proyecto.slug)

    expect(slugs).toEqual(['strev', 'sereno', 'savemymoneynow', 'atalaya'])
    expect(new Set(CASE_SLUGS)).toEqual(new Set(slugs))
    expect(diccionario.portfolio.projects.filter((proyecto) => proyecto.tier === 'primary').map((proyecto) => proyecto.slug))
      .toEqual(['strev', 'sereno'])
    expect(diccionario.portfolio.projects.filter((proyecto) => proyecto.tier === 'supporting').map((proyecto) => proyecto.slug))
      .toEqual(['savemymoneynow', 'atalaya'])
    expect(slugs.filter(Boolean)).toHaveLength(diccionario.portfolio.projects.length)
    slugs.forEach((slug) => expect(CASE_SLUGS).toContain(slug))
    expect(caseHref('es', 'atalaya')).toBe('/proyectos/atalaya/')
    expect(caseHref('en', 'atalaya')).toBe('/en/projects/atalaya/')
    expect(caseHref('es', 'sereno')).toBe('/proyectos/sereno/')
    expect(caseHref('en', 'sereno')).toBe('/en/projects/sereno/')
  })

  it('da el mismo contrato visual a Strev y Sereno y respeta movimiento reducido', () => {
    render(<App pathname="/" />)

    const portfolio = screen.getByRole('region', { name: 'Trabajo seleccionado' })
    const principales = within(portfolio).getAllByRole('article')
      .filter((article) => article.getAttribute('data-tier') === 'primary')

    expect(principales).toHaveLength(2)
    expect(principales.map((article) => (
      within(article).getByRole('heading', { level: 3 }).textContent
    ))).toEqual(['Strev', 'Sereno'])
    principales.forEach((article) => expect(article).toHaveClass('portfolio__item--primary'))

    const sereno = principales[1]
    expect(within(sereno).getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('sereno-demo.webp'),
    )
    expect(sereno.querySelector('source[media="(prefers-reduced-motion: reduce)"]'))
      .toHaveAttribute('srcset', expect.stringContaining('sereno-session-overview.webp'))
  })
})
