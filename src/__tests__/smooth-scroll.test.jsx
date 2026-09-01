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
const scrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY')
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

const clickWithoutFollowingLink = (element, options = {}) => {
  let preventedByHook
  const stopNativeNavigation = (event) => {
    preventedByHook = event.defaultPrevented
    event.preventDefault()
  }
  window.addEventListener('click', stopNativeNavigation, { once: true })
  fireEvent.click(element, options)
  return preventedByHook
}

const PruebaAnclas = () => {
  useSmoothAnchors()

  return (
    <>
      <a href="#x">Ir al destino</a>
      <a href="#x" target="_blank">Abrir destino aparte</a>
      <a href="#no-existe">Ir a destino inexistente</a>
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

const PruebaCierreMenu = () => {
  const [open, setOpen] = React.useState(true)
  const trigger = React.useRef(null)
  useSmoothAnchors()

  React.useEffect(() => {
    if (!open) trigger.current.focus({ preventScroll: true })
  }, [open])

  return (
    <>
      <button ref={trigger} type="button">Menú</button>
      {open && <a href="#contact" onClick={() => setOpen(false)}>Contacto</a>}
      <section id="contact" aria-label="Destino contacto">Formulario</section>
    </>
  )
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
    restoreProperty(window, 'scrollY', scrollYDescriptor)
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

  it('prioriza el margen del capitulo para no ocultarlo bajo un indice sticky', () => {
    reducedMotion = true
    render(
      <section aria-label="Capítulo del caso" id="capitulo" style={{ scrollMarginTop: '152px' }}>
        Capitulo del caso
      </section>,
    )
    const destino = screen.getByRole('region', { name: 'Capítulo del caso' })
    destino.getBoundingClientRect = jest.fn(() => ({ top: 500 }))

    expect(scrollToSection('capitulo')).toBe(true)
    expect(window.scrollTo).toHaveBeenCalledWith(0, 348)
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

  it('intercepta la ancla local, conserva sus metadatos y enfoca sin un segundo salto', () => {
    const frames = []
    window.requestAnimationFrame = jest.fn((callback) => {
      frames.push(callback)
      return frames.length
    })
    render(<PruebaAnclas />)
    const enlace = screen.getByRole('link', { name: 'Ir al destino' })
    const destino = screen.getByRole('region', { name: 'Destino de la ancla' })
    const focus = jest.spyOn(destino, 'focus')
    destino.getBoundingClientRect = jest.fn(() => ({ top: 0 }))

    expect(fireEvent.click(enlace)).toBe(false)
    expect(window.location.hash).toBe('#x')
    expect(destino).toHaveAttribute('data-anchor-target')
    expect(destino).not.toHaveAttribute('tabindex')
    expect(focus).not.toHaveBeenCalled()

    act(() => frames.shift()(16))

    expect(destino).toHaveAttribute('tabindex', '-1')
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(destino).toHaveFocus()
  })

  it.each([
    ['Meta', { metaKey: true }],
    ['Control', { ctrlKey: true }],
    ['Mayúsculas', { shiftKey: true }],
    ['Alt', { altKey: true }],
    ['botón no primario', { button: 1 }],
  ])('conserva el comportamiento nativo con %s', (_label, modifier) => {
    render(<PruebaAnclas />)
    const enlace = screen.getByRole('link', { name: 'Ir al destino' })

    expect(clickWithoutFollowingLink(enlace, modifier)).toBe(false)
    expect(window.location.hash).toBe('')
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it.each([
    ['Abrir destino aparte'],
    ['Ir a destino inexistente'],
  ])('no intercepta %s', (name) => {
    render(<PruebaAnclas />)

    expect(clickWithoutFollowingLink(screen.getByRole('link', { name }))).toBe(false)
    expect(window.location.hash).toBe('')
    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('traslada el foco después de que React cierre el menú móvil', () => {
    const frames = []
    window.requestAnimationFrame = jest.fn((callback) => {
      frames.push(callback)
      return frames.length
    })
    render(<PruebaCierreMenu />)
    const destino = screen.getByRole('region', { name: 'Destino contacto' })
    destino.getBoundingClientRect = jest.fn(() => ({ top: 0 }))

    fireEvent.click(screen.getByRole('link', { name: 'Contacto' }))

    expect(screen.getByRole('button', { name: 'Menú' })).toHaveFocus()
    expect(destino).not.toHaveFocus()
    act(() => frames.shift()(16))
    expect(destino).toHaveFocus()
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
    const nodes = Object.fromEntries([
      ['canonical', 'link', { rel: 'canonical' }],
      ...['description', 'twitter:title', 'twitter:description']
        .map((name) => [name, 'meta', { name }]),
      ...['og:title', 'og:description', 'og:url', 'og:locale']
        .map((property) => [property, 'meta', { property }]),
    ].map(([key, tag, attributes]) => {
      const node = document.createElement(tag)
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value))
      document.head.appendChild(node)
      return [key, node]
    }))
    const values = {
      'header.name': 'Alex Micó Robles',
      'header.title': 'Full Stack Developer',
      'meta.description': 'English description',
    }

    syncDocument('en', { getFixedT: () => (key) => values[key] }, '/en/')

    expect(document.title).toBe('Alex Micó Robles | Full Stack Developer')
    expect(nodes.canonical).toHaveAttribute(
      'href',
      'https://portfolioalex-mico.vercel.app/en/',
    )
    expect(nodes['og:locale']).toHaveAttribute('content', 'en_US')
    expect(nodes['twitter:description']).toHaveAttribute('content', 'English description')
    Object.values(nodes).forEach((node) => node.remove())
  })

  it('bloquea un segundo cambio de idioma mientras la transición sigue activa', async () => {
    jest.useFakeTimers()
    document.startViewTransition = jest.fn()
    const frames = []
    window.requestAnimationFrame = jest.fn((callback) => {
      frames.push(callback)
      return frames.length
    })
    const first = jest.fn()
    const second = jest.fn()

    try {
      const pending = runLanguageTransition(first)
      expect(await runLanguageTransition(second)).toBe(false)
      expect(second).not.toHaveBeenCalled()
      expect(await pending).toBe(true)
      expect(first).toHaveBeenCalledTimes(1)
      expect(document.startViewTransition).not.toHaveBeenCalled()
      expect(document.documentElement).toHaveAttribute('data-language-transition', 'settling')

      act(() => frames.shift()(16))
      act(() => frames.shift()(32))
      act(() => jest.advanceTimersByTime(190))
      expect(document.documentElement).toHaveAttribute('data-language-transition', 'settling')
      act(() => frames.shift()(206))
      expect(document.documentElement).not.toHaveAttribute('data-language-transition')
    } finally {
      delete document.startViewTransition
      document.documentElement.removeAttribute('data-language-transition')
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    }
  })

  it('conserva la posicion vertical al traducir el contenido', async () => {
    jest.useFakeTimers()
    const frames = []
    window.requestAnimationFrame = jest.fn((callback) => {
      frames.push(callback)
      return frames.length
    })
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 1300,
    })

    try {
      expect(await runLanguageTransition(jest.fn())).toBe(true)
      expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1300)
      expect(frames).toHaveLength(1)

      act(() => frames.shift()(16))
      expect(frames).toHaveLength(1)
      act(() => frames.shift()(32))
      expect(window.scrollTo).toHaveBeenCalledTimes(2)
      expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1300)

      act(() => jest.advanceTimersByTime(190))
      expect(window.scrollTo).toHaveBeenCalledTimes(3)
      expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1300)
      expect(document.documentElement).toHaveAttribute('data-language-transition', 'settling')
      expect(frames).toHaveLength(1)

      act(() => frames.shift()(206))
      expect(window.scrollTo).toHaveBeenCalledTimes(4)
      expect(document.documentElement).not.toHaveAttribute('data-language-transition')
      expect(frames).toHaveLength(1)

      act(() => frames.shift()(222))
      expect(window.scrollTo).toHaveBeenCalledTimes(5)
      expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1300)
    } finally {
      document.documentElement.removeAttribute('data-language-transition')
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    }
  })

  it('respeta movimiento reducido sin crear capturas ni animación', async () => {
    reducedMotion = true
    document.startViewTransition = jest.fn()
    const update = jest.fn()

    try {
      expect(await runLanguageTransition(update)).toBe(true)
      expect(update).toHaveBeenCalledTimes(1)
      expect(document.startViewTransition).not.toHaveBeenCalled()
      expect(document.documentElement).not.toHaveAttribute('data-language-transition')
    } finally {
      delete document.startViewTransition
    }
  })

  it('acepta el idioma mientras el tema termina su transición viva', async () => {
    jest.useFakeTimers()
    const update = jest.fn()
    document.documentElement.setAttribute('data-theme-transition', '')

    try {
      expect(await runLanguageTransition(update)).toBe(true)
      expect(update).toHaveBeenCalledTimes(1)
      expect(document.documentElement).toHaveAttribute('data-language-transition', 'settling')
      expect(document.documentElement).toHaveAttribute('data-theme-transition')
    } finally {
      document.documentElement.removeAttribute('data-theme-transition')
      document.documentElement.removeAttribute('data-language-transition')
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    }
  })
})
