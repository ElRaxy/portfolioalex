import React from 'react'

const BASE_URL = 'https://portfolioalex-mico.vercel.app'

// El `scroll-behavior: smooth` nativo de Chrome, medido sobre esta web, recorre
// 1.472 px en 256 ms y luego se arrastra: los ultimos 200 px de un viaje de
// 3.545 px se comen 400 ms de los 1.050 totales. Se siente como un latigazo.
// Esto le pone una curva simetrica y una duracion proporcional a la distancia.

const EASE_IN_OUT_CUBIC = (t) => (t < 0.5
  ? 4 * t * t * t
  : 1 - ((-2 * t + 2) ** 3) / 2)

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// El offset de la barra fija ya esta declarado como scroll-padding-top; leerlo
// evita tener el mismo numero escrito en dos sitios.
const getScrollPadding = () => {
  const value = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  return Number.isFinite(value) ? value : 0
}

const getTargetOffset = (target) => {
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop)
  return Number.isFinite(margin) && margin > 0 ? margin : getScrollPadding()
}

const getDuration = (distance) => Math.min(900, Math.max(420, Math.abs(distance) * 0.32))

const updateMeta = (selector, value, attribute = 'content') => {
  const element = document.querySelector(selector)
  if (element) element.setAttribute(attribute, value)
}

export const syncDocument = (language, i18n, pathname = window.location.pathname) => {
  const t = i18n.getFixedT(language)
  const url = new URL(pathname, BASE_URL).href
  const title = `${t('header.name')} | ${t('header.title')}`
  const description = t('meta.description')

  document.documentElement.lang = language
  document.title = title
  updateMeta('link[rel="canonical"]', url, 'href')
  updateMeta('meta[name="description"]', description)
  updateMeta('meta[property="og:title"]', title)
  updateMeta('meta[property="og:description"]', description)
  updateMeta('meta[property="og:url"]', url)
  updateMeta('meta[property="og:locale"]', language === 'en' ? 'en_US' : 'es_ES')
  updateMeta('meta[name="twitter:title"]', title)
  updateMeta('meta[name="twitter:description"]', description)

  try {
    window.localStorage.setItem('language', language)
  } catch {
    /* la URL y el documento siguen sincronizados aunque no haya storage */
  }
}

const LANGUAGE_TRANSITION_MS = 190

export const runLanguageTransition = async (update) => {
  const root = document.documentElement
  if (
    root.hasAttribute('data-view-transition')
    || root.hasAttribute('data-language-transition')
  ) return false

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const scrollYBeforeUpdate = window.scrollY
  const restoreScroll = () => window.scrollTo(0, scrollYBeforeUpdate)
  root.setAttribute('data-language-transition', 'updating')
  try {
    await update()
    restoreScroll()
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restoreScroll)
    })
  } catch (error) {
    root.removeAttribute('data-language-transition')
    throw error
  }

  if (reducedMotion) root.removeAttribute('data-language-transition')
  else {
    root.setAttribute('data-language-transition', 'settling')
    window.setTimeout(() => {
      // Las traducciones cambian la altura del relato sticky después de los
      // primeros frames. Conservamos overflow-anchor:none durante la primera
      // corrección y reponemos la posición también después de reactivarlo.
      restoreScroll()
      window.requestAnimationFrame(() => {
        root.removeAttribute('data-language-transition')
        restoreScroll()
        window.requestAnimationFrame(restoreScroll)
      })
    }, LANGUAGE_TRANSITION_MS)
  }
  return true
}

export const scrollToSection = (id) => {
  const target = document.getElementById(id)
  if (!target) return false

  const from = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const to = Math.min(max, Math.max(0, from + target.getBoundingClientRect().top - getTargetOffset(target)))
  const distance = to - from

  if (prefersReducedMotion() || Math.abs(distance) < 2) {
    window.scrollTo(0, to)
    return true
  }

  const duration = getDuration(distance)
  const start = performance.now()
  let cancelled = false

  // Si el usuario toca la rueda o la pantalla, manda el: seguir moviendo la
  // pagina por debajo de su dedo es lo que hace que un scroll se sienta preso.
  const cancel = () => { cancelled = true }
  const events = ['wheel', 'touchstart', 'keydown']
  events.forEach((event) => window.addEventListener(event, cancel, { passive: true, once: true }))

  const step = (now) => {
    if (cancelled) {
      events.forEach((event) => window.removeEventListener(event, cancel))
      return
    }
    const progress = Math.min(1, (now - start) / duration)
    window.scrollTo(0, from + distance * EASE_IN_OUT_CUBIC(progress))
    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      events.forEach((event) => window.removeEventListener(event, cancel))
    }
  }

  requestAnimationFrame(step)
  return true
}

export const useSmoothAnchors = () => {
  React.useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = event.target.closest('a[href^="#"]')
      if (!link) return

      const id = decodeURIComponent(link.getAttribute('href').slice(1))
      if (!id) return

      if (scrollToSection(id)) {
        event.preventDefault()
        document.querySelectorAll('[data-anchor-target]').forEach((target) => {
          target.removeAttribute('data-anchor-target')
        })
        document.getElementById(id)?.setAttribute('data-anchor-target', '')
        // El hash se escribe sin provocar el salto que haria location.hash.
        window.history.pushState(null, '', `#${id}`)
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

// Con el idioma cambiando por pushState, el boton atras devuelve la URL a `/`
// pero el contenido se quedaba en ingles. Esto los vuelve a atar.
export const useLanguageFromHistory = (i18n) => {
  React.useEffect(() => {
    const onPopState = () => {
      const language = /^\/en(?:\/|$)/.test(window.location.pathname) ? 'en' : 'es'
      if (i18n.resolvedLanguage !== language) {
        i18n.changeLanguage(language).then(() => {
          syncDocument(language, i18n)
        })
      } else {
        syncDocument(language, i18n)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [i18n])
}
