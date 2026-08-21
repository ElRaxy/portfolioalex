import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './contact.css'
import { MdOutlineEmail } from 'react-icons/md'
import { BsWhatsapp } from 'react-icons/bs'
import { IoLocationOutline } from 'react-icons/io5'
import { FiLink } from 'react-icons/fi'
import emailjs from 'emailjs-com'

function Contact() {
  const { t } = useTranslation()
  const form = useRef()
  const [sendStatus, setSendStatus] = useState('idle')

  const sendEmail = async (e) => {
    e.preventDefault()

    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey) {
      setSendStatus('error')
      return
    }

    setSendStatus('sending')

    try {
      await emailjs.sendForm(serviceId, templateId, form.current, publicKey)
      form.current.reset()
      setSendStatus('ok')
    } catch {
      setSendStatus('error')
    }
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
            <a href="https://wa.me/34693912460" target="_blank" rel="noreferrer">{t('contact.send_message')}</a>
          </article>

          <article className="contact__option">
            <IoLocationOutline className="contact__option-icon"/>
            <h4>{t('contact.location')}</h4>
            <h5>Alicante, Villena</h5>
            <a href="https://maps.google.com/?q=Villena,+Alicante" target="_blank" rel="noreferrer">{t('contact.view_location')}</a>
          </article>

          <article className="contact__option">
            <FiLink className="contact__option-icon"/>
            <h4>{t('contact.website')}</h4>
            <h5>portfolioalex-mico.vercel.app</h5>
            <a href="https://portfolioalex-mico.vercel.app/" target="_blank" rel="noreferrer">{t('contact.visit_website')}</a>
          </article>
        </div>

        <form ref={form} onSubmit={sendEmail}>
          <input type="text" name="name" aria-label={t('contact.name')} placeholder={t('contact.name')} required />
          <input type="email" name="email" aria-label={t('contact.email_placeholder')} placeholder={t('contact.email_placeholder')} required />
          <textarea name="message" rows="7" aria-label={t('contact.message_placeholder')} placeholder={t('contact.message_placeholder')} required></textarea>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sendStatus === 'sending'}
          >
            {t(sendStatus === 'sending' ? 'contact.sending' : 'contact.message')}
          </button>

          <div className="contact__status" role="status" aria-live="polite">
            {sendStatus === 'ok' && (
              <p className="success-message">{t('contact.success')}</p>
            )}
            {sendStatus === 'error' && (
              <p className="error-message">{t('contact.error')}</p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

export default Contact
