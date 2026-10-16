import React from 'react'
import { render, screen, within } from '@testing-library/react'
import App from '../App'
import '../i18n'

describe('la portada personal deja los proyectos como evidencia posterior', () => {
  it('presenta a Alex sin capturas ni nombres de producto', () => {
    render(<App pathname="/" />)
    const hero = document.getElementById('home')
    expect(within(hero).getByRole('heading', { level: 1 })).toHaveAccessibleName('Alex Micó Robles')
    expect(within(hero).queryByRole('img')).toBeNull()
    expect(within(hero).queryByRole('group')).toBeNull()
    expect(hero).not.toHaveTextContent(/Strev|Sereno|SaveMyMoneyNow|Atalaya/)
    expect(within(hero).getByRole('link', { name: 'Conóceme' })).toHaveAttribute('href', '#about')
    expect(within(hero).getByRole('link', { name: 'Descargar CV' })).toHaveAttribute('download', 'Alex_Mico_Robles_CV_ES.pdf')
  })

  it('situa criterio y experiencia antes de proyectos en el documento y la navegacion', () => {
    render(<App pathname="/" />)
    const main = screen.getByRole('main')
    const sections = [...main.children].filter((node) => node.tagName === 'SECTION')
    expect(sections.map(({ id }) => id)).toEqual(['about', 'experience', 'portfolio', 'stack', 'contact'])
    const navigation = screen.getByRole('navigation', { name: 'Navegación por secciones' })
    expect(within(navigation).getAllByRole('link').filter((node) => node.classList.contains('portfolio-nav__link')).map((node) => node.getAttribute('href')))
      .toEqual(['#about', '#experience', '#portfolio', '#stack', '#contact'])
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('en los casos conserva el regreso a proyectos y el CV localizado', () => {
    render(<App pathname="/en/projects/strev/" />)
    expect(screen.getByRole('link', { name: 'Abrir Strev y Sereno' })).toHaveAttribute('href', '/en/#portfolio')
    expect(screen.getByRole('link', { name: 'Descargar CV' })).toHaveAttribute('href', '/Alex_Mico_Robles_CV_EN.pdf')
  })
})
