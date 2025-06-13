import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './contact.css'
import { MdOutlineEmail } from 'react-icons/md'
import { BsWhatsapp } from 'react-icons/bs'
import emailjs from 'emailjs-com'

function Contact() {
  const { t } = useTranslation();
  const form = useRef()

  const sendEmail = (e) => {
    e.preventDefault()

    emailjs.sendForm(
      'service_srltemq', 
      'template_03wbx8n', 
      form.current, 
      'h0ukj3yGIU-rbaN6v'
    )
    .then((result) => {
      console.log(result.text)
      form.current.reset()
    })
    .catch((error) => {
      console.log(error.text)
    })
  }

  return (
    <section id="contact">
      <h5>{t('contact.subtitle')}</h5>
      <h2>{t('contact.title')}</h2>

      <div className="container contact__container">
        <div className="contact__options">
          <article className="contact__option">
            <MdOutlineEmail className="contact__option-icon"/>
            <h4>{t('contact.email')}</h4>
            <h5>alexmico2006@gmail.com</h5>
            <a href="mailto:alexmico2006@gmail.com" target="_blank" rel="noreferrer">{t('contact.send_message')}</a>
          </article>

          <article className="contact__option">
            <BsWhatsapp className="contact__option-icon"/>
            <h4>{t('contact.whatsapp')}</h4>
            <h5>+34 693 91 24 60</h5>
            <a href="https://wa.me/693912460" target="_blank" rel="noreferrer">{t('contact.send_message')}</a>
          </article>
        </div>

        <form ref={form} onSubmit={sendEmail}>
          <input type="text" name="name" placeholder={t('contact.name')} required />
          <input type="email" name="email" placeholder={t('contact.email_placeholder')} required />
          <textarea name="message" rows="7" placeholder={t('contact.message_placeholder')} required></textarea>
          <button type="submit" className="btn btn-primary">{t('contact.message')}</button>
        </form>
      </div>
    </section>
  )
}

export default Contact
