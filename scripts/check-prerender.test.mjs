import test from 'node:test'
import assert from 'node:assert/strict'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { publishHome } from './publish-home.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const checker = path.join(root, 'scripts/check-prerender.mjs')
const legacyRoutes = ['en/index.html', ...['atalaya','savemymoneynow','strev','sereno'].flatMap(slug=>[`proyectos/${slug}/index.html`,`en/projects/${slug}/index.html`])]
const run = fixture => spawnSync(process.execPath,[checker,fixture],{encoding:'utf8'})

// Integration fixture reuses the already-built React pages, just as the CI gate does.
// It publishes the static home with the real publisher and never edits the real build.
async function fixtureForBuild() {
  const fixture = await mkdtemp(path.join(os.tmpdir(),'portfolio-prerender-'))
  const copy = async (from, to) => { await mkdir(path.dirname(to),{recursive:true}); await copyFile(from,to) }
  for (const route of [...legacyRoutes,'404.html','sitemap.xml']) await copy(path.join(root,'build',route),path.join(fixture,'build',route))
  for (const file of ['index.html','experimental/index.html','og-image.svg','favicon.svg','og-image.png','apple-touch-icon.png','editorial/assets/cv-es.pdf']) await copy(path.join(root,'public',file),path.join(fixture,'public',file))
  for (const file of ['og-image.png','apple-touch-icon.png']) await copy(path.join(root,'public',file),path.join(fixture,'build',file))
  for (const language of ['es','en']) {
    await copy(path.join(root,`src/i18n/locales/${language}/translation.json`),path.join(fixture,`src/i18n/locales/${language}/translation.json`))
    await copy(path.join(root,`src/assets/cv-${language}.pdf`),path.join(fixture,`src/assets/cv-${language}.pdf`))
    await copy(path.join(root,`build/Alex_Mico_Robles_CV_${language.toUpperCase()}.pdf`),path.join(fixture,`build/Alex_Mico_Robles_CV_${language.toUpperCase()}.pdf`))
  }
  const html = await publishHome(fixture)
  const copied = new Set()
  async function resource(url, base='https://portfolioalex-mico.vercel.app/') {
    if (/^(?:#|data:|https?:|mailto:|tel:)/.test(url)) return
    const pathname = new URL(url,base).pathname
    if (copied.has(pathname)) return
    copied.add(pathname)
    if (pathname.startsWith('/proyectos/') && pathname.endsWith('/')) {
      // Case links now leave the home; their files are the React build copied above.
      await readFile(path.join(fixture,'build',pathname,'index.html'))
      return
    }
    await copy(path.join(root,'public',pathname),path.join(fixture,'build',pathname))
    if (pathname.endsWith('.css')) {
      const css=await readFile(path.join(root,'public',pathname),'utf8')
      for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) await resource(match[1],`https://portfolioalex-mico.vercel.app${pathname}`)
    }
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) await resource(match[1])
  return fixture
}

test('static root is validated, missing home contracts fail, and English/case React guards remain active',async t=>{
  const fixture=await fixtureForBuild()
  try {
    const baseline=run(fixture)
    assert.equal(baseline.status,0,baseline.stderr||baseline.stdout)
    async function broken(name,route,change,expected) {
      await t.test(name,async()=>{
        const file=path.join(fixture,'build',route),previous=await readFile(file)
        try {
          await writeFile(file,change(previous.toString()))
          const result=run(fixture)
          assert.equal(result.status,1,result.stderr||result.stdout)
          assert.match(result.stderr,expected)
          assert.doesNotMatch(result.stderr,/TypeError/,'A broken page must report a guard failure instead of crashing the checker')
        } finally { await writeFile(file,previous) }
      })
    }
    await broken('root without its heading fails','index.html',html=>html.replace('<h1 ','<div ').replace('</h1>','</div>'),/h1 unico de Alex/)
    await broken('root without required navigation fails','index.html',html=>html.replaceAll('href="#sobre-mi"','href="https://example.invalid/sobre"'),/falta seccion o enlace #sobre-mi/)
    await broken('root without a project block fails','index.html',html=>html.replace('id="marky"','id="marky-old"'),/falta el bloque del proyecto #marky/)
    await t.test('root without its published controller fails',async()=>{
      const file=path.join(fixture,'build/experimental/character-rig.js'),previous=await readFile(file)
      try {
        await rm(file)
        const result=run(fixture)
        assert.equal(result.status,1)
        assert.match(result.stderr,/recurso publicado ausente: \/experimental\/character-rig\.js/)
      } finally { await writeFile(file,previous) }
    })
    await broken('English still requires a populated React root','en/index.html',html=>html.replace('<div id="root">','<div id="broken-root">'),/#root casi vacio/)
    await broken('cases still require the original evidence asset','proyectos/strev/index.html',html=>html.replaceAll('strev-product','missing-evidence'),/figura no usa el asset real esperado/)
  } finally { await rm(fixture,{recursive:true,force:true}) }
})
