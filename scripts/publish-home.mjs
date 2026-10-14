import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const siteUrl = 'https://portfolioalex-mico.vercel.app/'
const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export async function publishHome(directory = projectDirectory) {
  const source = await readFile(path.join(directory, 'public/experimental/index.html'), 'utf8')
  const previous = await readFile(path.join(directory, 'public/index.html'), 'utf8')
  const title = source.match(/<title>(.*?)<\/title>/s)[1]
  const description = source.match(/<meta name="description" content="([^"]*)">/)[1]
  const metadata = previous.match(/<(?:meta|link)\b[^>]*>/g).filter(tag =>
    /(?:property="og:|name="twitter:|name="author"|name="google-site-verification"|rel="(?:icon|apple-touch-icon|canonical)")/.test(tag)
  ).map(tag => {
    if (/(?:og:|twitter:)(?:title|description)"/.test(tag)) {
      const value = /description"/.test(tag) ? description : title
      return tag.replace(/content="[^"]*"/, `content="${value}"`)
    }
    return tag
  }).join('\n')

  // Absolute asset URLs keep fragment links on the root document, without a <base>.
  const html = source.replace(/\b(href|src)="([^"]+)"/g, (attribute, name, value) => {
    if (/^(?:#|\/|[a-z][a-z\d+.-]*:)/i.test(value)) return attribute
    const resolved = new URL(value, `${siteUrl}experimental/`)
    return `${name}="${resolved.pathname}${resolved.search}${resolved.hash}"`
  }).replace('</head>', `${metadata}\n</head>`)

  await writeFile(path.join(directory, 'build/index.html'), html)
  return html
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await publishHome()
  console.log('Portada publicada desde public/experimental; rutas prerender conservadas.')
}
