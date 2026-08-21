import React from 'react'
import { useTranslation } from 'react-i18next'
import { FaGithub } from 'react-icons/fa'
import { MdOutlineEmail } from 'react-icons/md'
import { BsWhatsapp } from 'react-icons/bs'
import './header.css'

const HeaderSocials = () => {
  const { t } = useTranslation()

  return (
    <div className="hero__socials">
      <a
        href="https://github.com/ElRaxy"
        target="_blank"
        rel="noreferrer"
        aria-label={t('contact.website')}
      >
        <FaGithub aria-hidden="true" />
      </a>
      <a href="mailto:alexmico2006@gmail.com" aria-label={t('contact.email')}>
        <MdOutlineEmail aria-hidden="true" />
      </a>
      <a
        href="https://wa.me/693912460"
        target="_blank"
        rel="noreferrer"
        aria-label={t('contact.whatsapp')}
      >
        <BsWhatsapp aria-hidden="true" />
      </a>
    </div>
  )
}

export default HeaderSocials
