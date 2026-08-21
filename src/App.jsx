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
import LanguageSelector from './componets/language/LanguageSelector'
import ThemeToggle from './componets/theme/ThemeToggle'
import { ThemeProvider } from './componets/theme/ThemeContext'
import { useSmoothAnchors, useLanguageFromHistory } from './lib/smoothScroll'

function App() {
  const { i18n } = useTranslation()
  useSmoothAnchors()
  useLanguageFromHistory(i18n)

  return (
    <ThemeProvider>
      <div className="site-shell">
        <Nav />

        <header className="site-shell__sidebar">
          <Header />
        </header>

        <main className="site-shell__content">
          <div className="site-shell__controls">
            <LanguageSelector />
            <ThemeToggle />
          </div>

          <About />
          <Portfolio />
          <ExperienceTimeline />
          <Stack />
          <Contact />
          <Footer />
        </main>
      </div>

      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  )
}

export default App
