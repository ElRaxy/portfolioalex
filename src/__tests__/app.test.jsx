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

    const secciones = ['Sobre mí', 'Lo que resuelve', 'Experiencia', 'Stack', 'Contáctame']
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

    expect(screen.getAllByText(/puestos Full Stack/i).length).toBeGreaterThan(0)
    const stack = screen.getByRole('region', { name: 'Stack' })
    const grupos = ['Producto web', 'Automatización aplicada', 'Calidad de entrega']

    expect(within(stack).getAllByRole('heading', { level: 3 })).toHaveLength(3)
    grupos.forEach((grupo) => {
      expect(within(stack).getByRole('heading', { name: grupo })).toBeInTheDocument()
    })
    ;['React', 'Node.js', 'Python', 'Typer', 'Jest', 'Vitest', 'React Testing Library', 'pytest', 'GitHub Actions']
      .forEach((skill) => expect(within(stack).getByText(skill)).toBeInTheDocument())
  })

  it('ordena experiencia y formacion con headings acordes a su nivel', () => {
    render(<App pathname="/" />)

    const experiencia = screen.getByRole('region', { name: 'Experiencia' })
    expect(within(experiencia).getAllByRole('heading', { level: 3 }).map(({ textContent }) => textContent))
      .toEqual(['Desarrollador Full Stack', 'Técnico de Soporte IT · Prácticas', 'Formación'])
    expect(within(experiencia).getAllByRole('heading', { level: 4 }).map(({ textContent }) => textContent))
      .toEqual([
        'Grado Superior en Desarrollo de Aplicaciones Web',
        'Ciclo Medio en Sistemas Microinformáticos y Redes',
      ])
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

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
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

    const porNombre = Object.fromEntries(imagenes.map((imagen) => [imagen.getAttribute('alt'), imagen]))
    expect(porNombre['SaveMyMoneyNow localizando la fila de cabecera del extracto y mapeando Fecha, Concepto e Importe'])
      .toHaveAttribute('loading', 'eager')
    expect(porNombre['Atalaya mostrando un resultado fechado de salud de sus fuentes de ofertas'])
      .toHaveAttribute('loading', 'lazy')
  })

  it('deja visible como pie la descripcion de cada imagen de proyecto', () => {
    render(<App />)

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
    const diccionario = require('../i18n/locales/es/translation.json')

    diccionario.portfolio.projects.forEach((proyecto) => {
      expect(within(portfolio).getByText(proyecto.image_caption)).toBeInTheDocument()
    })
  })

  it('presenta Sereno con dos acciones en portada y reserva la release para el caso', () => {
    const { unmount } = render(<App />)

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
    const sereno = within(portfolio).getAllByRole('article')
      .find((article) => within(article).queryByRole('heading', { name: 'Sereno' }))

    expect(sereno).toBeDefined()
    expect(within(sereno).getByRole('link', { name: 'Ver las decisiones' }))
      .toHaveAttribute('href', '/proyectos/sereno/')
    expect(within(sereno).getByRole('link', { name: 'Abrir el código' }))
      .toHaveAttribute('href', 'https://github.com/ElRaxy/sereno')
    expect(within(sereno).getAllByRole('link')).toHaveLength(2)
    expect(within(sereno).queryByRole('link', { name: 'Última versión' })).toBeNull()

    const diccionario = require('../i18n/locales/es/translation.json')
    expect(diccionario.portfolio.side_project).toBeUndefined()

    unmount()
    render(<App pathname="/proyectos/sereno/" />)
    expect(screen.getByRole('link', { name: 'Última versión' }))
      .toHaveAttribute('href', 'https://github.com/ElRaxy/sereno/releases/latest')
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
      fireEvent.click(screen.getAllByRole('link', { name: 'ES · Switch language to Spanish' })[0])

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

      const selectores = screen.getAllByRole('button', { name: 'Cambiar a tema claro' })
      expect(selectores).toHaveLength(1)
      expect(selectores[0]).not.toHaveAttribute('aria-pressed')

      fireEvent.click(selectores[0])

      expect(selectores[0]).toHaveAccessibleName('Cambiar a tema oscuro')
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
      expect(document.documentElement).toHaveAttribute('data-theme-transition')
      expect(document.startViewTransition).not.toHaveBeenCalled()

      act(() => jest.advanceTimersByTime(180))
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

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
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

describe('el escenario de producto usa movimiento como señal y no como bloqueo', () => {
  const fs = require('fs')
  const path = require('path')
  const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

  it('retira los railes de progreso de la masthead', () => {
    const nav = leer('componets', 'nav', 'Nav.jsx')
    const css = leer('componets', 'nav', 'nav.css')

    expect(nav).not.toMatch(/useScroll|useSpring|useReducedMotion|portfolio-nav__progress/)
    expect(css).not.toMatch(/\.portfolio-nav__progress/)
  })

  it('evita que el navegador salte de capitulo durante el cambio de idioma', () => {
    const css = leer('componets', 'language', 'language.css')
    expect(css).toMatch(/html\[data-language-transition\]\s*\{[\s\S]*?overflow-anchor:\s*none/)
  })

  it('conecta tres decisiones reales al progreso de scroll de cada flagship', () => {
    render(<App pathname="/" />)

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
    const articulos = within(portfolio).getAllByRole('article')
    const principales = articulos.filter((article) => article.dataset.tier === 'primary')
    const secundarios = articulos.filter((article) => article.dataset.tier === 'supporting')

    expect(principales).toHaveLength(2)
    expect(secundarios).toHaveLength(2)

    const diccionario = require('../i18n/locales/es/translation.json')
    principales.forEach((article, projectIndex) => {
      const project = diccionario.portfolio.projects[projectIndex]
      const decisions = diccionario.case_study.cases[project.slug].decisions.slice(0, 3)
      const story = within(article).getByRole('list', {
        name: diccionario.portfolio.story_label.replace('{{project}}', project.title),
      })

      expect(within(story).getAllByRole('listitem')).toHaveLength(3)
      expect(within(story).getAllByRole('heading', { level: 4 }).map(({ textContent }) => textContent))
        .toEqual(decisions.map(({ title }) => title))
      decisions.forEach(({ body }) => expect(within(story).getByText(body)).toBeInTheDocument())
    })

    const source = leer('componets', 'portfolio', 'Portfolio.jsx')
    expect(source).toMatch(/isPrimary \? \([\s\S]*?portfolio__media-motion/)
    expect(source).toMatch(/\) : \([\s\S]*?<ProjectImage/)
    expect(source).toMatch(/const PrimaryProjectCard[\s\S]*?useScroll\([\s\S]*?useMotionValueEvent\(/)
    expect(source).toMatch(/offset:\s*\['start start', 'end 70%'\]/)
    expect(source).toMatch(/latest >= 0\.67 \? 2 : latest >= 0\.34 \? 1 : 0/)
    expect(source).toMatch(/useMediaQuery\('\(min-width: 1051px\)'\)/)
    expect(source).toMatch(/useMediaQuery\('\(prefers-reduced-motion: reduce\)'\)/)
    expect(source).toMatch(/typeof window === 'undefined'/)
    expect(source).toMatch(/matchMedia\(query\)/)
    expect(source).toMatch(/addEventListener\('change'/)
    expect(source).toMatch(/const storyEnabled = isDesktopStory && !shouldReduceMotion/)
    expect(source).toMatch(/if \(!storyEnabled\)\s+setActiveStep\(0\)/)
    expect(source).toMatch(/if \(!storyEnabled\) return/)
    expect(source).toMatch(/scaleY: storyEnabled \? scrollYProgress : 0/)
    expect(source).toMatch(/aria-current=\{storyEnabled && index === activeStep \? 'step' : undefined\}/)
    expect(source).toMatch(/data-active=\{storyEnabled && index === activeStep \? true : undefined\}/)
    expect(source).not.toMatch(/useTransform|mediaScale|dynamicCrop|data-step/)
    expect(source).toMatch(/strev:[\s\S]*?position: 'center',[\s\S]*?fit: 'contain'/)
    expect(source).toMatch(/sereno:[\s\S]*?position: 'center',[\s\S]*?fit: 'contain'/)
    expect(source).toMatch(/caseStudies\?\.\[project\.slug\]\?\.decisions \|\| \[\]\)\.slice\(0, 3\)/)
    const supportingCard = source.match(/const ProjectCard = \([\s\S]*?\n\}\n\nconst PrimaryProjectCard/)
    expect(supportingCard).not.toBeNull()
    expect(supportingCard[0]).not.toMatch(/useScroll|useTransform|useMotionValueEvent/)
    expect(source).not.toMatch(/useSpring|chapter-progress|whileInView/)
    expect(source).not.toMatch(/opacity/)

    const css = leer('componets', 'portfolio', 'portfolio.css')
    expect(css).toMatch(/\.portfolio__media-motion,[\s\S]*?\.portfolio__media img\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%/)
    expect(css).not.toMatch(/--media-position|\.portfolio__media-motion\[data-step|transform:\s*scale\(/)
    expect(css).not.toMatch(/object-position\s+\d+ms|\.portfolio__item--supporting[^}]+transform:\s*scale\(/)
    expect(css).not.toMatch(/portfolio__chapter-progress|will-change/)
    expect(css).not.toMatch(/\.portfolio__item:hover \.portfolio__media img/)
  })

  it('da ritmo editorial al paso activo sin duplicarlo ni mover la evidencia', () => {
    render(<App pathname="/" />)

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
    const principales = within(portfolio).getAllByRole('article')
      .filter((article) => article.dataset.tier === 'primary')
    const diccionario = require('../i18n/locales/es/translation.json')

    principales.forEach((article, projectIndex) => {
      const project = diccionario.portfolio.projects[projectIndex]
      const firstDecision = diccionario.case_study.cases[project.slug].decisions[0]

      expect(within(article).getAllByText(firstDecision.title)).toHaveLength(1)
      expect(within(article).getByText(project.image_caption, { selector: 'figcaption' }))
        .toBeInTheDocument()
    })

    const source = leer('componets', 'portfolio', 'Portfolio.jsx')
    expect(source).not.toMatch(/portfolio__chapter-label/)

    const css = leer('componets', 'portfolio', 'portfolio.css')
    const motionStart = css.indexOf('.portfolio__story-step h4')
    const motionEnd = css.indexOf('.portfolio__tags')
    const motionRules = css.slice(motionStart, motionEnd)

    expect(motionStart).toBeGreaterThan(-1)
    expect(motionEnd).toBeGreaterThan(motionStart)
    expect(motionRules).toMatch(/transition:\s*color 220ms ease/)
    expect(motionRules).toMatch(/portfolio__story-step\[data-active='true'\] h4[\s\S]*?color:\s*var\(--project-signal\)/)
    expect(motionRules).toMatch(/portfolio__story-step\[data-active='true'\] p[\s\S]*?color:\s*var\(--text-2\)/)
    expect(motionRules).not.toMatch(/opacity|portfolio__media|picture|img|scale\(|translateX\(/)
    expect(css).toMatch(/\.portfolio__story-track\s*\{[\s\S]*?width:\s*1px;[\s\S]*?background:\s*var\(--line-soft\)/)
    expect(css).toMatch(/\.portfolio__story-progress\s*\{[\s\S]*?background:\s*var\(--project-signal\);[\s\S]*?transform-origin:\s*top/)
    expect(css).toMatch(/@media screen and \(max-width: 1050px\)[\s\S]*?\.portfolio__story-step h4,[\s\S]*?transform:\s*none/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.portfolio__story-step h4,[\s\S]*?transform:\s*none/)
  })

  it('mantiene un unico observer de seccion sin duplicar el enlace activo', () => {
    render(<App pathname="/" />)
    const nav = leer('componets', 'nav', 'Nav.jsx')
    const css = leer('componets', 'nav', 'nav.css')

    expect(nav.match(/new IntersectionObserver/g)).toHaveLength(1)
    expect(nav).not.toMatch(/addEventListener\(['"]scroll|requestAnimationFrame/)
    expect(nav).toMatch(/if \(!activeSectionListeners\.size\)[\s\S]*?activeSection = 'home'/)
    expect(nav).not.toMatch(/activeSectionLabel|portfolio-nav__section-context/)
    expect(css).not.toMatch(/portfolio-nav__section-context|portfolio-nav-context-in/)
  })

  it('activa el relato solo en desktop sin reduced motion y reacciona a ambos cambios', async () => {
    const originalMatchMedia = window.matchMedia
    const queries = new Map()
    let view

    window.matchMedia = jest.fn((query) => {
      if (queries.has(query)) return queries.get(query)

      const listeners = new Set()
      const mediaQuery = {
        matches: query === '(min-width: 1051px)',
        media: query,
        onchange: null,
        addEventListener: (type, listener) => {
          if (type === 'change') listeners.add(listener)
        },
        removeEventListener: (type, listener) => {
          if (type === 'change') listeners.delete(listener)
        },
        addListener: (listener) => listeners.add(listener),
        removeListener: (listener) => listeners.delete(listener),
        dispatchEvent: () => false,
        setMatches: (matches) => {
          mediaQuery.matches = matches
          listeners.forEach((listener) => listener({ matches, media: query }))
        },
      }
      queries.set(query, mediaQuery)
      return mediaQuery
    })

    try {
      view = render(<App pathname="/" />)
      const strev = screen.getByRole('article', { name: 'Strev' })

      await waitFor(() => expect(strev).toHaveAttribute('data-story-mode', 'scroll'))

      act(() => queries.get('(min-width: 1051px)').setMatches(false))
      await waitFor(() => expect(strev).toHaveAttribute('data-story-mode', 'static'))
      expect(strev).not.toHaveAttribute('data-story-step')
      within(strev).getAllByRole('listitem').forEach((step) => {
        expect(step).not.toHaveAttribute('aria-current')
        expect(step).not.toHaveAttribute('data-active')
      })

      act(() => queries.get('(min-width: 1051px)').setMatches(true))
      await waitFor(() => expect(strev).toHaveAttribute('data-story-mode', 'scroll'))

      act(() => queries.get('(prefers-reduced-motion: reduce)').setMatches(true))
      await waitFor(() => expect(strev).toHaveAttribute('data-story-mode', 'static'))
      expect(strev).not.toHaveAttribute('data-story-step')
    } finally {
      view?.unmount()
      window.matchMedia = originalMatchMedia
    }
  })

  it('presenta cuatro casos con un top 2 real y sin rotulos ordinales', () => {
    render(<App pathname="/" />)

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
    const articulos = within(portfolio).getAllByRole('article')
    const titulosPorTier = (tier, level) => articulos
      .filter((article) => article.dataset.tier === tier)
      .map((article) => within(article).getByRole('heading', { level }).textContent)

    expect(articulos).toHaveLength(4)
    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(titulosPorTier('primary', 3)).toEqual(['Strev', 'Sereno'])
    expect(titulosPorTier('supporting', 4)).toEqual(['SaveMyMoneyNow', 'Atalaya'])
    expect(within(portfolio).getByRole('heading', { level: 3, name: 'Más trabajo' }))
      .toBeInTheDocument()
    ;['Strev', 'Sereno', 'SaveMyMoneyNow', 'Atalaya'].forEach((nombre) => {
      expect(within(portfolio).getByRole('article', { name: nombre })).toBeInTheDocument()
    })
    ;['01', '02', '03', '04'].forEach((ordinal) => {
      expect(within(portfolio).queryByText(ordinal)).not.toBeInTheDocument()
    })

    const diccionario = require('../i18n/locales/es/translation.json')
    expect(within(portfolio).queryByText(diccionario.portfolio.primary_label)).not.toBeInTheDocument()
    expect(within(portfolio).queryByText(diccionario.portfolio.supporting_label)).not.toBeInTheDocument()

    const source = leer('componets', 'portfolio', 'Portfolio.jsx')
    expect(source).not.toMatch(/projectIndex|tier_label|padStart|portfolio__eyebrow/)
    expect(within(portfolio).getByText('Más trabajo').tagName).toBe('H3')
    expect(source).toMatch(/className="portfolio__supporting"/)
    expect(source).toMatch(/t\('portfolio\.supporting_title'\)/)

    const header = leer('componets', 'header', 'Header.jsx')
    expect(header).not.toMatch(/<article/)
    expect(header).toMatch(/<div[\s\S]*?className=\{`hero__preview/)

    const css = leer('componets', 'portfolio', 'portfolio.css')
    const supporting = css.match(/\.portfolio__grid > \.portfolio__supporting\s*\{[\s\S]*?\n\}/)
    expect(supporting).not.toBeNull()
    expect(supporting[0]).toMatch(/margin-top:\s*clamp\(/)
  })

  it('mantiene solo el medio sticky y deja que las decisiones den altura al relato', () => {
    const css = leer('componets', 'portfolio', 'portfolio.css')

    const stage = css.match(/\.portfolio__item--primary\s*\{[\s\S]*?\n\}/)
    expect(stage).not.toBeNull()
    expect(stage[0]).not.toMatch(/min-height:/)
    expect(stage[0]).toMatch(/grid-template-columns:\s*minmax\(19rem, 0\.36fr\) minmax\(0, 0\.64fr\)/)
    expect(stage[0]).toMatch(/grid-template-areas:\s*'body media'/)
    expect(stage[0]).toMatch(/background:[\s\S]*?linear-gradient\([\s\S]*?var\(--surface-0\)/)
    expect(stage[0]).toMatch(/border-top:\s*1px solid var\(--line-soft\)/)
    expect(css).toMatch(/\.portfolio__item--primary:last-of-type\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--line-soft\)/)
    expect(css).toMatch(/\.portfolio__item--primary \.portfolio__media\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*calc\(var\(--nav-height\) \+ var\(--space-8\)\)/)
    const body = css.match(/\.portfolio__item--primary \.portfolio__body\s*\{[\s\S]*?\n\}/)
    expect(body).not.toBeNull()
    expect(body[0]).toMatch(/grid-area:\s*body/)
    expect(body[0]).not.toMatch(/position:\s*sticky|top:/)
    expect(css).toMatch(/data-story-mode='scroll'[\s\S]*?min-height:\s*clamp\(7rem, 13svh, 9rem\)/)
    expect(css).toMatch(/\.portfolio__media-frame\s*\{[\s\S]*?aspect-ratio:\s*16 \/ 10/)
    const serenoFrame = css.match(/\.portfolio__item--sereno \.portfolio__media-frame\s*\{[\s\S]*?\n\}/)
    expect(serenoFrame).not.toBeNull()
    expect(serenoFrame[0]).toMatch(/background:\s*var\(--sereno-matte\)/)
    expect(css).toMatch(/@media screen and \(max-width: 1050px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*?grid-template-areas:[\s\S]*?'media'[\s\S]*?'body'/)
    expect(css).toMatch(/@media screen and \(max-width: 1050px\)[\s\S]*?min-height:\s*0[\s\S]*?position:\s*static/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?min-height:\s*0[\s\S]*?position:\s*static/)
    expect(css).not.toMatch(/--media-position|transform:\s*scale\(|object-position\s+\d+ms/)
  })

  it('fija el cobalto como identidad global y mantiene las señales de producto localizadas', () => {
    const header = leer('componets', 'header', 'Header.jsx')
    const headerCss = leer('componets', 'header', 'header.css')
    const portfolioCss = leer('componets', 'portfolio', 'portfolio.css')
    const index = leer('index.css')
    const html = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'index.html'), 'utf8')

    expect(index).toMatch(/--ref-cobalt-600:\s*#2f6ba8/)
    expect(index).toMatch(/--signal-alex:\s*var\(--accent\)/)
    expect(index).toMatch(/--signal-strev:\s*var\(--ref-cobalt-300\)/)
    expect(index).toMatch(/--signal-sereno:\s*var\(--ref-cobalt-400\)/)
    expect(index).not.toMatch(/oklch\(0\.82 0\.13 160\)|oklch\(0\.75 0\.17 300\)/)
    expect(index).not.toMatch(/oklch\(0\.72 0\.19 35\)|oklch\(0\.52 0\.20 31\)/)
    expect(index).toMatch(/--font-sans:\s*"Anek Latin"/)
    expect(index).toMatch(/--font-mono:\s*var\(--font-sans\)/)
    expect(html).toMatch(/Anek\+Latin:wght@400;500;600;700/)
    expect(html).not.toMatch(/IBM\+Plex/)

    render(<App pathname="/" />)
    const canvas = screen.getByRole('navigation', { name: 'Casos principales: Strev y Sereno' })
    expect(within(canvas).getAllByRole('link')).toHaveLength(2)
    expect(within(canvas).getByRole('link', { name: 'Abrir Strev' })).toHaveAttribute('href', '/proyectos/strev/')
    expect(within(canvas).getByRole('link', { name: 'Abrir Sereno' })).toHaveAttribute('href', '/proyectos/sereno/')
    expect(within(canvas).queryByRole('button')).not.toBeInTheDocument()

    const selector = screen.getByRole('group', { name: 'Elegir producto destacado' })
    const selectStrev = within(selector).getByRole('button', { name: 'Strev' })
    const selectSereno = within(selector).getByRole('button', { name: 'Sereno' })
    expect(selectStrev).toHaveAttribute('aria-pressed', 'true')
    expect(selectSereno).toHaveAttribute('aria-pressed', 'false')
    expect(canvas).toHaveAttribute('data-active-product', 'strev')
    expect(selectSereno).toHaveAttribute('aria-controls', 'hero-product-sereno')
    const pathBeforeSelection = window.location.pathname
    fireEvent.click(selectSereno)
    expect(selectStrev).toHaveAttribute('aria-pressed', 'false')
    expect(selectSereno).toHaveAttribute('aria-pressed', 'true')
    expect(canvas).toHaveAttribute('data-active-product', 'sereno')
    expect(window.location.pathname).toBe(pathBeforeSelection)
    const { caseHref } = require('../lib/routing')
    expect(caseHref('en', 'strev')).toBe('/en/projects/strev/')
    expect(caseHref('en', 'sereno')).toBe('/en/projects/sereno/')

    expect(header).toMatch(/products\.map/)
    expect(header).toMatch(/caseHref\(language, product\.slug\)/)
    expect(header).not.toMatch(/portrait|headshot|alex-editorial-portrait/)
    expect(headerCss).toMatch(/\.hero\s*\{[\s\S]*?background:\s*var\(--surface-0\)/)
    expect(headerCss).not.toMatch(/\.hero::before|border-left/)
    const heroStage = headerCss.match(/\.hero__stage\s*\{[\s\S]*?\n\}/)
    const heroPreview = headerCss.match(/\.hero__preview\s*\{[\s\S]*?\n\}/)
    const heroImage = headerCss.match(/\.hero__preview img\s*\{[\s\S]*?\n\}/)
    expect(heroStage).not.toBeNull()
    expect(heroStage[0]).toMatch(/display:\s*flex/)
    expect(heroStage[0]).toMatch(/flex-direction:\s*column/)
    expect(heroPreview).not.toBeNull()
    expect(heroPreview[0]).toMatch(/flex:\s*1 1 0/)
    expect(heroPreview[0]).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) clamp\(10rem, 21%, 12\.5rem\)/)
    expect(headerCss).toMatch(/\.hero__preview \+ \.hero__preview\s*\{[\s\S]*?border-top:\s*1px solid var\(--line-soft\)/)
    expect(headerCss).toMatch(/\.hero__preview-caption\s*\{[\s\S]*?background-color 240ms ease/)
    expect(heroImage).not.toBeNull()
    expect(heroImage[0]).toMatch(/object-fit:\s*contain/)
    expect(heroImage[0]).toMatch(/object-position:\s*center/)
    expect(heroImage[0]).toMatch(/min-height:\s*0;[\s\S]*?max-height:\s*100%/)
    expect(heroImage[0]).not.toMatch(/object-fit:\s*cover|transform:\s*scale/)
    expect(headerCss).not.toMatch(/\.hero__preview(?::focus-within|:hover)? img\s*\{[\s\S]*?transform:\s*scale/)
    expect(headerCss).not.toMatch(/flex-grow|flex-basis|data-active-product=/)
    expect(headerCss).toMatch(/\.hero__preview:focus-within\s*\{[\s\S]*?outline:\s*3px solid var\(--focus-ring\)/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 1050px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*?height:\s*clamp\(28rem, 58vw, 34rem\)/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?\.hero__product-selector\s*\{[\s\S]*?display:\s*grid[\s\S]*?\.hero__preview\[data-active='true'\] \.hero__preview-caption/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?\.hero__stage\s*\{[\s\S]*?height:\s*clamp\(16rem, 65vw, 18rem\)/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 360px\)[\s\S]*?\.hero__stage\s*\{[\s\S]*?height:\s*12rem/)
    const narrowHeader = headerCss.slice(
      headerCss.indexOf('@media screen and (max-width: 360px)'),
      headerCss.indexOf('@media (prefers-reduced-motion: reduce)'),
    )
    expect(narrowHeader).not.toMatch(/\.hero__availability\s*\{[\s\S]*?display:\s*none/)
    expect(narrowHeader).toMatch(/\.hero__signature\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?\.hero__preview\s*\{[\s\S]*?position:\s*absolute[\s\S]*?visibility:\s*hidden[\s\S]*?pointer-events:\s*none/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?grid-template-rows:\s*minmax\(0, 1fr\) auto[\s\S]*?\.hero__preview-label\s*\{[\s\S]*?display:\s*block[\s\S]*?\.hero__preview-proof\s*\{[\s\S]*?display:\s*none/)
    expect(headerCss).toMatch(/\.hero__preview\[data-active='true'\]\s*\{[\s\S]*?visibility:\s*visible[\s\S]*?pointer-events:\s*auto/)
    expect(headerCss).not.toMatch(/visibility\s+0s\s+linear\s+200ms/)
    expect(headerCss).toMatch(/@media \(prefers-reduced-motion: reduce\) and \(max-width: 600px\)[\s\S]*?\.hero__preview[\s\S]*?transition:\s*none/)
    expect(headerCss).toMatch(/\.hero__preview-link\s*\{[\s\S]*?min-height:\s*44px;[\s\S]*?min-inline-size:\s*44px/)
    expect(headerCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?\.hero__socials a\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px/)
    expect(headerCss).toMatch(/\.hero__name\s*\{[\s\S]*?font-size:\s*clamp\(4\.5rem, 7\.6vw, 6rem\)/)
    expect(portfolioCss).toMatch(/\.portfolio__item--primary \.portfolio__title\s*\{[\s\S]*?5rem/)
    expect(portfolioCss).toMatch(/\.portfolio__item--supporting \.portfolio__links a\s*\{[\s\S]*?min-inline-size:\s*44px/)
    expect(`${headerCss}\n${portfolioCss}`).not.toMatch(/var\(--font-mono\)/)
  })

  it('interpola las señales de identidad al cambiar de tema', () => {
    const index = leer('index.css')
    const tokens = [
      'signal-alex',
      'signal-strev',
      'signal-strev-on',
      'signal-sereno',
      'signal-sereno-on',
      'home-stage',
      'home-stage-on',
      'home-stage-muted',
      'home-stage-deep',
    ]

    tokens.forEach((token) => {
      expect(index).toMatch(new RegExp(`@property --${token} \\{[\\s\\S]*?syntax: '<color>'`))
      expect(index).toMatch(new RegExp(`:root\\[data-theme-transition\\] \\{[\\s\\S]*?--${token} 180ms`))
    })
    expect(index).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?:root\[data-theme-transition\][\s\S]*?transition:\s*none/)
  })

  it('mantiene legibles los CTA compartidos fuera del scope del hero', () => {
    const css = leer('componets', 'header', 'header.css')
    const caso = css.match(/\.site-shell__case-actions \.hero__button\s*\{[\s\S]*?\n\}/)
    const principal = css.match(/\.site-shell__case-actions \.hero__button--projects\s*\{[\s\S]*?\n\}/)

    expect(caso).not.toBeNull()
    expect(caso[0]).toMatch(/border:\s*1px solid var\(--line-control\)/)
    expect(caso[0]).toMatch(/color:\s*var\(--text-1\)/)
    expect(principal).not.toBeNull()
    expect(principal[0]).toMatch(/background:\s*var\(--accent\)/)
    expect(principal[0]).toMatch(/color:\s*var\(--accent-on\)/)
  })

  it('mantiene visibles las evidencias secundarias en una columna movil sin truncar nombres', () => {
    const css = leer('componets', 'portfolio', 'portfolio.css')

    expect(css).toMatch(/@media screen and \(max-width: 700px\)[\s\S]*?\.portfolio__supporting-list\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(css).toMatch(/@media screen and \(max-width: 700px\)[\s\S]*?\.portfolio__item--supporting \.portfolio__media\s*\{[\s\S]*?display:\s*flex/)
    expect(css).toMatch(/@media screen and \(max-width: 700px\)[\s\S]*?\.portfolio__item--supporting \.portfolio__title\s*\{[\s\S]*?white-space:\s*normal/)
    const supportingMediaRules = [...css.matchAll(/\.portfolio__item--supporting \.portfolio__media\s*\{([^}]*)\}/g)]
    expect(supportingMediaRules.every(([, rule]) => !/display:\s*none/.test(rule))).toBe(true)
    expect(css).not.toMatch(/\.portfolio__item--savemymoneynow\.portfolio__item--supporting \.portfolio__title\s*\{[\s\S]*?white-space:\s*nowrap/)
  })

  it('rectifica los controles de la home sin reducir sus targets', () => {
    const css = leer('componets', 'nav', 'nav.css')
    const idioma = css.match(/\.portfolio-nav:has\(\+ \.hero\) \.language-selector\s*\{[\s\S]*?\n\}/)
    const activo = css.match(/\.portfolio-nav:has\(\+ \.hero\) \.language-selector__option--active\s*\{[\s\S]*?\n\}/)
    const tema = css.match(/\.portfolio-nav:has\(\+ \.hero\) \.theme-toggle__track\s*\{[\s\S]*?\n\}/)
    const casos = css.match(/\.site-shell--case \.portfolio-nav \.language-selector,[\s\S]*?\.site-shell--case \.portfolio-nav \.portfolio-nav__menu-toggle \{[\s\S]*?border-radius:\s*3px;/)

    expect(idioma).not.toBeNull()
    expect(idioma[0]).toMatch(/border-radius:\s*var\(--radius-md\)/)
    expect(activo).not.toBeNull()
    expect(activo[0]).toMatch(/background:\s*var\(--signal-alex\)/)
    expect(activo[0]).toMatch(/color:\s*var\(--accent-on\)/)
    expect(tema).not.toBeNull()
    expect(tema[0]).toMatch(/width:\s*30px/)
    expect(tema[0]).toMatch(/border-radius:\s*var\(--radius-md\)/)
    expect(casos).not.toBeNull()
  })

  it('publica sin ampliar el copy final de Humanízalo', () => {
    const es = require('../i18n/locales/es/translation.json')
    const en = require('../i18n/locales/en/translation.json')

    expect(es.header.tagline).toBe(
      'Diseño para que un proceso lento no pare la pantalla.',
    )
    expect(es.header.support).toBe(
      'Strev deja al entrenador seguir mientras analiza vídeo. Sereno me dice qué sesión está trabajando, ejecutando un comando o esperando una respuesta.',
    )
    expect(en.header.tagline).toBe(
      'I build products where slow work never freezes the interface.',
    )
    expect(en.header.support).toBe(
      'Strev lets the trainer carry on while it analyses video. Sereno tells me which session is working, running a command or waiting for a reply.',
    )
    expect(es.header.product_canvas_label).toBe('Casos principales: Strev y Sereno')
    expect(en.header.product_canvas_label).toBe('Main case studies: Strev and Sereno')
    expect(es.portfolio.title).toBe('Lo que resuelve')
    expect(en.portfolio.title).toBe('What it solves')
    expect(es.portfolio.supporting_title).toBe('Más trabajo')
    expect(en.portfolio.supporting_title).toBe('More work')
    expect(es.portfolio.projects.filter(({ tier }) => tier === 'primary').map(({ proof }) => proof))
      .toEqual([
        'React + Node · análisis en cola y cifrado por campo',
        'Estados locales de Claude Code, Codex, Gemini y Antigravity',
      ])
    expect(en.portfolio.projects.find(({ slug }) => slug === 'sereno').proof).toBe(
      'Local-only session states across Claude Code, Codex, Gemini and Antigravity',
    )
  })

  it('revela contenido visible con un gesto editorial breve', () => {
    const source = leer('componets', 'common', 'Reveal.jsx')

    expect(source).not.toMatch(/opacity:\s*0/)
    expect(source).toMatch(/hidden:\s*\{ y:\s*12 \}/)
    expect(source).toMatch(/duration:\s*0\.34/)
    expect(source).toMatch(/staggerChildren:\s*0\.045/)
    expect(source).toMatch(/amount:\s*0\.15/)
    expect(source).not.toMatch(/margin:/)
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

  it('acorta tema e idioma y unifica el cierre sobre superficies neutrales', () => {
    const theme = leer('componets', 'theme', 'ThemeToggle.jsx')
    const index = leer('index.css')
    const language = leer('componets', 'language', 'language.css')
    const experience = leer('componets', 'experience', 'experience.css')
    const contact = leer('componets', 'contact', 'contact.css')
    const footer = leer('componets', 'footer', 'footer.css')
    const diagram = leer('componets', 'portfolio', 'projectDiagram.css')

    expect(theme).toMatch(/THEME_TRANSITION_MS = 180/)
    expect(index).not.toMatch(/:root\[data-theme-transition\][\s\S]*?360ms/)
    expect(index).toMatch(/:root\[data-theme-transition\][\s\S]*?180ms/)
    expect(language).toMatch(/language-content-settle 190ms/)
    expect(language).toMatch(/prefers-reduced-motion: reduce[\s\S]*?animation:\s*none/)

    const stackGrid = experience.match(/\.stack__grid\s*\{[\s\S]*?\n\}/)
    expect(stackGrid).not.toBeNull()
    expect(stackGrid[0]).toMatch(/grid-column:\s*2/)
    expect(stackGrid[0]).toMatch(/grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/)
    expect(experience).toMatch(/\.site-shell:not\(\.site-shell--case\) \.experience,[\s\S]*?\.stack[\s\S]*?background:\s*var\(--surface-1\)/)
    expect(experience).not.toMatch(/--dark-|home-stage|#[0-9a-f]{3,8}\b/i)
    expect(contact).toMatch(/\.site-shell:not\(\.site-shell--case\) #contact[\s\S]*?background:\s*var\(--surface-0\)/)
    expect(footer).toMatch(/\.site-shell:not\(\.site-shell--case\) \.site-footer[\s\S]*?background:\s*var\(--surface-0\)/)
    expect(`${contact}\n${footer}`).not.toMatch(/--text-1:|--accent:|home-stage|rgb\(|#[0-9a-f]{3,8}\b/i)
    expect(experience).not.toMatch(/border-top|border-bottom/)
    expect(experience).not.toMatch(/\.stack__chip \+ \.stack__chip::before/)
    expect(experience).not.toMatch(/font-family:\s*var\(--font-mono\)/)
    expect(experience).not.toMatch(/\.stack\s*\{[^}]*min-height/)
    expect(experience).not.toMatch(/opacity:\s*0/)
    expect(diagram).not.toMatch(/linear-gradient|radial-gradient|background-image|radius-full|box-shadow/)
    expect(diagram).toMatch(/\.pdiag__prompt\s*\{[\s\S]*?display:\s*none/)
    expect(diagram).toMatch(/\.pdiag__after\s*\{[\s\S]*?border-top:\s*2px solid var\(--accent\)/)
  })

  it('comprime solo el ritmo de la portada y conserva el de los casos', () => {
    const index = leer('index.css')

    expect(index).toMatch(
      /\.site-shell__content section \+ section,[\s\S]*?margin-top:\s*clamp\(6rem, 11vw, 10rem\)/,
    )
    expect(index).toMatch(
      /\.site-shell:not\(\.site-shell--case\) \.site-shell__content section \+ section,[\s\S]*?margin-top:\s*0/,
    )
    expect(index).toMatch(
      /@media screen and \(max-width: 600px\)[\s\S]*?\.site-shell:not\(\.site-shell--case\)[\s\S]*?margin-top:\s*0/,
    )
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
    const verProyectos = enlaces.findIndex((enlace) => enlace.textContent === 'Abrir Strev y Sereno')

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
    const contactCss = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'contact', 'contact.css'), 'utf8',
    )
    const footerCss = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'footer', 'footer.css'), 'utf8',
    )

    const marca = navCss.match(/\.portfolio-nav__brand \{[\s\S]*?\n\}/)
    const idioma = navCss.match(
      /\.portfolio-nav__controls \.lang-btn,\s*\n\s*\.portfolio-nav__controls \.language-selector__option \{[\s\S]*?\n\}/,
    )
    const tema = navCss.match(/\.portfolio-nav__controls \.theme-toggle \{[\s\S]*?\n\}/)
    const volver = caseCss.match(/\.case__back \{[\s\S]*?\n\}/)
    const accion = caseCss.match(/\.case__link \{[\s\S]*?\n\}/)
    const contacto = contactCss.match(/\.contact__detail dd a \{[\s\S]*?\n\}/)
    const correoFinal = footerCss.match(/\.site-footer__mail \{[\s\S]*?\n\}/)
    const legal = footerCss.match(/\.site-footer__legal a \{[\s\S]*?\n\}/)

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
    expect(contacto).not.toBeNull()
    expect(contacto[0]).toMatch(/min-height:\s*44px/)
    expect(correoFinal).not.toBeNull()
    expect(correoFinal[0]).toMatch(/min-height:\s*44px/)
    expect(legal).not.toBeNull()
    expect(legal[0]).toMatch(/min-height:\s*44px/)
  })
})

// El 2026-08-22 se vio que las paginas de caso servian `#about`, `#portfolio`,
// `#experience`, `#stack` y `#portfolio` (el CTA) apuntando a secciones que en
// ese HTML no existen: la nav leia la ruta de `window`, que en el prerender no
// hay, asi que todo se prerenderizaba como si fuera la portada. La ruta ahora
// baja por contexto desde App, que es quien la sabe.
describe('las anclas de una pagina de caso apuntan a destinos existentes', () => {
  it('solo conserva anclas internas para los capitulos del caso', () => {
    render(<App pathname="/proyectos/atalaya/" />)

    const locales = enlacesCon(/^#/).map((enlace) => enlace.getAttribute('href'))
    expect(locales).toEqual([
      '#case-summary',
      '#case-problem',
      '#case-decisions',
      '#case-results',
    ])
    ;['En una frase', 'El problema', 'Cómo funciona', 'Dónde está el listón']
      .forEach((nombre) => expect(screen.getByRole('heading', { name: nombre })).toBeInTheDocument())
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
// Rail de ambito del 23/08: quedan dos bloques cuyos pasajes no se nombran ni
// en el rotulo ni en el cuerpo, y son los mas citables de la pagina ("174
// tests", "Los duplicados los corta la base de datos"). El nombre sigue en el
// texto del DOM para extractores, pero la v10 lo retira del plano visual y del
// nombre accesible para que el heading no tartamudee.
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

  it('Sobre mi expresa criterio propio sin presentar a Alex ni repetir los proyectos', () => {
    render(<App pathname="/" />)

    expect(screen.getByText(/^Me importa que un producto explique/)).toBeInTheDocument()
    expect(screen.queryByText(/^Soy Alex,/)).not.toBeInTheDocument()
  })

  it('Sobre mi mantiene una narrativa breve de criterio y verificacion en ambos idiomas', () => {
    ;['es', 'en'].forEach((idioma) => {
      const { about } = require(`../i18n/locales/${idioma}/translation.json`)
      const texto = [about.lead, about.p2, about.p3].join(' ')

      expect(texto).not.toMatch(/\b(?:Strev|Sereno)\b/)
      expect(texto.length).toBeLessThan(320)
      expect(texto).not.toMatch(/—/)
    })
  })
})

// Las paginas de caso son URLs propias y prerenderizadas: lo que se vigila aqui
// es que la ruta elija la pagina correcta y que el contenido llegue entero.
describe('paginas de caso de estudio', () => {
  const { parseRoute, caseHref, CASE_SLUGS } = require('../lib/routing')

  it.each([
    ['/proyectos/strev/', '/#portfolio'],
    ['/en/projects/strev/', '/en/#portfolio'],
  ])('vuelve desde %s al inicio de Proyectos', (ruta, destino) => {
    render(<App pathname={ruta} />)

    expect(screen.getByRole('link', { name: /Volver a proyectos|Back to projects/ }))
      .toHaveAttribute('href', destino)
  })

  it('nombra decisiones y resultados sin repetir el proyecto en la jerarquia visible', () => {
    render(<App pathname="/proyectos/strev/" />)

    expect(screen.getByRole('heading', { level: 2, name: 'Cómo funciona' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Dónde está el listón' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Strev Cómo funciona/ })).toBeNull()
    expect(screen.queryByRole('heading', { name: /Strev Dónde está el listón/ })).toBeNull()
  })

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

  it.each(['strev', 'sereno'])('mantiene una sola evidencia dentro de la apertura primary de %s', (slug) => {
    const diccionario = require('../i18n/locales/es/translation.json')
    const proyecto = diccionario.portfolio.projects.find((item) => item.slug === slug)
    render(<App pathname={`/proyectos/${slug}/`} />)

    const caso = screen.getByRole('article')
    const apertura = within(caso).getByRole('group', { name: proyecto.title })

    expect(within(apertura).getAllByRole('figure')).toHaveLength(1)
    expect(within(apertura).getAllByRole('img')).toHaveLength(1)
    expect(within(caso).getAllByRole('figure')).toHaveLength(1)
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

  it('pertenece al stage cobalt sin duplicar el hero', () => {
    const fs = require('fs')
    const path = require('path')
    const css = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'caseStudy', 'caseStudy.css'),
      'utf8',
    )
    const cover = css.match(/\.case__header\s*\{[\s\S]*?\n\}/)
    const title = css.match(/\.case__header h1\s*\{[\s\S]*?\n\}/)

    expect(cover).not.toBeNull()
    expect(cover[0]).toMatch(/min-height:\s*clamp\(16rem,[^;]+22rem\)/)
    expect(cover[0]).toMatch(/background:\s*var\(--home-stage\)/)
    expect(title).not.toBeNull()
    expect(title[0]).toMatch(/color:\s*#fff(?:fff)?/)
    expect(css).not.toMatch(/\.case__header[\s\S]*?(?:hero__stage|hero__preview|hero__portrait)/)
  })

  it('preserva completo el nombre largo de SaveMyMoneyNow en movil', () => {
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'caseStudy', 'CaseStudy.jsx'),
      'utf8',
    )
    const css = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'caseStudy', 'caseStudy.css'),
      'utf8',
    )

    expect(source).toMatch(/case__header--\$\{slug\}/)
    expect(css).toMatch(/\.case__header h1\s*\{[\s\S]*?overflow-wrap:\s*normal;[\s\S]*?word-break:\s*normal;/)
    expect(css).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?\.case__header--savemymoneynow h1\s*\{[\s\S]*?font-size:\s*clamp\(1\.875rem, 8\.8vw, 2\.4rem\)/)
  })

  it('usa evidencia 16:10 y mantiene las decisiones semanticas sin ordinal visual', () => {
    const fs = require('fs')
    const path = require('path')
    const css = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'caseStudy', 'caseStudy.css'),
      'utf8',
    )
    const frame = css.match(/(?:^|\n)\.case__media-frame\s*\{[\s\S]*?\n\}/)
    const media = css.match(/\.case__media img\s*\{[\s\S]*?\n\}/)
    const strev = css.match(/\.case__media--strev \.case__media-frame img\s*\{[\s\S]*?\n\}/)
    const decisions = css.match(/\.case__decisions\s*\{[\s\S]*?\n\}/)
    const ordinal = css.match(/\.case__decision::before\s*\{[\s\S]*?\n\}/)
    const results = css.match(/\.case__results\s*\{[\s\S]*?\n\}/)

    expect(frame).not.toBeNull()
    expect(frame[0]).toMatch(/aspect-ratio:\s*16\s*\/\s*10/)
    expect(media).not.toBeNull()
    expect(media[0]).toMatch(/object-fit:\s*contain/)
    expect(strev).not.toBeNull()
    expect(strev[0]).toMatch(/object-fit:\s*contain/)
    expect(css).toMatch(/\.case__media--sereno \.case__media-frame\s*\{[\s\S]*?aspect-ratio:\s*13\s*\/\s*6[\s\S]*?background:\s*var\(--sereno-matte\)/)
    expect(decisions).not.toBeNull()
    expect(decisions[0]).toMatch(/grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(ordinal).not.toBeNull()
    expect(ordinal[0]).toMatch(/content:\s*none/)
    expect(results).not.toBeNull()
    expect(results[0]).toMatch(/background:\s*transparent/)
    expect(results[0]).toMatch(/border-top:\s*1px solid var\(--line-control\)/)
    expect(results[0]).toMatch(/border-bottom:\s*1px solid var\(--line-control\)/)
    expect(css).not.toMatch(/@keyframes|animation:/)
  })

  it('sincroniza la identidad social y los documentos vivos con Cobalt Product Stage', () => {
    const fs = require('fs')
    const path = require('path')
    const root = path.join(__dirname, '..', '..')
    const publicPath = path.join(root, 'public')
    const og = fs.readFileSync(path.join(publicPath, 'og-image.svg'), 'utf8')
    const favicon = fs.readFileSync(path.join(publicPath, 'favicon.svg'), 'utf8')
    const head = fs.readFileSync(path.join(publicPath, 'index.html'), 'utf8')
    const notFound = fs.readFileSync(path.join(publicPath, '404.html'), 'utf8')
    const product = fs.readFileSync(path.join(root, 'PRODUCT.md'), 'utf8')
    const design = fs.readFileSync(path.join(root, 'DESIGN.md'), 'utf8')
    const designJson = fs.readFileSync(path.join(root, '.impeccable', 'design.json'), 'utf8')
    const designHtmlPath = path.join(root, 'DESIGN.html')

    expect(og).toMatch(/Strev/)
    expect(og).toMatch(/Sereno/)
    expect(og).not.toMatch(/Product casebook/i)
    expect(favicon).toMatch(/<title(?:\s[^>]*)?>Alex Micó Robles<\/title>/)
    expect(favicon).not.toMatch(/<text\b/)
    expect(head.match(/og-image\.png\?v=3/g)).toHaveLength(3)
    expect(head).toMatch(/favicon\.svg\?v=3/)
    expect(head).toMatch(/apple-touch-icon\.png\?v=3/)
    expect(notFound).toMatch(/favicon\.svg\?v=3/)

    expect(`${product}\n${design}\n${designJson}`).toMatch(/Cobalt Product Stage/)
    expect(`${design}\n${designJson}`).toMatch(/Anek Latin/)
    expect(`${design}\n${designJson}`).not.toMatch(/Product Casebook|IBM Plex/)
    expect(fs.existsSync(designHtmlPath)).toBe(true)
    const designHtml = fs.readFileSync(designHtmlPath, 'utf8')
    expect(designHtml).toMatch(/Home stage/)
    expect(designHtml).toMatch(/Case cover/)
    expect(designHtml).not.toMatch(/<script\b[^>]*src=|<link\b[^>]*href=/)
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

    const portfolio = screen.getByRole('region', { name: 'Lo que resuelve' })
    const principales = within(portfolio).getAllByRole('article')
      .filter((article) => article.getAttribute('data-tier') === 'primary')

    expect(principales).toHaveLength(2)
    expect(principales.map((article) => (
      within(article).getByRole('heading', { level: 3 }).textContent
    ))).toEqual(['Strev', 'Sereno'])
    principales.forEach((article) => {
      expect(article).toHaveClass('portfolio__item--primary')
      expect(within(article).getAllByRole('link')).toHaveLength(2)
      expect(within(article).queryByRole('link', { name: /Última versión|Latest release/i })).toBeNull()
      const image = within(article).getByRole('img')
      expect(image).toHaveStyle({ objectFit: 'contain', objectPosition: 'center' })
    })

    const sereno = principales[1]
    expect(within(sereno).getByRole('img')).toHaveAttribute(
      'src',
      expect.stringContaining('sereno-session-overview.webp'),
    )
    const fs = require('fs')
    const path = require('path')
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'componets', 'portfolio', 'Portfolio.jsx'),
      'utf8',
    )
    expect(source).not.toMatch(/sereno-demo|media\.still|<picture>/)
  })
})
