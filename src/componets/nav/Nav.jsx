import React from 'react'
import { Link } from 'react-scroll'
import './nav.css'
import { FaHome, FaUser, FaBriefcase, FaCode, FaFolderOpen, FaEnvelope } from 'react-icons/fa'

const Nav = () => {
  return (
    <nav>
      <Link to="home" spy={true} smooth={true} offset={-70} duration={500}>
        <FaHome />
      </Link>
      <Link to="about" spy={true} smooth={true} offset={-70} duration={500}>
        <FaUser />
      </Link>
      <Link to="experience" spy={true} smooth={true} offset={-70} duration={500}>
        <FaBriefcase />
      </Link>
      <Link to="services" spy={true} smooth={true} offset={-70} duration={500}>
        <FaCode />
      </Link>
      <Link to="portfolio" spy={true} smooth={true} offset={-70} duration={500}>
        <FaFolderOpen />
      </Link>
      <Link to="contact" spy={true} smooth={true} offset={-70} duration={500}>
        <FaEnvelope />
      </Link>
    </nav>
  )
}

export default Nav
