import fs from 'fs'
import path from 'path'

describe('hero v16 en viewport apaisado de poca altura', () => {
  const css = fs.readFileSync(
    path.join(__dirname, '..', 'componets', 'header', 'header.css'),
    'utf8',
  )
  const start = css.indexOf('/* v16: composicion compacta para movil y tablet apaisados. */')
  const end = css.indexOf('@media screen and (max-width: 600px)', start)
  const landscape = css.slice(start, end)

  it('activa una composicion horizontal solo entre 601 y 1050px con poca altura', () => {
    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    expect(landscape).toMatch(
      /@media screen and \(min-width: 601px\) and \(max-width: 1050px\) and \(orientation: landscape\) and \(max-height: 650px\)/,
    )
    expect(landscape).toMatch(
      /\.hero\s*\{[\s\S]*?grid-template-columns:\s*minmax\(18rem, 0\.9fr\) minmax\(0, 1\.1fr\)/,
    )
    expect(landscape).toMatch(/min-height:\s*calc\(100svh - var\(--nav-height\)\)/)
  })

  it('muestra una evidencia util y deja la segunda en el flujo', () => {
    expect(landscape).toMatch(
      /\.hero__stage\s*\{[\s\S]*?height:\s*auto;[\s\S]*?gap:\s*var\(--space-3\);[\s\S]*?overflow:\s*visible/,
    )
    expect(landscape).toMatch(
      /\.hero__preview\s*\{[\s\S]*?flex:\s*none;[\s\S]*?height:\s*clamp\(17rem,[\s\S]*?19rem\)/,
    )
    expect(landscape).toMatch(/\.hero__preview--sereno\s*\{[\s\S]*?height:\s*clamp\(11rem, 49svh, 13rem\)/)
    expect(landscape).not.toMatch(/\.hero__preview(?:--strev|--sereno)?\s*\{[\s\S]*?display:\s*none/)
  })

  it('conserva targets tactiles e imagenes completas sin zoom', () => {
    const imageRule = css.match(/\.hero__preview img\s*\{[\s\S]*?\n\}/)

    expect(landscape).toMatch(
      /\.hero__actions \.hero__button\s*\{[\s\S]*?min-height:\s*44px/,
    )
    expect(imageRule).not.toBeNull()
    expect(imageRule[0]).toMatch(/object-fit:\s*contain/)
    expect(imageRule[0]).not.toMatch(/object-fit:\s*cover|transform:/)
    expect(landscape).not.toMatch(/\.hero__preview img\s*\{[\s\S]*?transform:/)
  })
})
