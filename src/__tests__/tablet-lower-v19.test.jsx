const fs = require('fs')
const path = require('path')

const leer = (...partes) => fs.readFileSync(path.join(__dirname, '..', ...partes), 'utf8')

describe('v19 compone la mitad inferior especificamente para tablet', () => {
  const aboutCss = leer('componets', 'about', 'about.css')
  const experienceCss = leer('componets', 'experience', 'experience.css')
  const contactCss = leer('componets', 'contact', 'contact.css')

  it('presenta los cuatro datos de About en una reticula 2 por 2', () => {
    const tablet = aboutCss.match(
      /@media screen and \(min-width: 701px\) and \(max-width: 1050px\)\s*\{[\s\S]*?\n\}/,
    )

    expect(tablet).not.toBeNull()
    expect(aboutCss).toMatch(
      /@media screen and \(min-width: 701px\) and \(max-width: 1050px\)[\s\S]*?\.about__facts\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
    )
    expect(aboutCss).toMatch(
      /@media screen and \(min-width: 701px\) and \(max-width: 1050px\)[\s\S]*?\.about__fact:nth-child\(n \+ 3\)[\s\S]*?box-shadow:\s*inset 0 1px 0 var\(--line-soft\)/,
    )
  })

  it('separa el titulo de Experiencia y Stack de la reticula de escritorio a 1024', () => {
    const tablet = experienceCss.match(
      /@media screen and \(min-width: 901px\) and \(max-width: 1050px\)\s*\{[\s\S]*?\n\}/,
    )

    expect(tablet).not.toBeNull()
    expect(experienceCss).toMatch(
      /@media screen and \(min-width: 901px\) and \(max-width: 1050px\)[\s\S]*?\.experience,[\s\S]*?\.stack\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    )
    expect(experienceCss).toMatch(
      /@media screen and \(min-width: 901px\) and \(max-width: 1050px\)[\s\S]*?\.experience__content\s*\{[\s\S]*?minmax\(16rem, 0\.65fr\)/,
    )
  })

  it('da al Contacto todo el ancho hasta tablet apaisada y apila su interior antes', () => {
    expect(contactCss).toMatch(
      /\.site-shell--case #contact\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    )
    expect(contactCss).toMatch(
      /@media screen and \(max-width: 1200px\)[\s\S]*?#contact,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    )
    expect(contactCss).toMatch(
      /@media screen and \(max-width: 900px\)[\s\S]*?\.container\.contact__container\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    )
  })

  it('preserva los contratos tactiles y los cortes de movil y escritorio', () => {
    expect(contactCss).toMatch(/\.contact__detail dd a\s*\{[\s\S]*?min-height:\s*44px/)
    expect(contactCss).toMatch(/@media screen and \(max-width: 600px\)/)
    expect(aboutCss).toMatch(/@media screen and \(max-width: 700px\)/)
    expect(experienceCss).toMatch(/@media screen and \(max-width: 600px\)/)
    expect(`${aboutCss}\n${experienceCss}\n${contactCss}`).not.toMatch(
      /#[0-9a-f]{3,8}\b|rgb\(|oklch\(|linear-gradient|radial-gradient|background-image|url\(/i,
    )
  })
})
