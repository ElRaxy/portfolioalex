import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './contact.css'
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
        <dl className="contact__details">
          <div className="contact__detail">
            <dt>{t('contact.email')}</dt>
            <dd><a href="mailto:alexmico2006@gmail.com">alexmico2006@gmail.com</a></dd>
          </div>

          <div className="contact__detail">
            <dt>{t('contact.whatsapp')}</dt>
            <dd><a href="https://wa.me/34693912460" target="_blank" rel="noreferrer">+34 693 91 24 60</a></dd>
          </div>

          <div className="contact__detail">
            <dt>{t('contact.location')}</dt>
            <dd><a href="https://maps.google.com/?q=Villena,+Alicante" target="_blank" rel="noreferrer">Alicante, Villena</a></dd>
          </div>

          <div className="contact__detail">
            <dt>{t('contact.website')}</dt>
            <dd><a href="https://portfolioalex-mico.vercel.app/" target="_blank" rel="noreferrer">portfolioalex-mico.vercel.app</a></dd>
          </div>
        </dl>

        <div className="contact__form-area">
          <form className="contact__form" ref={form} onSubmit={sendEmail}>
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

            {(sendStatus === 'ok' || sendStatus === 'error') && (
              <div className="contact__status" role="status" aria-live="polite">
                {sendStatus === 'ok' && (
                  <p className="success-message">{t('contact.success')}</p>
                )}
                {sendStatus === 'error' && (
                  <p className="error-message">{t('contact.error')}</p>
                )}
              </div>
            )}
          </form>

          <p className="contact__direct-email">
            {t('contact.direct_email')}{' '}
            <a href="mailto:alexmico2006@gmail.com">alexmico2006@gmail.com</a>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Contact
