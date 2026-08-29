import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from '../App'
import '../i18n'

describe('la continuidad de foco del menu movil', () => {
  it('enfoca el primer enlace y devuelve el foco sin desplazar la pagina', () => {
    render(<App pathname="/" />)

    const navegacion = screen.getByRole('navigation', { name: 'Navegación por secciones' })
    const primerEnlace = within(navegacion).getByRole('link', { name: 'Proyectos' })
    const botonMenu = within(navegacion).getByRole('button', { name: 'Abrir menú' })
    const focoPrimerEnlace = jest.spyOn(primerEnlace, 'focus')
    const focoBotonMenu = jest.spyOn(botonMenu, 'focus')

    try {
      fireEvent.click(botonMenu)
      expect(botonMenu).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(botonMenu)
      expect(botonMenu).toHaveAttribute('aria-expanded', 'false')

      expect(focoPrimerEnlace).toHaveBeenCalledWith({ preventScroll: true })
      expect(focoBotonMenu).toHaveBeenCalledWith({ preventScroll: true })
    } finally {
      focoPrimerEnlace.mockRestore()
      focoBotonMenu.mockRestore()
    }
  })
})
