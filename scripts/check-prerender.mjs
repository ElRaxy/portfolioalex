/* eslint-env node */
// Guardian del prerender. Corre en CI despues del build y tambien a mano:
//   node scripts/check-prerender.mjs
//
// Vigila lo que ningun test de jsdom puede ver, porque solo existe en el HTML
// ya escrito: que el contenido salga dentro de #root, que cada pagina declare
// su idioma y su canonical, y que las paginas de caso no hereden lo de la
// portada. Hasta el 2026-08-22 solo miraba las dos portadas, y por eso tres
// defectos vivieron meses en las ocho paginas de caso.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const leer = (ruta) => readFileSync(path.join(raiz, 'build', ruta), 'utf8')

const PAGINAS = [
  { ruta: 'index.html', idioma: 'es', tipo: 'portada', idioma_alterno: '/en/' },
  { ruta: 'en/index.html', idioma: 'en', tipo: 'portada', idioma_alterno: '/' },
  { ruta: 'proyectos/atalaya/index.html', idioma: 'es', tipo: 'caso', idioma_alterno: '/en/projects/atalaya/' },
  { ruta: 'proyectos/wordpress/index.html', idioma: 'es', tipo: 'caso', idioma_alterno: '/en/projects/wordpress/' },
  { ruta: 'en/projects/strev/index.html', idioma: 'en', tipo: 'caso', idioma_alterno: '/proyectos/strev/' },
  { ruta: 'en/projects/savemymoneynow/index.html', idioma: 'en', tipo: 'caso', idioma_alterno: '/proyectos/savemymoneynow/' },
]

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
  const cv = html.match(/href="([^"]*cv-(es|en)\.[^"]*\.pdf)"/)
  if (!cv) anota(pagina, 'sin enlace de descarga del CV')
  else if (cv[2] !== pagina.idioma) anota(pagina, `descarga el CV en ${cv[2]}, deberia ser ${pagina.idioma}`)

  if (pagina.tipo === 'caso') {
    // En un caso no existen las secciones de la portada.
    const sueltas = [...html.matchAll(/href="(#[a-z-]+)"/g)].map((x) => x[1])
    if (sueltas.length) anota(pagina, `anclas a secciones inexistentes: ${[...new Set(sueltas)].join(', ')}`)
  }
}

const sitemap = leer('sitemap.xml')
const urls = (sitemap.match(/<loc>/g) || []).length
if (urls !== 10) fallos.push(`sitemap.xml: ${urls} URLs, deberia haber 10`)

if (fallos.length) {
  console.error(fallos.join('\n'))
  process.exit(1)
}
console.log(`Prerender correcto en ${PAGINAS.length} paginas y sitemap con ${urls} URLs`)
