import React from 'react'
import './header.css'
import { FaGithub } from 'react-icons/fa'

function HeaderSocials() {
  return (
    <div className="header__socials">
      <a href="https://github.com/ElRaxy" target="_blank" rel="noreferrer" aria-label="GitHub"><FaGithub /></a>
    </div>
  )
}

export default HeaderSocials
