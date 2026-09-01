import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import i18next from 'i18next'
import { I18nextProvider } from 'react-i18next'
import CaseStudy from '../componets/caseStudy/CaseStudy'
import i18n from '../i18n'

const languages = {
  es: {
    indexLabel: 'Dentro del caso',
    nextLabel: 'Siguiente proyecto',
    summary: 'En una frase',
    problem: 'El problema',
    decisions: 'Cómo funciona',
    results: 'Dónde está el listón',
    prefix: '/proyectos/',
  },
  en: {
    indexLabel: 'Inside this case',
    nextLabel: 'Next project',
    summary: 'In one line',
    problem: 'The problem',
    decisions: 'How it works',
    results: 'Where the bar sits',
    prefix: '/en/projects/',
  },
}

const nextBySlug = {
  strev: 'sereno',
  sereno: 'savemymoneynow',
  savemymoneynow: 'atalaya',
  atalaya: 'strev',
}

describe('navegacion interna de los casos v17', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('es'))
  })

  it.each(Object.entries(languages))(
    'usa el indice y el siguiente proyecto localizados en %s',
    async (language, labels) => {
      await act(() => i18n.changeLanguage(language))
      const dictionary = require(`../i18n/locales/${language}/translation.json`)

      for (const project of dictionary.portfolio.projects) {
        const { unmount } = render(<CaseStudy language={language} slug={project.slug} />)
        const article = screen.getByRole('article')
        const index = within(article).getByRole('navigation', { name: labels.indexLabel })
        const expectedChapters = [
          [labels.summary, '#case-summary'],
          [labels.problem, '#case-problem'],
          [labels.decisions, '#case-decisions'],
          [labels.results, '#case-results'],
        ]

        expect(within(index).getByText(labels.indexLabel)).toBeInTheDocument()
        expect(within(index).getAllByRole('link').map((link) => [
          link.textContent,
          link.getAttribute('href'),
        ])).toEqual(expectedChapters)

        expectedChapters.forEach(([name]) => {
          expect(within(article).getByRole('heading', { name })).toBeInTheDocument()
        })
        expect(within(article).queryByRole('heading', { name: dictionary.case_study.gap_label }))
          .not.toBeInTheDocument()
        expect(within(index).queryByRole('link', { name: dictionary.case_study.gap_label }))
          .not.toBeInTheDocument()

        const nextSlug = nextBySlug[project.slug]
        const nextProject = dictionary.portfolio.projects.find(({ slug }) => slug === nextSlug)
        const nextCase = dictionary.case_study.cases[nextSlug]
        const nextNavigation = within(article).getByRole('navigation', { name: labels.nextLabel })
        const nextLink = within(nextNavigation).getByRole('link')

        expect(nextLink).toHaveAttribute('href', `${labels.prefix}${nextSlug}/`)
        expect(within(nextLink).getByText(nextProject.title)).toBeInTheDocument()
        expect(within(nextLink).getByText(nextCase.tagline)).toBeInTheDocument()
        expect(within(article).getAllByRole('navigation', { name: labels.nextLabel })).toHaveLength(1)

        unmount()
      }
    },
  )

  it('incluye el capitulo gap solo cuando el caso tiene ese contenido', async () => {
    const dictionary = JSON.parse(JSON.stringify(
      require('../i18n/locales/es/translation.json'),
    ))
    dictionary.case_study.cases.atalaya.gap = ['Existe una alternativa, pero no cubre este caso.']
    const isolatedI18n = i18next.createInstance()
    await isolatedI18n.init({
      lng: 'es',
      fallbackLng: 'es',
      interpolation: { escapeValue: false },
      resources: { es: { translation: dictionary } },
    })

    render(
      <I18nextProvider i18n={isolatedI18n}>
        <CaseStudy language="es" slug="atalaya" />
      </I18nextProvider>,
    )

    const article = screen.getByRole('article')
    const index = within(article).getByRole('navigation', { name: 'Dentro del caso' })
    expect(within(index).getByRole('link', {
      name: dictionary.case_study.gap_label,
    })).toHaveAttribute('href', '#case-gap')
    expect(within(article).getByRole('heading', { name: dictionary.case_study.gap_label }))
      .toBeInTheDocument()
  })
})
