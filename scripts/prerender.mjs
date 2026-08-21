/* eslint-env node */
import { build as bundle } from 'esbuild'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { renderToString } from 'react-dom/server'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDirectory = path.join(projectRoot, 'build')
const baseUrl = 'https://portfolioalex-mico.vercel.app'

const escapeAttribute = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const escapeText = (value) => escapeAttribute(value).replace(/'/g, '&#39;')
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const replaceAttribute = (tag, attribute, value) => {
  const attributePattern = new RegExp(`\\b${attribute}="[^"]*"`, 'i')
  const nextAttribute = `${attribute}="${escapeAttribute(value)}"`

  if (attributePattern.test(tag)) return tag.replace(attributePattern, nextAttribute)
  return tag.replace(/>$/, ` ${nextAttribute}>`)
}

const replaceTag = (html, pattern, update, description) => {
  const match = html.match(pattern)
  if (!match) throw new Error(`Could not find ${description} in build/index.html`)
  return html.replace(match[0], update(match[0]))
}

const setMetaContent = (html, keyAttribute, key, value) => replaceTag(
  html,
  new RegExp(`<meta\\b[^>]*\\b${keyAttribute}="${escapeRegExp(key)}"[^>]*>`, 'i'),
  (tag) => replaceAttribute(tag, 'content', value),
  `${keyAttribute}="${key}"`,
)

const getMetaContent = (html, keyAttribute, key) => {
  const tag = html.match(
    new RegExp(`<meta\\b[^>]*\\b${keyAttribute}="${escapeRegExp(key)}"[^>]*>`, 'i'),
  )?.[0]
  const content = tag?.match(/\bcontent="([^"]*)"/i)?.[1]

  if (content === undefined) throw new Error(`Could not read ${keyAttribute}="${key}"`)
  return content
}

const getTitle = (html) => {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
  if (title === undefined) throw new Error('Could not read the document title')
  return title
}

const setCanonical = (html, url) => replaceTag(
  html,
  /<link\b[^>]*\brel="canonical"[^>]*>/i,
  (tag) => replaceAttribute(tag, 'href', url),
  'the canonical link',
)

const setStructuredDataUrl = (html, url) => replaceTag(
  html,
  /<script\b[^>]*\btype="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i,
  (tag) => {
    const jsonText = tag.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
    const structuredData = JSON.parse(jsonText)
    structuredData.url = url
    return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
  },
  'the Person JSON-LD block',
)

const addAlternates = (html) => {
  const withoutAlternates = html.replace(
    /<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang="[^"]+")[^>]*>/gi,
    '',
  )
  const canonical = withoutAlternates.match(/<link\b[^>]*\brel="canonical"[^>]*>/i)?.[0]
  if (!canonical) throw new Error('Could not find the canonical link for hreflang injection')

  const alternates = [
    `<link rel="alternate" hreflang="es" href="${baseUrl}/">`,
    `<link rel="alternate" hreflang="en" href="${baseUrl}/en/">`,
    `<link rel="alternate" hreflang="x-default" href="${baseUrl}/">`,
  ].join('')

  return withoutAlternates.replace(canonical, `${canonical}${alternates}`)
}

const injectMarkup = (html, markup) => {
  const rootPattern = /<div id="root"><\/div>/g
  const matches = html.match(rootPattern)
  if (matches?.length !== 1) throw new Error('Expected one empty #root in build/index.html')
  return html.replace(rootPattern, `<div id="root">${markup}</div>`)
}

const assertAbsoluteAssetPaths = (html, language) => {
  const resourceUrls = [...html.matchAll(
    /<(?:link|script)\b[^>]*(?:href|src)="([^"]+)"[^>]*>/gi,
  )].map((match) => match[1])
  const relativeUrls = resourceUrls.filter((url) => (
    !url.startsWith('/')
    && !url.startsWith('http://')
    && !url.startsWith('https://')
    && !url.startsWith('data:')
  ))

  if (relativeUrls.length) {
    throw new Error(`Relative asset URLs in ${language} HTML: ${relativeUrls.join(', ')}`)
  }
}

const localizeHead = (baseHtml, language, translation, baseMetadata) => {
  const canonicalUrl = language === 'en' ? `${baseUrl}/en/` : `${baseUrl}/`
  const isEnglish = language === 'en'
  const title = isEnglish
    ? `${translation.header.name} | ${translation.header.title}`
    : baseMetadata.title
  const description = isEnglish
    ? `${translation.header.tagline} ${translation.about.p1}`
    : baseMetadata.description
  const socialTitle = isEnglish ? title : baseMetadata.socialTitle
  const socialDescription = isEnglish
    ? translation.header.tagline
    : baseMetadata.socialDescription

  let html = replaceTag(
    baseHtml,
    /<html\b[^>]*>/i,
    (tag) => replaceAttribute(tag, 'lang', language),
    'the html element',
  )
  html = replaceTag(
    html,
    /<title>[\s\S]*?<\/title>/i,
    () => `<title>${escapeText(title)}</title>`,
    'the title',
  )
  html = setMetaContent(html, 'name', 'description', description)
  html = setMetaContent(html, 'property', 'og:title', socialTitle)
  html = setMetaContent(html, 'property', 'og:description', socialDescription)
  html = setMetaContent(html, 'property', 'og:url', canonicalUrl)
  html = setMetaContent(html, 'property', 'og:locale', isEnglish ? 'en_US' : 'es_ES')
  html = setMetaContent(html, 'name', 'twitter:title', socialTitle)
  html = setMetaContent(html, 'name', 'twitter:description', socialDescription)
  html = setCanonical(html, canonicalUrl)
  html = addAlternates(html)
  return setStructuredDataUrl(html, canonicalUrl)
}

const manifest = JSON.parse(await readFile(
  path.join(buildDirectory, 'asset-manifest.json'),
  'utf8',
))
const cvAssetUrl = manifest.files['static/media/cv.pdf']
if (!cvAssetUrl?.startsWith('/')) {
  throw new Error('The CRA CV asset URL is missing or is not absolute')
}

const temporaryDirectory = await mkdtemp(path.join(buildDirectory, '.prerender-'))
const serverBundle = path.join(temporaryDirectory, 'entry.mjs')

try {
  await bundle({
    entryPoints: [path.join(projectRoot, 'src/prerender/entry.jsx')],
    outfile: serverBundle,
    bundle: true,
    platform: 'node',
    format: 'esm',
    jsx: 'automatic',
    packages: 'external',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    plugins: [
      {
        name: 'empty-css',
        setup(build) {
          build.onResolve({ filter: /\.css$/ }, (args) => ({
            path: path.resolve(args.resolveDir, args.path),
            namespace: 'empty-css',
          }))
          build.onLoad({ filter: /.*/, namespace: 'empty-css' }, () => ({
            contents: 'export default {}',
            loader: 'js',
          }))
        },
      },
      {
        name: 'built-assets',
        setup(build) {
          build.onResolve({ filter: /\.pdf$/ }, () => ({
            path: 'cv.pdf',
            namespace: 'built-assets',
          }))
          build.onLoad({ filter: /.*/, namespace: 'built-assets' }, () => ({
            contents: `export default ${JSON.stringify(cvAssetUrl)}`,
            loader: 'js',
          }))
        },
      },
    ],
  })

  const { createPrerenderApp } = await import(pathToFileURL(serverBundle).href)
  const renderedMarkup = {
    es: renderToString(createPrerenderApp('es')),
    en: renderToString(createPrerenderApp('en')),
  }
  const baseHtml = await readFile(path.join(buildDirectory, 'index.html'), 'utf8')
  const englishTranslation = JSON.parse(await readFile(
    path.join(projectRoot, 'src/i18n/locales/en/translation.json'),
    'utf8',
  ))
  const spanishTranslation = JSON.parse(await readFile(
    path.join(projectRoot, 'src/i18n/locales/es/translation.json'),
    'utf8',
  ))
  const baseMetadata = {
    title: getTitle(baseHtml),
    description: getMetaContent(baseHtml, 'name', 'description'),
    socialTitle: getMetaContent(baseHtml, 'property', 'og:title'),
    socialDescription: getMetaContent(baseHtml, 'property', 'og:description'),
  }
  const localizedHtml = {
    es: injectMarkup(
      localizeHead(baseHtml, 'es', spanishTranslation, baseMetadata),
      renderedMarkup.es,
    ),
    en: injectMarkup(
      localizeHead(baseHtml, 'en', englishTranslation, baseMetadata),
      renderedMarkup.en,
    ),
  }

  assertAbsoluteAssetPaths(localizedHtml.es, 'es')
  assertAbsoluteAssetPaths(localizedHtml.en, 'en')

  await mkdir(path.join(buildDirectory, 'en'), { recursive: true })
  await Promise.all([
    writeFile(path.join(buildDirectory, 'index.html'), localizedHtml.es),
    writeFile(path.join(buildDirectory, 'en/index.html'), localizedHtml.en),
  ])
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
