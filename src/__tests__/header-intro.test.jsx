import React, { StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { act, render, screen } from '@testing-library/react'
import Header, { INTRO_SESSION_KEY } from '../componets/header/Header'
import '../i18n'

describe('la identidad personal se anima una vez por sesion', () => {
  const originalAnimate = Element.prototype.animate
  const originalMatchMedia = window.matchMedia
  let preference
  let listener
  let animations

  beforeEach(() => {
    window.sessionStorage.clear()
    animations = []
    preference = {
      matches: false,
      addEventListener: jest.fn((type, callback) => { listener = callback }),
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
    window.sessionStorage.clear()
    window.matchMedia = originalMatchMedia
    if (originalAnimate) Element.prototype.animate = originalAnimate
    else delete Element.prototype.animate
    jest.restoreAllMocks()
  })

  it('entrega identidad, rol y acciones en SSR sin esconder contenido', () => {
    const html = renderToStaticMarkup(<Header />)
    expect(html).toContain('aria-label="Alex Micó Robles"')
    expect(html).toContain('hero__word-text">Alex')
    expect(html).toContain('hero__word-text">Micó')
    expect(html).toContain('href="#about"')
    expect(html).not.toMatch(/opacity:|transform:|hero__support|React, Node/)
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBeNull()
  })

  it('compone el nombre en la primera visita y vuelve estatico desde un caso', () => {
    const first = render(<Header />)
    expect(Element.prototype.animate).toHaveBeenCalledTimes(6)
    expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe('seen')
    first.unmount()
    animations.forEach((animation) => expect(animation.cancel).toHaveBeenCalled())
    expect(preference.removeEventListener).toHaveBeenCalledWith('change', listener)
    Element.prototype.animate.mockClear()
    render(<Header />)
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
  })

  it('la comprobacion de efectos de StrictMode no consume la unica entrada', () => {
    render(<StrictMode><Header /></StrictMode>)
    expect(animations.length).toBe(12)
    expect(animations.slice(0, 6).every((animation) => animation.cancel.mock.calls.length === 1)).toBe(true)
    expect(animations.slice(6).every((animation) => animation.cancel.mock.calls.length === 0)).toBe(true)
  })

  it('respeta reduced motion inicial y cancela si cambia durante la entrada', () => {
    preference.matches = true
    const reduced = render(<Header />)
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    reduced.unmount()
    preference.matches = false
    render(<Header />)
    expect(animations).toHaveLength(6)
    act(() => listener({ matches: true }))
    animations.forEach((animation) => expect(animation.cancel).toHaveBeenCalled())
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
  })

  it('mantiene identidad visible si el navegador deniega sessionStorage', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    render(<Header />)
    expect(Element.prototype.animate).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Conóceme' })).toBeVisible()
  })
})
