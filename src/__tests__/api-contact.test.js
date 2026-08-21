import handler from '../../api/contact'

const crearRes = () => {
  const res = {
    statusCode: null,
    payload: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(payload) { this.payload = payload; return this },
  }
  return res
}

const cuerpoValido = {
  name: 'Alex Micó',
  email: 'alguien@ejemplo.com',
  message: 'Un mensaje que pasa de los diez caracteres.',
}

describe('api/contact', () => {
  const entorno = { ...process.env }

  beforeEach(() => {
    process.env.RESEND_API_KEY = 're_test'
    process.env.CONTACT_TO = 'destino@ejemplo.com'
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = { ...entorno }
    jest.restoreAllMocks()
  })

  it('rechaza cualquier metodo que no sea POST y anuncia cual acepta', async () => {
    const res = crearRes()
    await handler({ method: 'GET' }, res)

    expect(res.statusCode).toBe(405)
    expect(res.payload).toEqual({ ok: false, error: 'method_not_allowed' })
    expect(res.headers.Allow).toBe('POST')
  })

  it('finge exito cuando el honeypot viene relleno, sin enviar nada', async () => {
    const res = crearRes()
    await handler({ method: 'POST', body: { ...cuerpoValido, company: 'bot' } }, res)

    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ ok: true })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['invalid_name', { ...cuerpoValido, name: 'A' }],
    ['invalid_email', { ...cuerpoValido, email: 'sin-arroba' }],
    ['invalid_message', { ...cuerpoValido, message: 'Once cha' }],
  ])('devuelve %s cuando el campo no cumple lo que exige el servidor', async (error, body) => {
    const res = crearRes()
    await handler({ method: 'POST', body }, res)

    expect(res.statusCode).toBe(400)
    expect(res.payload).toEqual({ ok: false, error })
  })

  it('acepta un mensaje de exactamente diez caracteres', async () => {
    const res = crearRes()
    await handler({ method: 'POST', body: { ...cuerpoValido, message: '1234567890' } }, res)

    expect(res.statusCode).toBe(200)
  })

  it('distingue faltar configuracion de fallar el envio', async () => {
    delete process.env.RESEND_API_KEY
    const res = crearRes()
    await handler({ method: 'POST', body: cuerpoValido }, res)

    expect(res.statusCode).toBe(500)
    expect(res.payload).toEqual({ ok: false, error: 'not_configured' })
  })

  it('devuelve send_failed cuando Resend responde mal', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 422 }))
    const res = crearRes()
    await handler({ method: 'POST', body: cuerpoValido }, res)

    expect(res.statusCode).toBe(502)
    expect(res.payload).toEqual({ ok: false, error: 'send_failed' })
  })

  it('devuelve send_failed cuando la peticion ni siquiera llega', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('sin red')))
    const res = crearRes()
    await handler({ method: 'POST', body: cuerpoValido }, res)

    expect(res.statusCode).toBe(502)
    expect(res.payload).toEqual({ ok: false, error: 'send_failed' })
  })

  it('escapa el HTML del mensaje para que no viaje markup ajeno en el correo', async () => {
    const res = crearRes()
    await handler({
      method: 'POST',
      body: { ...cuerpoValido, message: 'Hola <script>alert(1)</script> que tal' },
    }, res)

    const enviado = JSON.parse(global.fetch.mock.calls[0][1].body)
    expect(enviado.html).not.toContain('<script>')
    expect(enviado.html).toContain('&lt;script&gt;')
    expect(enviado.reply_to).toBe(cuerpoValido.email)
    expect(res.statusCode).toBe(200)
  })

  it('acepta el cuerpo en texto plano y rechaza el que no es JSON', async () => {
    const ok = crearRes()
    await handler({ method: 'POST', body: JSON.stringify(cuerpoValido) }, ok)
    expect(ok.statusCode).toBe(200)

    const mal = crearRes()
    await handler({ method: 'POST', body: 'esto no es json' }, mal)
    expect(mal.statusCode).toBe(400)
    expect(mal.payload).toEqual({ ok: false, error: 'invalid_body' })
  })
})
