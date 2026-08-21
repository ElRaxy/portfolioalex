import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const GRID_COLUMNS = 24
const GRID_ROWS = 14
const GRID_DOT_COUNT = GRID_COLUMNS * GRID_ROWS
const POINTER_THROTTLE_MS = 400

const HeroGrid = () => {
  const gridRef = useRef(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const renderQuery = window.matchMedia(
      '(min-width: 1025px) and (prefers-reduced-motion: no-preference)',
    )
    const updateShouldRender = () => setShouldRender(renderQuery.matches)

    updateShouldRender()
    renderQuery.addEventListener('change', updateShouldRender)

    return () => renderQuery.removeEventListener('change', updateShouldRender)
  }, [])

  useLayoutEffect(() => {
    if (!shouldRender || !gridRef.current) return undefined

    const grid = gridRef.current
    const pointerTarget = grid.closest('.site-shell__sidebar') ?? grid.parentElement
    const ctx = gsap.context(() => {
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
              grid: [GRID_ROWS, GRID_COLUMNS],
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
            GRID_COLUMNS - 1,
            Math.max(0, Math.floor(((event.clientX - left) / width) * GRID_COLUMNS)),
          )
          const row = Math.min(
            GRID_ROWS - 1,
            Math.max(0, Math.floor(((event.clientY - top) / height) * GRID_ROWS)),
          )

          lastPointerLaunch = now
          launchWave([row, column])
        }

        const handleVisibilityChange = () => {
          if (document.hidden) {
            activeWave?.pause()
          } else {
            activeWave?.play()
          }
        }

        launchWave('center')
        document.addEventListener('visibilitychange', handleVisibilityChange)

        const isTouchDevice = window.matchMedia('(hover: none)').matches
        if (!isTouchDevice) {
          pointerTarget?.addEventListener('pointermove', handlePointerMove, { passive: true })
        }

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          pointerTarget?.removeEventListener('pointermove', handlePointerMove)
          activeWave?.kill()
        }
      })

      return () => media.revert()
    }, grid)

    return () => ctx.revert()
  }, [shouldRender])

  if (!shouldRender) return null

  return (
    <div className="hero-grid" aria-hidden="true" ref={gridRef}>
      {Array.from({ length: GRID_DOT_COUNT }, (_, index) => (
        <span className="hero-grid__dot" key={index} />
      ))}
    </div>
  )
}

export default HeroGrid
