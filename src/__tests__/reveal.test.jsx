import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { act, render, screen } from '@testing-library/react'
import Reveal, { RevealGroup, RevealItem } from '../componets/common/Reveal'

// Exercise the enhancement lifecycle, rather than pinning its visual timing.
describe('Reveal conserva lectura y limpia animaciones', () => {
  const originalObserver = window.IntersectionObserver
  const originalMatchMedia = window.matchMedia
  const originalAnimate = Element.prototype.animate
  let callback
  let preference
  let preferenceChange
  let observer
  let animations

  beforeEach(() => {
    animations = []
    observer = { observe: jest.fn(), disconnect: jest.fn() }
    window.IntersectionObserver = jest.fn((onIntersection) => {
      callback = onIntersection
      return observer
    })
    preference = {
      matches: false,
      addEventListener: jest.fn((event, listener) => { preferenceChange = listener }),
      removeEventListener: jest.fn(),
    }
    window.matchMedia = jest.fn(() => preference)
    Element.prototype.animate = jest.fn(() => {
      const animation = { cancel: jest.fn() }
      animations.push(animation)
      return animation
    })
  })

  afterEach(() => {
    window.IntersectionObserver = originalObserver
    window.matchMedia = originalMatchMedia
    if (originalAnimate) Element.prototype.animate = originalAnimate
    else delete Element.prototype.animate
  })

  it('prerenderiza el contenido sin opacidad ni transformacion inline', () => {
    const html = renderToStaticMarkup(<Reveal as="section"><h2>Sobre mí</h2></Reveal>)
    expect(html).toBe('<section><h2>Sobre mí</h2></section>')
    expect(window.IntersectionObserver).not.toHaveBeenCalled()
    expect(Element.prototype.animate).not.toHaveBeenCalled()
  })

  it('deja el HTML visible antes de entrar en pantalla y sin WAAPI', () => {
    delete Element.prototype.animate
    render(<Reveal as="section"><h2>Trabajo real</h2><a href="/proyectos/strev/">Strev</a></Reveal>)
    expect(screen.getByRole('heading', { name: 'Trabajo real' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Strev' })).toBeVisible()
    expect(window.IntersectionObserver).not.toHaveBeenCalled()
  })

  it('anima los hijos de un grupo cuando aparece y limpia al desmontar', () => {
    const { unmount } = render(
      <RevealGroup as="ul"><RevealItem as="li">Strev</RevealItem><RevealItem as="li">Sereno</RevealItem></RevealGroup>,
    )
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    act(() => callback([{ isIntersecting: false }]))
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    act(() => callback([{ isIntersecting: true }]))
    expect(Element.prototype.animate).toHaveBeenCalledTimes(2)
    expect(observer.disconnect).toHaveBeenCalled()
    unmount()
    animations.forEach((animation) => expect(animation.cancel).toHaveBeenCalled())
    expect(preference.removeEventListener).toHaveBeenCalledWith('change', preferenceChange)
  })

  it('respeta reduced motion inicial sin crear animaciones ni observador', () => {
    preference.matches = true
    render(<Reveal>Contenido accesible</Reveal>)
    expect(screen.getByText('Contenido accesible')).toBeVisible()
    expect(window.IntersectionObserver).not.toHaveBeenCalled()
    expect(Element.prototype.animate).not.toHaveBeenCalled()
  })

  it('cancela el movimiento activo al cambiar la preferencia y conserva lectura', () => {
    render(<Reveal><a href="#contact">Contacto</a></Reveal>)
    act(() => callback([{ isIntersecting: true }]))
    preference.matches = true
    act(() => preferenceChange())
    expect(animations[0].cancel).toHaveBeenCalled()
    expect(observer.disconnect).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Contacto' })).toBeVisible()
  })
})
