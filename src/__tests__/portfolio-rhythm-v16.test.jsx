const fs = require('fs')
const path = require('path')

const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

describe('v16 compacta el recorrido sin perder evidencia', () => {
  const portfolioCss = leer('componets', 'portfolio', 'portfolio.css')
  const experienceCss = leer('componets', 'experience', 'experience.css')
  const contactCss = leer('componets', 'contact', 'contact.css')
  const footerCss = leer('componets', 'footer', 'footer.css')
  const portfolioSource = leer('componets', 'portfolio', 'Portfolio.jsx')

  it('la seleccion mantiene imagenes integras y no requiere progreso de scroll', () => {
    expect(portfolioCss).toMatch(/object-fit:\s*contain/)
    expect(portfolioCss).not.toMatch(/position:\s*sticky|data-story-mode/)
    expect(portfolioSource).not.toMatch(/useScroll|useMotionValueEvent/)
  })

  it('usa una sola columna movil con las cuatro evidencias en el documento', () => {
    const mobile = portfolioCss.slice(portfolioCss.indexOf('@media screen and (max-width: 700px)'))
    expect(mobile).toMatch(/\.portfolio__supporting-list\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(mobile).not.toMatch(/display:\s*none/)
  })

  it('reduce espacios repetidos y mantiene legibilidad y targets tactiles', () => {
    expect(experienceCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?padding-top:\s*var\(--space-10\);[\s\S]*?padding-bottom:\s*var\(--space-8\)/)
    expect(contactCss).toMatch(/\.contact__form input,[\s\S]*?min-height:\s*3rem/)
    expect(contactCss).toMatch(/\.contact__detail dd a\s*\{[\s\S]*?min-height:\s*44px/)
    expect(footerCss).toMatch(/\.site-footer__legal\s*\{[\s\S]*?font-size:\s*var\(--fs-sm\)/)
    expect(footerCss).toMatch(/\.site-footer__legal a\s*\{[\s\S]*?min-height:\s*44px/)
  })
})
