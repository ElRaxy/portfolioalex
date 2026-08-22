import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

const DESKTOP_GRID = { columns: 24, rows: 14 }
const TABLET_GRID = { columns: 16, rows: 10 }
const POINTER_THROTTLE_MS = 400

const HeroGrid = () => {
  const gridRef = useRef(null)
  const [gridLayout, setGridLayout] = useState(null)

  useEffect(() => {
    const desktopQuery = window.matchMedia(
      '(min-width: 1025px) and (prefers-reduced-motion: no-preference)',
    )
    const tabletQuery = window.matchMedia(
      '(min-width: 768px) and (max-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    const updateGridLayout = () => {
      if (desktopQuery.matches) {
        setGridLayout(DESKTOP_GRID)
      } else if (tabletQuery.matches) {
        setGridLayout(TABLET_GRID)
      } else {
        setGridLayout(null)
      }
    }

    updateGridLayout()
    desktopQuery.addEventListener('change', updateGridLayout)
    tabletQuery.addEventListener('change', updateGridLayout)

    return () => {
      desktopQuery.removeEventListener('change', updateGridLayout)
      tabletQuery.removeEventListener('change', updateGridLayout)
    }
  }, [])

  useLayoutEffect(() => {
    if (
      !gridLayout
      || !gridRef.current
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return undefined

    const grid = gridRef.current
    const { columns, rows } = gridLayout
    const pointerTarget = grid.closest('.site-shell__sidebar') ?? grid.parentElement
    let ctx
    let cancelled = false

    import('gsap').then(({ gsap }) => {
      if (cancelled) return

      ctx = gsap.context(() => {
        const media = gsap.matchMedia()

        media.add('(prefers-reduced-motion: no-preference)', () => {
          const dots = gsap.utils.toArray('.hero-grid__dot', grid)
          let activeWave
          let lastPointerLaunch = Number.NEGATIVE_INFINITY

          const launchWave = (from) => {
            activeWave?.kill()
            gsap.set(dots, { clearProps: 'opacity,transform' })
            activeWave = gsap.to(dots, {
              opacity: 0.3,
              scale: 1.45,
              duration: 0.8,
              ease: 'sine.inOut',
              stagger: {
                grid: [rows, columns],
                from,
                amount: 1.6,
              },
              repeat: -1,
              repeatDelay: 1.4,
              yoyo: true,
            })

            if (document.hidden) activeWave.pause()
          }

          const handlePointerMove = (event) => {
            const now = performance.now()

            if (now - lastPointerLaunch < POINTER_THROTTLE_MS) return

            const { left, top, width, height } = grid.getBoundingClientRect()
            if (!width || !height) return

            const column = Math.min(
              columns - 1,
              Math.max(0, Math.floor(((event.clientX - left) / width) * columns)),
            )
            const row = Math.min(
              rows - 1,
              Math.max(0, Math.floor(((event.clientY - top) / height) * rows)),
            )

            lastPointerLaunch = now
            launchWave([row, column])
          }

          // `document.hidden` solo cubre la pestana de fondo. Con la pestana
          // delante y el hero fuera de pantalla, los 336 puntos seguian
          // animando a scrollY 3000 sin que nadie los viera.
          let enPantalla = true
          let pestanaVisible = !document.hidden

          const revisarReproduccion = () => {
            if (enPantalla && pestanaVisible) activeWave?.play()
            else activeWave?.pause()
          }

          const handleVisibilityChange = () => {
            pestanaVisible = !document.hidden
            revisarReproduccion()
          }

          launchWave('center')
          document.addEventListener('visibilitychange', handleVisibilityChange)

          let observador
          if ('IntersectionObserver' in window) {
            observador = new IntersectionObserver(([entrada]) => {
              enPantalla = entrada.isIntersecting
              revisarReproduccion()
            })
            observador.observe(grid)
          }

          const isTouchDevice = window.matchMedia('(hover: none)').matches
          if (!isTouchDevice) {
            pointerTarget?.addEventListener('pointermove', handlePointerMove, { passive: true })
          }

          return () => {
            observador?.disconnect()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            pointerTarget?.removeEventListener('pointermove', handlePointerMove)
            activeWave?.kill()
          }
        })

        return () => media.revert()
      }, grid)
    }).catch(() => undefined)

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [gridLayout])

  if (!gridLayout) return null

  const gridDotCount = gridLayout.columns * gridLayout.rows

  return (
    <div
      className="hero-grid"
      aria-hidden="true"
      ref={gridRef}
      style={{
        '--hero-grid-columns': gridLayout.columns,
        '--hero-grid-rows': gridLayout.rows,
      }}
    >
      {Array.from({ length: gridDotCount }, (_, index) => (
        <span className="hero-grid__dot" key={index} />
      ))}
    </div>
  )
}

export default HeroGrid
