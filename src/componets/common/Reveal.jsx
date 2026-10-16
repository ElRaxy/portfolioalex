import React, { useEffect, useRef } from 'react'

// Visible HTML is the default. The observer adds a one-shot entrance after
// hydration, so reduced motion or unavailable APIs never leave content hidden.
const Reveal = ({ as = 'div', delay = 0, group = false, children, ...props }) => {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!node || !node.animate || !('IntersectionObserver' in window) || preference.matches) return undefined

    const animations = []
    let entered = false
    const observer = new IntersectionObserver((entries) => {
      if (entered || !entries.some((entry) => entry.isIntersecting)) return
      entered = true
      observer.disconnect()
      const targets = group ? [...node.querySelectorAll('[data-reveal-item]')] : [node]
      targets.forEach((target, index) => {
        animations.push(target.animate([
          { opacity: 0.65, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], {
          duration: 400,
          delay: Math.min(Math.max(delay, 0) * 1000 + index * 45, 180),
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'backwards',
        }))
      })
    }, { threshold: 0.08 })
    const stop = () => {
      observer.disconnect()
      animations.forEach((animation) => animation.cancel())
    }
    const onPreferenceChange = () => { if (preference.matches) stop() }
    observer.observe(node)
    preference.addEventListener('change', onPreferenceChange)
    return () => {
      stop()
      preference.removeEventListener('change', onPreferenceChange)
    }
  }, [delay, group])

  return React.createElement(as, { ...props, ref }, children)
}

export const RevealGroup = (props) => <Reveal {...props} group />
export const RevealItem = ({ as = 'div', children, ...props }) => React.createElement(
  as, { ...props, 'data-reveal-item': '' }, children,
)
export default Reveal
