import React from 'react'
import './index.css'
import Header from './componets/header/Header'
import Nav from './componets/nav/Nav'
import About from './componets/about/About'
import Experience from './componets/experience/Experience'
import Services from './componets/services/Services'
import Portfolio from './componets/portfolio/Portfolio'
import Testimonials from './componets/testimonials/Testimonials'
import Contact from './componets/contact/Contact'
import Footer from './componets/footer/Footer'
import ThemeToggle from './componets/theme/ThemeToggle'
import LanguageSelector from './componets/language/LanguageSelector'
import { ThemeProvider } from './componets/theme/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <>
        <Header />
        <Nav />
        <About />
        <Experience />
        <Services />
        <Portfolio />
        <Testimonials />
        <Contact />
        <Footer />
        <ThemeToggle />
        <LanguageSelector />
      </>
    </ThemeProvider>
  )
}

export default App
