import React from 'react'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import Header from './componets/header/Header'
import Nav from './componets/nav/Nav'
import About from './componets/about/About'
import Stack, { ExperienceTimeline } from './componets/experience/Experience'
import Portfolio from './componets/portfolio/Portfolio'
import Contact from './componets/contact/Contact'
import Footer from './componets/footer/Footer'
import CaseStudy from './componets/caseStudy/CaseStudy'
import './componets/caseStudy/caseStudy.css'
import LanguageSelector from './componets/language/LanguageSelector'
import ThemeToggle from './componets/theme/ThemeToggle'
import { ThemeProvider } from './componets/theme/ThemeContext'
import { useSmoothAnchors, useLanguageFromHistory } from './lib/smoothScroll'
import { parseRoute } from './lib/routing'
import { RoutePathnameContext } from './lib/routeContext'

// La ruta se lee una vez y no cambia: cada pagina de caso es un HTML propio,
// prerenderizado, al que se llega con una navegacion normal del navegador.
const readPathname = () => {
  try {
    return typeof window === 'undefined' ? '/' : window.location.pathname
  } catch {
    return '/'
  }
}

function App({ pathname }) {
  const { i18n } = useTranslation()
  const rutaActual = pathname || readPathname()
  const route = parseRoute(rutaActual)
  useSmoothAnchors()
  useLanguageFromHistory(i18n)

  return (
    <RoutePathnameContext.Provider value={rutaActual}>
      <ThemeProvider>
        <div className={route.kind === 'case' ? 'site-shell site-shell--case' : 'site-shell'}>
          <Nav />

          {/* Antes del sidebar en el DOM porque es donde estan en pantalla: dentro
              del main se alcanzaban en la parada 11 y 12 del tabulador estando
              arriba del todo (WCAG 2.4.3). La rejilla los recoloca. */}
          <div className="site-shell__controls">
            <LanguageSelector />
            <ThemeToggle />
          </div>

          <header className="site-shell__sidebar">
            <Header nameAs={route.kind === 'case' ? 'p' : 'h1'} />
          </header>

          <main className="site-shell__content">
            {route.kind === 'case' ? (
              <>
                <CaseStudy slug={route.slug} />
                <Contact />
                <Footer />
              </>
            ) : (
              <>
                <About />
                <Portfolio />
                <ExperienceTimeline />
                <Stack />
                <Contact />
                <Footer />
              </>
            )}
          </main>
        </div>

        <Analytics />
        <SpeedInsights />
      </ThemeProvider>
    </RoutePathnameContext.Provider>
  )
}

export default App
