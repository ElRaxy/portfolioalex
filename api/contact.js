const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function validationError(res, error) {
  return res.status(400).json({ ok: false, error })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  let body = req.body

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return validationError(res, 'invalid_body')
    }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return validationError(res, 'invalid_body')
  }

  const { name, email, message, company } = body
  const companyValue = company == null ? '' : String(company).trim()

  if (companyValue) {
    return res.status(200).json({ ok: true })
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return validationError(res, 'invalid_name')
  }

  if (
    typeof email !== 'string'
    || email.length < 5
    || email.length > 200
    || !EMAIL_PATTERN.test(email)
  ) {
    return validationError(res, 'invalid_email')
  }

  if (
    typeof message !== 'string'
    || message.trim().length < 10
    || message.trim().length > 5000
  ) {
    return validationError(res, 'invalid_message')
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const contactTo = process.env.CONTACT_TO

  if (!resendApiKey || !contactTo) {
    const missingVariables = [
      !resendApiKey && 'RESEND_API_KEY',
      !contactTo && 'CONTACT_TO',
    ].filter(Boolean).join(', ')

    console.error('Contact endpoint is missing required variables:', missingVariables)
    return res.status(500).json({ ok: false, error: 'not_configured' })
  }

  const trimmedName = name.trim().replace(/[\r\n]+/g, ' ')
  const trimmedEmail = email.trim()
  const trimmedMessage = message.trim()
  const escapedName = escapeHtml(trimmedName)
  const escapedEmail = escapeHtml(trimmedEmail)
  const escapedMessage = escapeHtml(trimmedMessage).replace(/\r?\n/g, '<br>')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Portfolio Alex <portfolio@strev.app>',
        to: contactTo,
        reply_to: trimmedEmail,
        subject: `Portfolio: mensaje de ${trimmedName}`,
        text: `Nombre: ${trimmedName}\nEmail: ${trimmedEmail}\n\nMensaje:\n${trimmedMessage}`,
        html: `<p><strong>Nombre:</strong> ${escapedName}</p><p><strong>Email:</strong> ${escapedEmail}</p><p><strong>Mensaje:</strong><br>${escapedMessage}</p>`,
      }),
    })

    if (!response.ok) {
      console.error('Resend request failed with status:', response.status)
      return res.status(502).json({ ok: false, error: 'send_failed' })
    }
  } catch {
    console.error('Resend request failed before receiving a response')
    return res.status(502).json({ ok: false, error: 'send_failed' })
  }

  return res.status(200).json({ ok: true })
}
