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
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const leer = (ruta) => readFileSync(path.join(raiz, 'build', ruta), 'utf8')

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

// Rail de ambito (2026-08-23). El nombre del proyecto no vuelve al rotulo: lo
// dice un span propio encima, y solo en los dos bloques cuyos pasajes viajan
// sin sujeto cuando un extractor los levanta sueltos, las decisiones y los
// numeros. Dos y no cinco: el resumen, el problema y el hueco ya se nombran en
// su propia prosa, asi que ahi el ambito seria repeticion. Se cuenta el hecho y
// el veredicto lo compone el script, para que mover la decision rompa CI en vez
// de pasar inadvertida como paso con el hallazgo 13.
const H2_CON_AMBITO_ESPERADOS = 2
const MEDIA_POR_CASO = {
  savemymoneynow: 'savemymoneynow-detection',
  strev: 'strev-product',
  atalaya: 'atalaya-health',
  sereno: 'sereno-session-overview',
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
  if (!nodo) anota(pagina, 'sin nodo de pagina en el JSON-LD')
  else {
    if (nodo.inLanguage !== pagina.idioma) anota(pagina, `JSON-LD inLanguage=${nodo.inLanguage}`)
    const tituloHtml = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]
    if (nodo.name !== tituloHtml) anota(pagina, `JSON-LD name no coincide con el title (${nodo.name})`)
    if (pagina.tipo === 'caso' && nodo['@type'] !== 'WebPage') {
      anota(pagina, 'un caso no puede declararse ProfilePage')
    }
  }

  // Cada pagina descarga el CV de SU idioma. El bundler resolvia todos los .pdf
  // al mismo fichero, asi que las paginas inglesas servian el CV castellano y
  // nada lo delataba: el enlace funcionaba, solo estaba en el otro idioma.
  const cvEsperado = `/${CV_POR_IDIOMA[pagina.idioma]}`
  if (!html.includes(`href="${cvEsperado}"`)) {
    anota(pagina, `no descarga ${cvEsperado}`)
  }

  if (pagina.tipo === 'caso') {
    const figura = html.match(/<figure class="case__media(?:\s|")[\s\S]*?<\/figure>/)?.[0]
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

    // El ambito solo sirve si sale del documento: escondido en un aria-label o
    // en un sr-only, el extractor no lo ve y el cambio no existe.
    const ambitosVisibles = (html.match(/<span class="case__scope">/g) || []).length
    if (ambitosVisibles !== H2_CON_AMBITO_ESPERADOS) {
      anota(pagina, `${ambitosVisibles} span de ambito, deberia haber ${H2_CON_AMBITO_ESPERADOS}`)
    }
  }
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
