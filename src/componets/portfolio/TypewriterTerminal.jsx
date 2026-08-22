import React, { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import Reveal from '../common/Reveal'

// Copia abreviada de la salida real de `bhound --help`. Las descripciones son
// las del CLI, recortadas para que quepan en la tarjeta; el CLI hablaba
// castellano hasta el 2026-08-22 y esto se veia en ingles a medias.
const ATALAYA_HELP_OUTPUT = `$ bhound --help

 Usage: bhound [OPTIONS] COMMAND [ARGS]...

 Atalaya - your lookout for remote dev jobs.

 Commands:
   search        Scrape a job board, score and store
   list          List stored offers by score
   letter        Draft a tailored cover letter
   cv            Draft a tailored CV variant
   apply-batch   Apply to the top N offers
   ingest-email  Ingest offers from email alerts
   export        Export to CSV or JSON`

const ATALAYA_HELP_LINES = ATALAYA_HELP_OUTPUT.split('\n')

const renderTerminalLine = (line) => {
  if (line === '$ bhound --help') {
    return (
      <>
        <span className="portfolio__terminal-accent">$</span>
        {' '}
        <span className="portfolio__terminal-accent">bhound --help</span>
      </>
    )
  }

  const commandLine = line.match(/^( {3})([a-z-]+)( +)(.*)$/)

  if (commandLine) {
    return (
      <>
        {commandLine[1]}
        <span className="portfolio__terminal-command">{commandLine[2]}</span>
        {commandLine[3]}
        <span>{commandLine[4]}</span>
      </>
    )
  }

  return line
}

const TypewriterTerminal = () => {
  const shouldReduceMotion = useReducedMotion()
  const bodyRef = useRef(null)
  const hasStartedRef = useRef(false)
  const [visibleLineCount, setVisibleLineCount] = useState(
    shouldReduceMotion ? ATALAYA_HELP_LINES.length : 0,
  )

  useEffect(() => {
    if (shouldReduceMotion) {
      hasStartedRef.current = true
      setVisibleLineCount(ATALAYA_HELP_LINES.length)
      return undefined
    }

    const terminalBody = bodyRef.current
    if (!terminalBody || hasStartedRef.current) return undefined

    let intervalId

    const startTyping = () => {
      if (hasStartedRef.current) return

      hasStartedRef.current = true
      let nextLineCount = 1
      setVisibleLineCount(nextLineCount)

      if (ATALAYA_HELP_LINES.length <= 1) return

      intervalId = window.setInterval(() => {
        nextLineCount += 1
        setVisibleLineCount(nextLineCount)

        if (nextLineCount >= ATALAYA_HELP_LINES.length) {
          window.clearInterval(intervalId)
        }
      }, 90)
    }

    if (!('IntersectionObserver' in window)) {
      startTyping()
      return () => window.clearInterval(intervalId)
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return

      observer.disconnect()
      startTyping()
    }, { threshold: 0.3 })

    observer.observe(terminalBody)

    return () => {
      observer.disconnect()
      window.clearInterval(intervalId)
    }
  }, [shouldReduceMotion])

  return (
    <Reveal
      className="portfolio__terminal"
      aria-hidden="true"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="portfolio__terminal-bar">bhound --help</div>
      <div className="portfolio__terminal-body" ref={bodyRef}>
        {ATALAYA_HELP_LINES.map((line, lineIndex) => {
          const isVisible = lineIndex < visibleLineCount
          const hasCursor = isVisible
            && lineIndex === visibleLineCount - 1
            && visibleLineCount < ATALAYA_HELP_LINES.length

          return (
            <span
              className={`portfolio__terminal-line${isVisible ? ' is-visible' : ''}`}
              key={`${lineIndex}-${line}`}
            >
              {line ? renderTerminalLine(line) : '\u00a0'}
              {hasCursor && <span className="portfolio__terminal-cursor">▋</span>}
            </span>
          )
        })}
      </div>
    </Reveal>
  )
}

export default TypewriterTerminal
