import React from 'react'
import './header.css'
import { FaLinkedin, FaGithub, FaDribbble } from 'react-icons/fa'

function HeaderSocials() {
  return (
    <div className="header__socials">
      <a href="https://linkedin.com" target="_blank" rel="noreferrer"><FaLinkedin /></a>
      <a href="https://github.com" target="_blank" rel="noreferrer"><FaGithub /></a>
      <a href="https://dribbble.com" target="_blank" rel="noreferrer"><FaDribbble /></a>
    </div>
  )
}

export default HeaderSocials
