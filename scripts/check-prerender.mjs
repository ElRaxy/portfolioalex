/* eslint-env node */
// Guardian del prerender. Corre en CI despues del build y tambien a mano:
//   node scripts/check-prerender.mjs
//
// Vigila lo que ningun test de jsdom puede ver, porque solo existe en el HTML
// ya escrito: que el contenido salga dentro de #root, que cada pagina declare
// su idioma y su canonical, y que las paginas de caso no hereden lo de la
// portada. Hasta el 2026-08-22 solo miraba las dos portadas, y por eso tres
// defectos vivieron meses en las seis paginas de caso. Desde el 2026-08-23
// mira las diez que escribe el prerender: dos portadas y cuatro casos por idioma.
// La lista va literal a proposito, no derivada de la del prerender:
// una lista derivada seguiria el mismo fallo que tiene que cazar.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const leer = (ruta) => readFileSync(path.join(raiz, 'build', ruta), 'utf8')
const leerPublico = (ruta) => readFileSync(path.join(raiz, 'public', ruta))
const leerBuild = (ruta) => readFileSync(path.join(raiz, 'build', ruta))

const PAGINAS = [
  { ruta: 'index.html', idioma: 'es', tipo: 'portada', idioma_alterno: '/en/' },
  { ruta: 'en/index.html', idioma: 'en', tipo: 'portada', idioma_alterno: '/' },
  { ruta: 'proyectos/atalaya/index.html', idioma: 'es', tipo: 'caso', slug: 'atalaya', idioma_alterno: '/en/projects/atalaya/' },
  { ruta: 'proyectos/savemymoneynow/index.html', idioma: 'es', tipo: 'caso', slug: 'savemymoneynow', idioma_alterno: '/en/projects/savemymoneynow/' },
  { ruta: 'proyectos/strev/index.html', idioma: 'es', tipo: 'caso', slug: 'strev', idioma_alterno: '/en/projects/strev/' },
  { ruta: 'proyectos/sereno/index.html', idioma: 'es', tipo: 'caso', slug: 'sereno', idioma_alterno: '/en/projects/sereno/' },
  { ruta: 'en/projects/atalaya/index.html', idioma: 'en', tipo: 'caso', slug: 'atalaya', idioma_alterno: '/proyectos/atalaya/' },
  { ruta: 'en/projects/savemymoneynow/index.html', idioma: 'en', tipo: 'caso', slug: 'savemymoneynow', idioma_alterno: '/proyectos/savemymoneynow/' },
  { ruta: 'en/projects/strev/index.html', idioma: 'en', tipo: 'caso', slug: 'strev', idioma_alterno: '/proyectos/strev/' },
  { ruta: 'en/projects/sereno/index.html', idioma: 'en', tipo: 'caso', slug: 'sereno', idioma_alterno: '/proyectos/sereno/' },
]

// El ambito de cada caso sale del diccionario, que es de donde lo saca el
// componente: comparar contra una copia a mano seria comparar el HTML consigo
// mismo.
const DICCIONARIOS = {
  es: JSON.parse(readFileSync(path.join(raiz, 'src/i18n/locales/es/translation.json'), 'utf8')),
  en: JSON.parse(readFileSync(path.join(raiz, 'src/i18n/locales/en/translation.json'), 'utf8')),
}
const CV_POR_IDIOMA = {
  es: 'Alex_Mico_Robles_CV_ES.pdf',
  en: 'Alex_Mico_Robles_CV_EN.pdf',
}

// Rail de ambito (2026-08-23, editado en v10). El nombre del proyecto sigue en
// el texto del DOM de los dos bloques cuyos pasajes viajan sin sujeto, pero se
// retira del plano visual y del nombre accesible: el H1 ya ha establecido el
// caso. Dos y no cinco: resumen, problema y hueco ya se nombran en su prosa.
const H2_CON_AMBITO_ESPERADOS = 2
const MEDIA_POR_CASO = {
  savemymoneynow: 'savemymoneynow-detection',
  strev: 'strev-product',
  atalaya: 'atalaya-health',
  sereno: 'sereno-session-overview',
}
const ORDEN_PORTADA = ['Strev', 'Sereno', 'SaveMyMoneyNow', 'Atalaya']
const SOCIAL_IMAGE_URL = 'https://portfolioalex-mico.vercel.app/og-image.png?v=3'
const SOCIAL_IMAGE_ALT = 'Alex Micó Robles · Full Stack Developer · Strev + Sereno'
const SOCIAL_ASSET_SHA256 = {
  'og-image.png': '86d3162b89bc961158e6da1f2d02e5c826b47878e7e4e0c3436d18ebcf239d02',
  'apple-touch-icon.png': '420e9780eefc2f7020f23d9d0e352b417fda274a3bdc0126d88b8724f15109d3',
}

const metaContent = (html, attribute, key) => html.match(
  new RegExp(`<meta\\b[^>]*\\b${attribute}="${key}"[^>]*\\bcontent="([^"]*)"[^>]*>`, 'i'),
)?.[1]

const pngInfo = (buffer) => {
  const signature = buffer.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') return null

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  }
}

const grafoDe = (html) => {
  const bloque = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  return bloque ? JSON.parse(bloque[1]) : null
}

const fallos = []
const anota = (pagina, mensaje) => fallos.push(`${pagina.ruta}: ${mensaje}`)

for (const pagina of PAGINAS) {
  const html = leer(pagina.ruta)
  const root = html.match(/<div id="root">([\s\S]*)<\/div>/)

  if (!root || root[1].length < 5000) anota(pagina, '#root casi vacio')
  if (!html.includes(`<html lang="${pagina.idioma}"`)) anota(pagina, 'lang incorrecto')
  if (!html.includes('rel="canonical"')) anota(pagina, 'sin canonical')
  if ((html.match(/hreflang=/g) || []).length !== 3) anota(pagina, 'faltan hreflang')

  // Una pagina con dos h1 no tiene ninguno.
  const titulares = (html.match(/<h1\b/g) || []).length
  if (titulares !== 1) anota(pagina, `${titulares} h1, deberia haber 1`)

  // El selector de idioma tiene que llevar a la traduccion de ESTA pagina.
  const selector = html.match(/<a class="lang-btn" href="([^"]+)"/)
  if (!selector) anota(pagina, 'sin selector de idioma')
  else if (selector[1] !== pagina.idioma_alterno) {
    anota(pagina, `el idioma alterno apunta a ${selector[1]}, no a ${pagina.idioma_alterno}`)
  }

  // La hoja externa retrasa el arranque de las animaciones de entrada hasta
  // que llega: 336 ms medidos en produccion el 2026-08-23. Va dentro del HTML.
  if (/href="\/static\/css\/[^"]+\.css"/.test(html)) anota(pagina, 'la hoja de estilos volvio a ser un <link> externo')
  if (!html.includes('<style>')) anota(pagina, 'sin CSS dentro del documento')

  const grafo = grafoDe(html)
  const nodo = grafo?.['@graph']?.find((x) => x['@type'] === 'ProfilePage' || x['@type'] === 'WebPage')
  const persona = grafo?.['@graph']?.find((x) => x['@type'] === 'Person')
  if (!nodo) anota(pagina, 'sin nodo de pagina en el JSON-LD')
  else {
    if (nodo.inLanguage !== pagina.idioma) anota(pagina, `JSON-LD inLanguage=${nodo.inLanguage}`)
    const tituloHtml = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]
    if (nodo.name !== tituloHtml) anota(pagina, `JSON-LD name no coincide con el title (${nodo.name})`)
    if (pagina.tipo === 'caso' && nodo['@type'] !== 'WebPage') {
      anota(pagina, 'un caso no puede declararse ProfilePage')
    }
  }

  if (metaContent(html, 'property', 'og:image') !== SOCIAL_IMAGE_URL) {
    anota(pagina, 'og:image no usa el asset social v3')
  }
  if (metaContent(html, 'name', 'twitter:image') !== SOCIAL_IMAGE_URL) {
    anota(pagina, 'twitter:image no usa el asset social v3')
  }
  if (metaContent(html, 'property', 'og:image:alt') !== SOCIAL_IMAGE_ALT) {
    anota(pagina, 'og:image:alt no nombra a Alex, Strev y Sereno')
  }
  if (metaContent(html, 'name', 'twitter:image:alt') !== SOCIAL_IMAGE_ALT) {
    anota(pagina, 'twitter:image:alt no coincide con el OG')
  }
  if (persona?.image !== SOCIAL_IMAGE_URL) {
    anota(pagina, 'Person.image no usa el asset social v3')
  }

  // Cada pagina descarga el CV de SU idioma. El bundler resolvia todos los .pdf
  // al mismo fichero, asi que las paginas inglesas servian el CV castellano y
  // nada lo delataba: el enlace funcionaba, solo estaba en el otro idioma.
  const cvEsperado = `/${CV_POR_IDIOMA[pagina.idioma]}`
  if (!html.includes(`href="${cvEsperado}"`)) {
    anota(pagina, `no descarga ${cvEsperado}`)
  }

  if (pagina.tipo === 'caso') {
    const figuras = [...html.matchAll(/<figure class="case__media(?:\s|")[\s\S]*?<\/figure>/g)]
      .map((coincidencia) => coincidencia[0])
    const figura = figuras[0]
    if (!figura) {
      anota(pagina, 'el caso no pinta su figura de evidencia')
    } else {
      if (!figura.includes('<img ')) anota(pagina, 'la figura del caso no contiene una imagen')
      if (!figura.includes('<figcaption>')) anota(pagina, 'la figura del caso no tiene pie visible')

      const asset = MEDIA_POR_CASO[pagina.slug]
      if (!asset || !figura.includes(asset)) {
        anota(pagina, `la figura no usa el asset real esperado (${asset || 'sin mapa'})`)
      }
    }

    if (pagina.slug === 'strev' || pagina.slug === 'sereno') {
      const apertura = html.match(/<header\b[^>]*class="[^"]*case__header--primary[^"]*"[^>]*>[\s\S]*?<\/header>/)?.[0]
      if (figuras.length !== 1) {
        anota(pagina, `el flagship pinta ${figuras.length} figuras; deberia pintar exactamente 1`)
      }
      if (!apertura || !apertura.includes('class="case__media')) {
        anota(pagina, 'la evidencia flagship no vive dentro de la apertura primary')
      }
      const resumen = html.match(/<section class="case__block case__block--summary"[\s\S]*?<\/section>/)?.[0]
      if (resumen?.includes('class="case__media')) {
        anota(pagina, 'la evidencia flagship se repite dentro del resumen')
      }
    }

    if (html.includes('class="pdiag') || html.includes('class="portfolio__terminal')) {
      anota(pagina, 'el caso conserva un diagrama o terminal sintetico')
    }

    // En un caso no existen las secciones de la portada.
    const sueltas = [...html.matchAll(/href="(#[a-z-]+)"/g)].map((x) => x[1])
    if (sueltas.length) anota(pagina, `anclas a secciones inexistentes: ${[...new Set(sueltas)].join(', ')}`)

    const ambito = DICCIONARIOS[pagina.idioma].case_study.cases[pagina.slug].scope
    const h2 = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((x) => x[1].toLowerCase())
    const conAmbito = h2.filter((texto) => texto.includes(ambito.toLowerCase())).length
    if (conAmbito !== H2_CON_AMBITO_ESPERADOS) {
      anota(pagina, `${conAmbito} h2 nombran "${ambito}", deberia haber ${H2_CON_AMBITO_ESPERADOS}`)
    }

    const ambitosEnDom = (html.match(/<span\b[^>]*\bclass="case__scope"[^>]*>/g) || [])
    if (ambitosEnDom.length !== H2_CON_AMBITO_ESPERADOS) {
      anota(pagina, `${ambitosEnDom.length} span de ambito, deberia haber ${H2_CON_AMBITO_ESPERADOS}`)
    }
    if (ambitosEnDom.some((span) => !span.includes('aria-hidden="true"'))) {
      anota(pagina, 'el ambito vuelve a contaminar el nombre accesible del heading')
    }
  } else {
    const posiciones = ORDEN_PORTADA.map((proyecto, index) => {
      const nivel = index < 2 ? 3 : 4
      return root[1].search(new RegExp(`<h${nivel}\\b[^>]*>${proyecto}</h${nivel}>`))
    })
    if (posiciones.some((posicion) => posicion < 0)) {
      anota(pagina, 'falta un proyecto de la portada editorial')
    } else if (posiciones.some((posicion, index) => index > 0 && posicion < posiciones[index - 1])) {
      anota(pagina, `orden de proyectos incorrecto: ${ORDEN_PORTADA.join(', ')}`)
    }

    const principales = (root[1].match(/data-tier="primary"/g) || []).length
    if (principales !== 2) anota(pagina, `${principales} proyectos principales, deberia haber 2`)
    if (!root[1].includes('sereno-session-overview')) {
      anota(pagina, 'Sereno no sirve la evidencia estatica')
    }
    if (root[1].includes('sereno-demo')) anota(pagina, 'Sereno todavia sirve la demo animada')

    const temas = (root[1].match(/class="theme-toggle"/g) || []).length
    if (temas !== 1) anota(pagina, `${temas} selectores de tema, deberia haber 1`)
  }

  const accionTema = DICCIONARIOS[pagina.idioma].controls.theme
  const botonTema = root[1].match(/<button class="theme-toggle"[\s\S]*?<\/button>/)?.[0]
  if (!botonTema?.includes(`aria-label="${accionTema}"`)) {
    anota(pagina, `el tema prerenderizado no usa el nombre neutro "${accionTema}"`)
  }
}

const ogSvg = leerPublico('og-image.svg').toString('utf8')
if (!/Strev/.test(ogSvg) || !/Sereno/.test(ogSvg)) {
  fallos.push('public/og-image.svg: no presenta Strev y Sereno')
}
if (/Product casebook/i.test(ogSvg)) {
  fallos.push('public/og-image.svg: conserva Product casebook')
}

const faviconSvg = leerPublico('favicon.svg').toString('utf8')
if (!/<title(?:\s[^>]*)?>Alex Micó Robles<\/title>/.test(faviconSvg)) {
  fallos.push('public/favicon.svg: falta el titulo de la marca personal')
}
if (/<text\b/i.test(faviconSvg)) {
  fallos.push('public/favicon.svg: el favicon no puede depender de texto renderizado')
}

for (const [asset, width, height] of [
  ['og-image.png', 1200, 630],
  ['apple-touch-icon.png', 180, 180],
]) {
  const source = leerPublico(asset)
  const built = leerBuild(asset)
  const info = pngInfo(source)
  const digest = createHash('sha256').update(source).digest('hex')

  if (!info) {
    fallos.push(`public/${asset}: no es PNG valido`)
  } else {
    if (info.width !== width || info.height !== height) {
      fallos.push(`public/${asset}: ${info.width}x${info.height}, deberia ser ${width}x${height}`)
    }
    if (info.bitDepth !== 8 || info.colorType !== 2) {
      fallos.push(`public/${asset}: debe ser RGB de 8 bits (depth=${info.bitDepth}, colorType=${info.colorType})`)
    }
  }

  if (!source.equals(built)) {
    fallos.push(`build/${asset}: no coincide con public/${asset}`)
  }
  if (digest !== SOCIAL_ASSET_SHA256[asset]) {
    fallos.push(`public/${asset}: el SHA-256 no coincide con el raster v9 aprobado`)
  }
}

if (!leer('404.html').includes('/favicon.svg?v=3')) {
  fallos.push('404.html: no referencia el favicon v3')
}

for (const [idioma, nombre] of Object.entries(CV_POR_IDIOMA)) {
  const fuente = readFileSync(path.join(raiz, 'src', 'assets', `cv-${idioma}.pdf`))
  const publicado = readFileSync(path.join(raiz, 'build', nombre))
  if (!fuente.equals(publicado)) fallos.push(`${nombre}: no coincide con el CV ${idioma}`)
}

const sitemap = leer('sitemap.xml')
const urls = (sitemap.match(/<loc>/g) || []).length
if (urls !== 10) fallos.push(`sitemap.xml: ${urls} URLs, deberia haber 10`)
if (/\/(?:proyectos|en\/projects)\/wordpress\//.test(sitemap)) {
  fallos.push('sitemap.xml: conserva la ruta retirada de WordPress')
}

if (fallos.length) {
  console.error(fallos.join('\n'))
  process.exit(1)
}
console.log(`Prerender correcto en ${PAGINAS.length} paginas y sitemap con ${urls} URLs`)
