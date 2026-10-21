import test from 'node:test'
import assert from 'node:assert/strict'
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { publishHome } from './publish-home.mjs'
import { JSDOM } from 'jsdom'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(path.join(root, 'public/experimental/index.html'), 'utf8')
const body = html => html.slice(html.indexOf('<body'))
const references = html => [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1])

function assertSequencePaths(html) {
  const document = new JSDOM(html).window.document
  const frames = [...document.querySelectorAll('#contacto [data-secuencia] img')]
  assert.equal(frames.length, 34)
  assert.equal(frames.filter(frame => frame.hasAttribute('data-src')).length, 32)
  for (const [index, frame] of frames.entries()) {
    const number = index === 9 || index === 11 ? 8 : index + 1
    const attribute = index === 0 || index === 33 ? 'src' : 'data-src'
    assert.equal(frame.getAttribute(attribute), `/experimental/assets/contacto/s${String(number).padStart(2, '0')}.svg`)
    assert.equal(frame.hasAttribute(attribute === 'src' ? 'data-src' : 'src'), false)
  }
}

test('publica el checkpoint en la raíz y conserva las demás páginas', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'portfolio-home-'))
  try {
    await mkdir(path.join(fixture, 'public/experimental'), { recursive: true })
    await mkdir(path.join(fixture, 'build'), { recursive: true })
    await copyFile(path.join(root, 'public/index.html'), path.join(fixture, 'public/index.html'))
    await writeFile(path.join(fixture, 'public/experimental/index.html'), source)
    const routes = ['en/index.html', 'proyectos/strev/index.html', 'en/projects/sereno/index.html', '404.html']
    for (const route of routes) {
      await mkdir(path.dirname(path.join(fixture, 'build', route)), { recursive: true })
      await writeFile(path.join(fixture, 'build', route), `preservar ${route}`)
    }

    const html = await publishHome(fixture)
    assert.equal(await readFile(path.join(fixture, 'build/index.html'), 'utf8'), html)
    assertSequencePaths(html)
    for (const route of routes) {
      assert.equal(await readFile(path.join(fixture, 'build', route), 'utf8'), `preservar ${route}`)
    }

    // Normalize only the deployment paths: every other byte in the body must survive.
    const restored = body(html)
      .replaceAll('="/experimental/', '="')
      .replaceAll('="/editorial/', '="../editorial/')
    assert.equal(restored, body(source))
    assert.doesNotMatch(html, /<base\b|hreflang=|\/static\/js\//)
    assert.match(html, /<link rel="canonical" href="https:\/\/portfolioalex-mico\.vercel\.app\/">/)
    assert.match(html, /property="og:url" content="https:\/\/portfolioalex-mico\.vercel\.app\/"/)
    assert.match(html, /name="twitter:card" content="summary_large_image"/)
    assert.match(html, /rel="icon"/)
    assert.match(html, /name="google-site-verification"/)
    assert.match(html, /property="og:description" content="Alex Micó, desarrollador full stack\./)

    const originalLinks = references(source)
    const deployedLinks = references(html)
    assert.deepEqual(deployedLinks.filter(url => url.startsWith('#')), originalLinks.filter(url => url.startsWith('#')))
    for (const href of deployedLinks.filter(url => url.startsWith('#'))) {
      assert.ok(html.includes(`id="${href.slice(1)}"`), `anchor ${href} exists`)
    }
    for (const href of deployedLinks) {
      if (/^(?:#|[a-z][a-z\d+.-]*:)/i.test(href)) continue
      assert.ok(href.startsWith('/'), `root-safe URL: ${href}`)
      const pathname=href.split(/[?#]/)[0]
      if (pathname.startsWith('/proyectos/') && pathname.endsWith('/')) {
        await access(path.join(root, 'build', pathname, 'index.html'))
      } else {
        await access(path.join(root, 'public', pathname))
      }
    }
    for (const href of deployedLinks.filter(url => /\.css(?:\?|$)/.test(url))) {
      const stylesheet = await readFile(path.join(root, 'public', href.split('?')[0]), 'utf8')
      for (const match of stylesheet.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
        if (/^(?:data:|https?:|#)/.test(match[1])) continue
        const resolved = new URL(match[1], `https://portfolioalex-mico.vercel.app${href}`)
        await access(path.join(root, 'public', resolved.pathname))
      }
    }
    assert.equal(await publishHome(fixture), html, 'publication is repeatable')
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
})

test('Secuencia AC9: el build real publica también los 32 data-src desde la raíz', async () => {
  const html = await readFile(path.join(root, 'build/index.html'), 'utf8')
  assertSequencePaths(html)
  const frames = new JSDOM(html).window.document.querySelectorAll('#contacto [data-secuencia] img')
  for (const frame of frames) {
    await access(path.join(root, 'build', frame.getAttribute('src') || frame.getAttribute('data-src')))
  }
})
