import React from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import {
  runLanguageTransition,
  scrollToSection,
  syncDocument,
  useLanguageFromHistory,
  useSmoothAnchors,
} from '../lib/smoothScroll'

const scrollToDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollTo')
const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
const requestAnimationFrameDescriptor = Object.getOwnPropertyDescriptor(
  window,
  'requestAnimationFrame',
)
const innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight')
const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(
  document.documentElement,
  'scrollHeight',
)
const initialLanguage = document.documentElement.lang

const restoreProperty = (object, property, descriptor) => {
  if (descriptor) {
    Object.defineProperty(object, property, descriptor)
  } else {
    delete object[property]
  }
}

const PruebaAnclas = () => {
  useSmoothAnchors()

  return (
    <>
      <a href="#x" target="_blank">Ir al destino</a>
      <section id="x" aria-labelledby="titulo-x">
        <h2 id="titulo-x">Destino de la ancla</h2>
      </section>
    </>
  )
}

const PruebaIdioma = ({ i18n }) => {
  useLanguageFromHistory(i18n)
  return <p>Historial preparado</p>
}

describe('desplazamiento suave', () => {
  let reducedMotion

  beforeEach(() => {
    reducedMotion = false
    window.scrollTo = jest.fn()
    window.requestAnimationFrame = jest.fn()
    window.matchMedia = jest.fn((query) => ({
      matches: reducedMotion,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    }))

    const real = window.getComputedStyle.bind(window)
    jest.spyOn(window, 'getComputedStyle').mockImplementation((element) => (
      element === document.documentElement
        ? { scrollPaddingTop: '80px' }
        : real(element)
    ))

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })
  })

  afterEach(() => {
    cleanup()
    window.history.pushState({}, '', '/')
    document.documentElement.lang = initialLanguage
    restoreProperty(window, 'scrollTo', scrollToDescriptor)
    restoreProperty(window, 'matchMedia', matchMediaDescriptor)
    restoreProperty(window, 'requestAnimationFrame', requestAnimationFrameDescriptor)
    restoreProperty(window, 'innerHeight', innerHeightDescriptor)
    restoreProperty(document.documentElement, 'scrollHeight', scrollHeightDescriptor)
    jest.restoreAllMocks()
  })

  it('devuelve false y no desplaza cuando la sección no existe', () => {
    expect(scrollToSection('no-existe')).toBe(false)
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('salta de inmediato y respeta el espacio reservado sobre la sección', () => {
    reducedMotion = true
    render(
      <section id="destino" aria-labelledby="titulo-destino">
        <h2 id="titulo-destino">Destino reducido</h2>
      </section>,
    )
    const destino = screen.getByRole('region', { name: 'Destino reducido' })
    destino.getBoundingClientRect = jest.fn(() => ({ top: 500 }))

    expect(scrollToSection('destino')).toBe(true)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 420)
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('mantiene el destino dentro de los límites desplazables de la página', () => {
    reducedMotion = true
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 1000,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 400,
    })
    render(
      <>
        <section id="superior" aria-labelledby="titulo-superior">
          <h2 id="titulo-superior">Destino superior</h2>
        </section>
        <section id="inferior" aria-labelledby="titulo-inferior">
          <h2 id="titulo-inferior">Destino inferior</h2>
        </section>
      </>,
    )
    const superior = screen.getByRole('region', { name: 'Destino superior' })
    const inferior = screen.getByRole('region', { name: 'Destino inferior' })
    superior.getBoundingClientRect = jest.fn(() => ({ top: -1000 }))
    inferior.getBoundingClientRect = jest.fn(() => ({ top: 5000 }))

    scrollToSection('superior')
    scrollToSection('inferior')

    expect(window.scrollTo.mock.calls).toEqual([[0, 0], [0, 600]])
  })

  it('intercepta la ancla local y deja su destino reflejado en la URL', () => {
    render(<PruebaAnclas />)
    const enlace = screen.getByRole('link', { name: 'Ir al destino' })
    const destino = screen.getByRole('region', { name: 'Destino de la ancla' })
    destino.getBoundingClientRect = jest.fn(() => ({ top: 0 }))

    expect(fireEvent.click(enlace)).toBe(false)
    expect(window.location.hash).toBe('#x')
  })

  it('permite abrir la ancla en otra pestaña sin cambiar la página actual', () => {
    render(<PruebaAnclas />)
    const enlace = screen.getByRole('link', { name: 'Ir al destino' })

    expect(fireEvent.click(enlace, { metaKey: true })).toBe(true)
    expect(window.location.hash).toBe('')
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('sincroniza el idioma al volver por historial solo cuando ha cambiado', async () => {
    const translations = {
      'header.name': 'Alex Micó Robles',
      'header.title': 'Full Stack Developer',
      'meta.description': 'Portfolio description',
    }
    const i18n = {
      resolvedLanguage: 'es',
      changeLanguage: jest.fn().mockResolvedValue(undefined),
      getFixedT: jest.fn(() => (key) => translations[key]),
    }
    render(<PruebaIdioma i18n={i18n} />)

    await act(async () => {
      window.history.pushState({}, '', '/en/')
      window.dispatchEvent(new PopStateEvent('popstate'))
      await Promise.resolve()
    })

    expect(i18n.changeLanguage).toHaveBeenCalledWith('en')

    i18n.resolvedLanguage = 'en'
    i18n.changeLanguage.mockClear()
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(i18n.changeLanguage).not.toHaveBeenCalled()
  })

  it('sincroniza título, canonical y metadatos sociales con el recurso fijo', () => {
    const nodes = [
      ['link', { rel: 'canonical' }],
      ...['description', 'twitter:title', 'twitter:description'].map((name) => ['meta', { name }]),
      ...['og:title', 'og:description', 'og:url', 'og:locale'].map((property) => ['meta', { property }]),
    ].map(([tag, attributes]) => {
      const node = document.createElement(tag)
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value))
      document.head.appendChild(node)
      return node
    })
    const values = {
      'header.name': 'Alex Micó Robles',
      'header.title': 'Full Stack Developer',
      'meta.description': 'English description',
    }

    syncDocument('en', { getFixedT: () => (key) => values[key] }, '/en/')

    expect(document.title).toBe('Alex Micó Robles | Full Stack Developer')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://portfolioalex-mico.vercel.app/en/',
    )
    expect(document.querySelector('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US')
    expect(document.querySelector('meta[name="twitter:description"]')).toHaveAttribute('content', 'English description')
    nodes.forEach((node) => node.remove())
  })

  it('bloquea un segundo cambio de idioma mientras la transición sigue activa', async () => {
    let finish
    document.startViewTransition = jest.fn((update) => {
      update()
      return { finished: new Promise((resolve) => { finish = resolve }) }
    })
    const first = jest.fn()
    const second = jest.fn()

    const pending = runLanguageTransition(first)
    expect(await runLanguageTransition(second)).toBe(false)
    expect(second).not.toHaveBeenCalled()
    finish()
    await pending
    delete document.startViewTransition
  })
})
