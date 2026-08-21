import React from 'react'
import './index.css'
import Header from './componets/header/Header'
import Nav from './componets/nav/Nav'
import About from './componets/about/About'
import Stack from './componets/experience/Experience'
import Portfolio from './componets/portfolio/Portfolio'
import Contact from './componets/contact/Contact'
import Footer from './componets/footer/Footer'
import { ThemeProvider } from './componets/theme/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <>
        <Nav />
        <Header />
        <Portfolio />
        <Stack />
        <About />
        <Contact />
        <Footer />
      </>
    </ThemeProvider>
  )
}

export default App
