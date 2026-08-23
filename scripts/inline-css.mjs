/* eslint-env node */
// Mete la hoja de estilos dentro de cada HTML del build y quita el <link>.
//
// Por que: el reloj de las animaciones de entrada no arranca en el primer
// paint, arranca cuando llega la hoja externa. Medido el 2026-08-23 sobre el
// hero: startTime 45 ms en local y 336 ms en produccion, con la hoja en 39 KB
// (7,6 KB comprimidos). Un round-trip render-blocking cuesta mas que llevar
// esos 7,6 KB dentro del documento, que ademas ya viene prerenderizado.
//
// Seguro porque el CSS no tiene ni un url(): al cambiar de base no hay ruta
// relativa que se rompa. Si algun dia aparece uno, este script debe fallar.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const build = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build')
const ENLACE = /<link[^>]+href="(\/static\/css\/[^"]+\.css)"[^>]*rel="stylesheet"[^>]*>|<link[^>]+rel="stylesheet"[^>]*href="(\/static\/css\/[^"]+\.css)"[^>]*>/

const htmls = (dir) => readdirSync(dir).flatMap((entrada) => {
  const completa = path.join(dir, entrada)
  if (statSync(completa).isDirectory()) return htmls(completa)
  return completa.endsWith('.html') ? [completa] : []
})

const paginas = htmls(build)
const tocadas = []

for (const pagina of paginas) {
  const html = readFileSync(pagina, 'utf8')
  const enlace = html.match(ENLACE)
  if (!enlace) continue

  const hoja = enlace[1] || enlace[2]
  const css = readFileSync(path.join(build, hoja), 'utf8')
  if (css.includes('url(')) {
    console.error(`${hoja} tiene url(): al inlinear cambiaria la base de esas rutas`)
    process.exit(1)
  }

  writeFileSync(pagina, html.replace(enlace[0], `<style>${css}</style>`))
  tocadas.push(path.relative(build, pagina))
}

if (!tocadas.length) {
  console.error('Ningun HTML del build enlazaba la hoja de estilos')
  process.exit(1)
}
console.log(`CSS inline en ${tocadas.length} de ${paginas.length} paginas`)
