const fs = require('fs')
const path = require('path')

const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

describe('v16 compacta el recorrido sin perder evidencia', () => {
  const portfolioCss = leer('componets', 'portfolio', 'portfolio.css')
  const experienceCss = leer('componets', 'experience', 'experience.css')
  const contactCss = leer('componets', 'contact', 'contact.css')
  const footerCss = leer('componets', 'footer', 'footer.css')
  const portfolioSource = leer('componets', 'portfolio', 'Portfolio.jsx')

  it('acorta el relato de escritorio sin animar ni recortar la evidencia visual', () => {
    expect(portfolioCss).toMatch(
      /\.portfolio__item\[data-story-mode='scroll'\] \.portfolio__story-step\s*\{[\s\S]*?min-height:\s*clamp\(7rem, 13svh, 9rem\)/,
    )
    expect(portfolioCss).not.toMatch(/transform:\s*scale\(/)
    expect(portfolioCss).not.toMatch(/\.portfolio__item:hover \.portfolio__media img/)
  })

  it('presenta en movil las decisiones como un indice compacto y conserva sus titulos en el DOM', () => {
    const mobile = portfolioCss.match(
      /@media screen and \(max-width: 700px\)\s*\{[\s\S]*?(?=@media screen and \(max-width: 360px\))/,
    )

    expect(mobile).not.toBeNull()
    expect(mobile[0]).toMatch(/\.portfolio__story\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/)
    expect(mobile[0]).toMatch(/counter-reset:\s*project-decision/)
    expect(mobile[0]).toMatch(/\.portfolio__item\[data-story-mode\] \.portfolio__story-step\s*\{[\s\S]*?min-height:\s*44px/)
    expect(mobile[0]).toMatch(/\.portfolio__item\[data-story-mode\] \.portfolio__story-step p\s*\{[\s\S]*?display:\s*none/)
    expect(portfolioSource).toMatch(/<h4>\{decision\.title\}<\/h4>[\s\S]*?<p>\{decision\.body\}<\/p>/)
    expect(mobile[0]).toMatch(/\.portfolio__item--supporting \.portfolio__media\s*\{[\s\S]*?display:\s*flex/)
  })

  it('reduce espacios repetidos y mantiene legibilidad y targets tactiles', () => {
    expect(experienceCss).toMatch(/@media screen and \(max-width: 600px\)[\s\S]*?padding-top:\s*var\(--space-10\);[\s\S]*?padding-bottom:\s*var\(--space-8\)/)
    expect(contactCss).toMatch(/\.contact__form input,[\s\S]*?min-height:\s*3rem/)
    expect(contactCss).toMatch(/\.contact__detail dd a\s*\{[\s\S]*?min-height:\s*44px/)
    expect(footerCss).toMatch(/\.site-footer__legal\s*\{[\s\S]*?font-size:\s*var\(--fs-sm\)/)
    expect(footerCss).toMatch(/\.site-footer__legal a\s*\{[\s\S]*?min-height:\s*44px/)
  })
})
