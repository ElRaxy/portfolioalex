// Las paginas de caso son estaticas y prerenderizadas, asi que no hay router:
// basta con leer el pathname una vez. Cada idioma tiene su prefijo propio
// porque la URL es lo que indexa Google, y /proyectos/ en ingles no dice nada.
export const CASE_SLUGS = ['wordpress', 'savemymoneynow', 'atalaya', 'strev']

const CASE_PREFIX = { es: '/proyectos/', en: '/en/projects/' }

export const caseHref = (language, slug) => `${CASE_PREFIX[language] || CASE_PREFIX.es}${slug}/`

export const homeHref = (language) => (language === 'en' ? '/en/' : '/')

export const parseRoute = (pathname = '/') => {
  const clean = pathname.endsWith('/') ? pathname : `${pathname}/`

  for (const language of ['es', 'en']) {
    if (!clean.startsWith(CASE_PREFIX[language])) continue

    const slug = clean.slice(CASE_PREFIX[language].length).replace(/\/$/, '')
    if (CASE_SLUGS.includes(slug)) return { kind: 'case', language, slug }
  }

  return { kind: 'home', language: /^\/en(?:\/|$)/.test(clean) ? 'en' : 'es', slug: null }
}
