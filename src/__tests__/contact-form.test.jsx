import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Contact from '../componets/contact/Contact'
import '../i18n'

const rellenar = ({ name, email, message }) => {
  userEvent.clear(screen.getByLabelText(/tu nombre/i))
  userEvent.type(screen.getByLabelText(/tu nombre/i), name)
  userEvent.clear(screen.getByLabelText(/tu correo/i))
  userEvent.type(screen.getByLabelText(/tu correo/i), email)
  userEvent.clear(screen.getByLabelText(/tu mensaje/i))
  userEvent.type(screen.getByLabelText(/tu mensaje/i), message)
}

const valido = {
  name: 'Alex Micó',
  email: 'alguien@ejemplo.com',
  message: 'Un mensaje de mas de diez caracteres.',
}

describe('formulario de contacto', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) }))
  })

  afterEach(() => jest.restoreAllMocks())

  // Este es el contrato con api/contact.js: si alli cambian los limites, este
  // test tiene que fallar. Es lo unico propio que hay que medir — que la
  // validacion nativa funcione es cosa del navegador, y jsdom ni la aplica.
  it('exige en el navegador los mismos limites que exige el servidor', () => {
    render(<Contact />)

    expect(screen.getByLabelText(/tu nombre/i)).toHaveAttribute('minLength', '2')
    expect(screen.getByLabelText(/tu nombre/i)).toHaveAttribute('maxLength', '100')
    expect(screen.getByLabelText(/tu mensaje/i)).toHaveAttribute('minLength', '10')
    expect(screen.getByLabelText(/tu mensaje/i)).toHaveAttribute('maxLength', '5000')
  })

  it('envia cuando el mensaje llega a diez caracteres', async () => {
    render(<Contact />)

    rellenar({ ...valido, message: '1234567890' })
    userEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    const [url, opciones] = global.fetch.mock.calls[0]
    expect(url).toBe('/api/contact')
    expect(JSON.parse(opciones.body).message).toBe('1234567890')
  })

  it('un fallo de configuracion no se cuenta igual que uno de envio', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'not_configured' }),
    }))
    render(<Contact />)

    rellenar(valido)
    userEvent.click(screen.getByRole('button', { name: /enviar/i }))

    const aviso = await screen.findByRole('status')
    const configurado = aviso.textContent

    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'send_failed' }),
    }))
    userEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe(configurado))
  })

  it('el aviso de error se pinta una sola vez', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ ok: false, error: 'send_failed' }),
    }))
    render(<Contact />)

    rellenar(valido)
    userEvent.click(screen.getByRole('button', { name: /enviar/i }))

    await screen.findByRole('status')
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('el boton vuelve a estar disponible pase lo que pase', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('sin red')))
    render(<Contact />)

    rellenar(valido)
    const boton = screen.getByRole('button', { name: /enviar/i })
    userEvent.click(boton)

    await waitFor(() => expect(boton).not.toBeDisabled())
  })

  it('lleva honeypot y no se lo ensena a nadie', () => {
    const { container } = render(<Contact />)

    const honeypot = container.querySelector('[name="company"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('tabIndex', '-1')
  })
})
