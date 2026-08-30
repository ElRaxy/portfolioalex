import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import Header from './componets/header/Header'
import CTA from './componets/header/CTA'
import Nav from './componets/nav/Nav'
import About from './componets/about/About'
import Stack, { ExperienceTimeline } from './componets/experience/Experience'
import Portfolio from './componets/portfolio/Portfolio'
import Contact from './componets/contact/Contact'
import Footer from './componets/footer/Footer'
import CaseStudy from './componets/caseStudy/CaseStudy'
import './componets/caseStudy/caseStudy.css'
import { ThemeProvider } from './componets/theme/ThemeContext'
import { useSmoothAnchors, useLanguageFromHistory } from './lib/smoothScroll'
import { parseRoute } from './lib/routing'
import { ROUTE_CHANGE_EVENT, RoutePathnameContext } from './lib/routeContext'

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
  const [browserPathname, setBrowserPathname] = useState(readPathname)
  const rutaActual = pathname || browserPathname
  const route = parseRoute(rutaActual)
  useSmoothAnchors()
  useLanguageFromHistory(i18n)

  useEffect(() => {
    if (pathname) return undefined

    const syncPathname = () => setBrowserPathname(readPathname())
    window.addEventListener('popstate', syncPathname)
    window.addEventListener(ROUTE_CHANGE_EVENT, syncPathname)

    return () => {
      window.removeEventListener('popstate', syncPathname)
      window.removeEventListener(ROUTE_CHANGE_EVENT, syncPathname)
    }
  }, [pathname])

  return (
    <RoutePathnameContext.Provider value={rutaActual}>
      <ThemeProvider>
        <div className={route.kind === 'case' ? 'site-shell site-shell--case' : 'site-shell'}>
          <Nav />

          {route.kind !== 'case' && <Header />}

          <main className="site-shell__content">
            {route.kind === 'case' ? (
              <>
                <CaseStudy language={route.language} slug={route.slug} />
                <aside className="site-shell__case-actions" aria-label={i18n.t('header.availability')}>
                  <CTA />
                </aside>
                <Contact />
                <Footer />
              </>
            ) : (
              <>
                <Portfolio />
                <About />
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
