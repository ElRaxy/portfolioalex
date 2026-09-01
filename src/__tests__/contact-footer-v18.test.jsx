const fs = require('fs')
const path = require('path')

const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

describe('v18 integra contacto y footer en el sistema editorial', () => {
  const contactCss = leer('componets', 'contact', 'contact.css')
  const footerCss = leer('componets', 'footer', 'footer.css')

  it('retira la tarjeta generica y conserva controles y errores legibles', () => {
    const formArea = contactCss.match(/\.contact__form-area\s*\{[\s\S]*?\n\}/)
    const controls = contactCss.match(/\.contact__form input,[\s\S]*?\n\}/)

    expect(formArea).not.toBeNull()
    expect(formArea[0]).toMatch(/background:\s*transparent/)
    expect(formArea[0]).toMatch(/border-top:\s*1px solid var\(--line-control\)/)
    expect(formArea[0]).toMatch(/border-bottom:\s*1px solid var\(--line-control\)/)
    expect(formArea[0]).toMatch(/box-shadow:\s*none/)
    expect(formArea[0]).not.toMatch(/surface-1|radius-md/)

    expect(controls).not.toBeNull()
    expect(controls[0]).toMatch(/min-height:\s*3rem/)
    expect(controls[0]).toMatch(/border-bottom:\s*1px solid var\(--line-control\)/)
    expect(contactCss).toMatch(/\.contact__field-error\s*\{[\s\S]*?color:\s*var\(--color-error\)/)
    expect(contactCss).toMatch(/\.contact__field--invalid input,[\s\S]*?border-color:\s*var\(--color-error\)/)
  })

  it('convierte el correo final en el cierre tipografico principal', () => {
    const mail = footerCss.match(/\.site-footer__mail\s*\{[\s\S]*?\n\}/)

    expect(mail).not.toBeNull()
    expect(mail[0]).toMatch(/min-height:\s*44px/)
    expect(mail[0]).toMatch(/font-size:\s*clamp\(2rem, 5\.4vw, 4\.75rem\)/)
    expect(mail[0]).toMatch(/color:\s*var\(--text-1\)/)
    expect(footerCss).toMatch(/\.site-footer__cta\s*\{[\s\S]*?border-bottom:\s*1px solid var\(--line-soft\)/)
    expect(footerCss).toMatch(/\.site-footer__legal a\s*\{[\s\S]*?min-height:\s*44px/)
  })

  it('usa solo tokens y evita recursos decorativos o movimiento', () => {
    expect(`${contactCss}\n${footerCss}`).not.toMatch(
      /#[0-9a-f]{3,8}\b|rgb\(|oklch\(|linear-gradient|radial-gradient|background-image|(?:^|[;{]\s*)transform\s*:|@keyframes|animation:/im,
    )
    expect(`${contactCss}\n${footerCss}`).not.toMatch(/url\(/i)
    expect(`${contactCss}\n${footerCss}`.match(/box-shadow:\s*[^;]+;/gi)).toEqual([
      'box-shadow: none;',
    ])
  })

  it('adapta la hoja a una columna sin reducir objetivos tactiles', () => {
    const mobile = contactCss.match(/@media screen and \(max-width: 600px\)\s*\{[\s\S]*$/)

    expect(mobile).not.toBeNull()
    expect(mobile[0]).toMatch(/\.contact__form\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(mobile[0]).toMatch(/\.contact__form > button\s*\{[\s\S]*?width:\s*100%/)
    expect(contactCss).toMatch(/\.contact__detail dd a\s*\{[\s\S]*?min-height:\s*44px/)
  })
})
