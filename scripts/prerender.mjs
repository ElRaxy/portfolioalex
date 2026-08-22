/* eslint-env node */
import { build as bundle } from 'esbuild'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { renderToString } from 'react-dom/server'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const buildDirectory = path.join(projectRoot, 'build')
const baseUrl = 'https://portfolioalex-mico.vercel.app'
// Mismo orden que en src/lib/routing.js. Si divergen, el test lo canta.
const CASE_SLUGS = ['wordpress', 'savemymoneynow', 'atalaya', 'strev']
const buildDate = new Date().toISOString().slice(0, 10)

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

// El grafo es unico para los dos idiomas: la Person y los proyectos no cambian.
// Lo que si es de cada pagina es el nodo ProfilePage, que apunta a su canonical
// y declara su idioma.
// En una pagina de caso, la entidad principal es el proyecto, no la persona:
// declararla como ProfilePage haria que cuatro URLs distintas dijeran ser el
// perfil de Alex.
const CASE_ENTITY_IDS = {
  atalaya: '#atalaya',
  savemymoneynow: '#savemymoneynow',
  strev: '#strev',
}

const setStructuredDataUrl = (html, url, language, slug, metadata) => replaceTag(
  html,
  /<script\b[^>]*\btype="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/i,
  (tag) => {
    const jsonText = tag.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
    const structuredData = JSON.parse(jsonText)
    const profilePage = structuredData['@graph']?.find((node) => node['@type'] === 'ProfilePage')

    if (!profilePage) throw new Error('The JSON-LD graph has no ProfilePage node')

    profilePage.url = url
    profilePage['@id'] = `${url}#page`
    profilePage.inLanguage = language
    // El nodo se copia del HTML base, que es la portada castellana: sin esto,
    // las 9 paginas restantes decian llamarse "Alex Mico Robles | Full Stack
    // Developer" y las inglesas lo decian en castellano.
    profilePage.name = metadata.name
    profilePage.description = metadata.description

    if (slug) {
      profilePage['@type'] = 'WebPage'
      profilePage.mainEntity = CASE_ENTITY_IDS[slug]
        ? { '@id': `${baseUrl}/${CASE_ENTITY_IDS[slug]}` }
        : undefined
      profilePage.about = { '@id': `${baseUrl}/#alex` }
    }

    return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`
  },
  'the JSON-LD graph',
)

const addAlternates = (html, spanishUrl, englishUrl) => {
  const withoutAlternates = html.replace(
    /<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang="[^"]+")[^>]*>/gi,
    '',
  )
  const canonical = withoutAlternates.match(/<link\b[^>]*\brel="canonical"[^>]*>/i)?.[0]
  if (!canonical) throw new Error('Could not find the canonical link for hreflang injection')

  const alternates = [
    `<link rel="alternate" hreflang="es" href="${spanishUrl}">`,
    `<link rel="alternate" hreflang="en" href="${englishUrl}">`,
    `<link rel="alternate" hreflang="x-default" href="${spanishUrl}">`,
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

// Una clave que no existe se interpola como "undefined" y sale publicada sin
// que nada falle: asi estuvo la meta description inglesa hasta el 2026-08-22.
// Leer siempre por aqui.
const requireText = (value, keyPath) => {
  if (typeof value !== 'string' || !value.trim() || value.includes('undefined')) {
    throw new Error(`Translation key "${keyPath}" is missing or empty`)
  }
  return value
}

// Segunda red, sobre el HTML ya compuesto: si una interpolacion futura se
// escapa de requireText, el build cae aqui en vez de publicarse.
const assertNoUndefinedInHead = (html, language) => {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
  const offending = [...head.matchAll(/<(?:title|meta|link)\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => tag.includes('undefined'))

  if (offending.length) {
    throw new Error(`"undefined" in the ${language} head: ${offending.join(' ')}`)
  }
}


// El HTML de un caso tiene que traer su contenido de verdad: si el enrutado se
// rompe, el prerender escribiria la portada bajo la URL del caso y nadie se
// enteraria hasta verlo indexado.
const assertRenderedContent = (html, page) => {
  const body = html.match(/<div id="root">([\s\S]*)<\/div>/i)?.[1] ?? ''
  const hasCase = body.includes('class="case"')

  if (page.slug && !hasCase) throw new Error(`${page.pathname} rendered without the case study`)
  if (!page.slug && hasCase) throw new Error(`${page.pathname} rendered a case study by mistake`)
}

const buildSitemap = (pages) => {
  const entries = pages.map((page) => [
    '  <url>',
    `    <loc>${page.canonicalUrl}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="es" href="${page.spanishUrl}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${page.englishUrl}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${page.spanishUrl}" />`,
    `    <lastmod>${buildDate}</lastmod>`,
    '    <changefreq>monthly</changefreq>',
    `    <priority>${page.slug ? '0.8' : (page.language === 'es' ? '1.0' : '0.9')}</priority>`,
    '  </url>',
  ].join('\n')).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    entries,
    '</urlset>',
    '',
  ].join('\n')
}

const localizeHead = (baseHtml, page, translation, baseMetadata) => {
  const { language, canonicalUrl, slug } = page
  const isEnglish = language === 'en'
  const study = slug ? translation.case_study?.cases?.[slug] : null

  if (slug && !study) throw new Error(`No case study content for "${slug}" in ${language}`)

  const homeTitle = isEnglish
    ? `${requireText(translation.header.name, 'header.name')} | ${requireText(translation.header.title, 'header.title')}`
    : baseMetadata.title
  const homeDescription = isEnglish
    ? requireText(translation.meta?.description, 'meta.description')
    : baseMetadata.description

  const title = study
    ? `${requireText(study.title, `case_study.cases.${slug}.title`)} · ${requireText(translation.header.name, 'header.name')}`
    : homeTitle
  const description = study
    ? requireText(study.summary, `case_study.cases.${slug}.summary`)
    : homeDescription
  const socialTitle = study ? title : (isEnglish ? homeTitle : baseMetadata.socialTitle)
  const socialDescription = study
    ? requireText(study.tagline, `case_study.cases.${slug}.tagline`)
    : (isEnglish ? translation.header.tagline : baseMetadata.socialDescription)

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
  html = addAlternates(html, page.spanishUrl, page.englishUrl)
  return setStructuredDataUrl(html, canonicalUrl, language, slug, { name: title, description })
}

const manifest = JSON.parse(await readFile(
  path.join(buildDirectory, 'asset-manifest.json'),
  'utf8',
))
// Un PDF por idioma. El plugin de esbuild de abajo resolvia CUALQUIER .pdf a la
// misma URL, asi que las paginas en ingles se prerenderizaban con el CV castellano.
const cvAssetUrls = Object.fromEntries(['cv-es.pdf', 'cv-en.pdf'].map((file) => {
  const url = manifest.files[`static/media/${file}`]
  if (!url?.startsWith('/')) {
    throw new Error(`The CRA asset URL for ${file} is missing or is not absolute`)
  }
  return [file, url]
}))

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
          build.onResolve({ filter: /\.pdf$/ }, (args) => ({
            path: path.basename(args.path),
            namespace: 'built-assets',
          }))
          build.onLoad({ filter: /.*/, namespace: 'built-assets' }, (args) => {
            const url = cvAssetUrls[args.path]
            if (!url) throw new Error(`No built asset for ${args.path}`)
            return { contents: `export default ${JSON.stringify(url)}`, loader: 'js' }
          })
        },
      },
    ],
  })

  const { createPrerenderApp } = await import(pathToFileURL(serverBundle).href)
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
  const translations = { es: spanishTranslation, en: englishTranslation }

  // Una entrada por HTML a escribir: las dos portadas y un caso por proyecto e
  // idioma. `spanishUrl`/`englishUrl` son las dos caras de la MISMA pagina, que
  // es lo que el hreflang tiene que emparejar: la portada inglesa no es la
  // alternativa del caso de Atalaya.
  const pages = [
    {
      language: 'es',
      slug: null,
      pathname: '/',
      output: 'index.html',
      spanishUrl: `${baseUrl}/`,
      englishUrl: `${baseUrl}/en/`,
    },
    {
      language: 'en',
      slug: null,
      pathname: '/en/',
      output: 'en/index.html',
      spanishUrl: `${baseUrl}/`,
      englishUrl: `${baseUrl}/en/`,
    },
    ...CASE_SLUGS.flatMap((slug) => ([
      {
        language: 'es',
        slug,
        pathname: `/proyectos/${slug}/`,
        output: `proyectos/${slug}/index.html`,
        spanishUrl: `${baseUrl}/proyectos/${slug}/`,
        englishUrl: `${baseUrl}/en/projects/${slug}/`,
      },
      {
        language: 'en',
        slug,
        pathname: `/en/projects/${slug}/`,
        output: `en/projects/${slug}/index.html`,
        spanishUrl: `${baseUrl}/proyectos/${slug}/`,
        englishUrl: `${baseUrl}/en/projects/${slug}/`,
      },
    ])),
  ].map((page) => ({
    ...page,
    canonicalUrl: page.language === 'en' ? page.englishUrl : page.spanishUrl,
  }))

  for (const page of pages) {
    const markup = renderToString(createPrerenderApp(page.language, page.pathname))
    const html = injectMarkup(
      localizeHead(baseHtml, page, translations[page.language], baseMetadata),
      markup,
    )
    const label = `${page.language} ${page.pathname}`

    assertAbsoluteAssetPaths(html, label)
    assertNoUndefinedInHead(html, label)
    assertRenderedContent(html, page)

    const output = path.join(buildDirectory, page.output)
    await mkdir(path.dirname(output), { recursive: true })
    await writeFile(output, html)
  }

  await writeFile(
    path.join(buildDirectory, 'sitemap.xml'),
    buildSitemap(pages),
  )
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
