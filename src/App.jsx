import React from 'react'
import './index.css'
import Header from './componets/header/Header'
import Nav from './componets/nav/Nav'
import About from './componets/about/About'
import Stack from './componets/experience/Experience'
import Portfolio from './componets/portfolio/Portfolio'
import Contact from './componets/contact/Contact'
import Footer from './componets/footer/Footer'
import LanguageSelector from './componets/language/LanguageSelector'
import ThemeToggle from './componets/theme/ThemeToggle'
import { ThemeProvider } from './componets/theme/ThemeContext'

function App() {
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
          <Stack />
          <Contact />
          <Footer />
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
