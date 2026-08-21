import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Reveal from '../common/Reveal'
import './contact.css'

function Contact() {
  const { t } = useTranslation()
  const form = useRef()
  const [sendStatus, setSendStatus] = useState('idle')
  const shouldReduceMotion = useReducedMotion()
  const hasStatus = sendStatus === 'ok' || sendStatus === 'error'
  const StatusElement = shouldReduceMotion ? 'div' : motion.div
  const statusAnimationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    style: { overflow: 'hidden' },
  }

  const sendEmail = async (e) => {
    e.preventDefault()
    setSendStatus('sending')

    try {
      const formData = new FormData(form.current)
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
          company: formData.get('company'),
        }),
      })

      if (!response.ok) {
        throw new Error('Contact request failed')
      }

      form.current.reset()
      setSendStatus('ok')
    } catch {
      setSendStatus('error')
    }
  }

  return (
    <Reveal as="section" id="contact">
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
        </dl>

        <div className="contact__form-area">
          <form className="contact__form" ref={form} onSubmit={sendEmail}>
            <div className="contact__honeypot" aria-hidden="true">
              <input type="text" name="company" tabIndex={-1} autoComplete="off" />
            </div>

            <label className="contact__field">
              <span>{t('contact.name')}</span>
              <input type="text" name="name" required />
            </label>

            <label className="contact__field">
              <span>{t('contact.email_placeholder')}</span>
              <input type="email" name="email" required />
            </label>

            <label className="contact__field contact__field--message">
              <span>{t('contact.message_placeholder')}</span>
              <textarea name="message" rows="5" required></textarea>
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sendStatus === 'sending'}
            >
              {t(sendStatus === 'sending' ? 'contact.sending' : 'contact.message')}
            </button>

            <AnimatePresence mode="wait">
              {hasStatus && (
                <StatusElement
                  key={sendStatus}
                  className="contact__status"
                  role="status"
                  aria-live="polite"
                  {...statusAnimationProps}
                >
                  {sendStatus === 'ok' && (
                    <p className="success-message">{t('contact.success')}</p>
                  )}
                  {sendStatus === 'error' && (
                    <p className="error-message">{t('contact.error')}</p>
                  )}
                </StatusElement>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </Reveal>
  )
}

export default Contact
