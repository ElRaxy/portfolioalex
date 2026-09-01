const fs = require('fs')
const path = require('path')

const css = fs.readFileSync(
  path.join(__dirname, '..', 'componets', 'caseStudy', 'caseStudy.css'),
  'utf8',
)

const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] || ''
}

describe('case study editorial v17', () => {
  it('presenta el indice como navegacion textual accesible y sticky solo en escritorio amplio', () => {
    const index = rule('.case__index')
    const link = rule('.case__index a')
    const desktop = css.match(
      /@media screen and \(min-width: 1025px\)\s*\{[\s\S]*?\.case__index\s*\{([\s\S]*?)\n\s*\}\n\}/,
    )?.[1] || ''

    expect(index).toMatch(/display:\s*grid/)
    expect(index).toMatch(/border-top:\s*1px solid var\(--line-soft\)/)
    expect(index).not.toMatch(/border-radius|gradient/)
    expect(link).toMatch(/min-height:\s*44px/)
    expect(desktop).toMatch(/position:\s*sticky/)
    expect(desktop).toMatch(/top:\s*var\(--nav-height\)/)
    expect(css).toMatch(
      /@media screen and \(max-width: 760px\)[\s\S]*?\.case__index\s*\{[\s\S]*?position:\s*static/,
    )
  })

  it('ordena cada capitulo en rail editorial y recupera una columna en movil', () => {
    const block = rule('.case__block,\n.site-shell__content .case__block,\n.site-shell__content .case__block + .case__block')

    expect(block).toMatch(/display:\s*grid/)
    expect(block).toMatch(
      /grid-template-columns:\s*minmax\(9\.5rem, 0\.32fr\) minmax\(0, 1fr\)/,
    )
    expect(block).toMatch(/scroll-margin-top:/)
    expect(css).toMatch(/\.case \.case__block > h2\s*\{[\s\S]*?grid-row:\s*1;/)
    expect(css).not.toMatch(/grid-row:\s*1\s*\/\s*span/)
    expect(css).toMatch(/\.case \.case__block:target > h2,[\s\S]*?\[data-anchor-target\] > h2\s*\{[\s\S]*?color:\s*var\(--accent\)/)
    expect(css).toMatch(
      /@media screen and \(max-width: 760px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    )
  })

  it('convierte los resultados en ledger tipografico sin superficie azul', () => {
    const results = rule('.case__results')
    const result = rule('.case__result')

    expect(results).toMatch(/border-top:\s*1px solid var\(--line-control\)/)
    expect(results).toMatch(/border-bottom:\s*1px solid var\(--line-control\)/)
    expect(results).toMatch(/background:\s*transparent/)
    expect(results).not.toMatch(/surface-sel|border-radius/)
    expect(result).toMatch(/border-right:\s*1px solid var\(--line-soft\)/)
    expect(css).toMatch(/\.case__result-value\s*\{[\s\S]*?font-size:[\s\S]*?overflow-wrap:\s*normal[\s\S]*?word-break:\s*normal/)
    expect(css).toMatch(
      /@media screen and \(max-width: 600px\)[\s\S]*?\.case__result,[\s\S]*?grid-template-columns:\s*minmax\(7rem, 0\.75fr\) minmax\(0, 1\.25fr\)/,
    )
  })

  it('cierra con un enlace de continuidad completo y estados sin desplazar layout', () => {
    const next = rule('.case__next')
    const nextLink = rule('.case__next-link')
    const hover = rule('.case__next-link:hover')
    const active = rule('.case__next-link:active')

    expect(next).toMatch(/width:\s*100%/)
    expect(next).toMatch(/border-top:/)
    expect(nextLink).toMatch(/width:\s*100%/)
    expect(nextLink).toMatch(/min-height:\s*8rem/)
    expect(nextLink).toMatch(/grid-template-areas:/)
    expect(nextLink).not.toMatch(/transform|border-radius|gradient/)
    expect(hover).toMatch(/color:\s*var\(--accent-hover\)/)
    expect(active).toMatch(/color:\s*var\(--accent-active\)/)
  })

  it('mantiene la evidencia estable y elimina movimiento con reduced motion', () => {
    const media = rule('.case__media img')
    const reducedMotion = css.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1] || ''

    expect(media).toMatch(/object-fit:\s*contain/)
    expect(media).not.toMatch(/transform|animation|transition/)
    expect(css).not.toMatch(/@keyframes/)
    expect(reducedMotion).toMatch(/transition:\s*none/)
  })
})
