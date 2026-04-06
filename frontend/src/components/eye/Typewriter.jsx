import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function Typewriter({ text, speed = 32 }) {
  const [displayed, setDisplayed] = useState('')
  const [fading, setFading] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setFading(false)
    indexRef.current = 0
    if (!text) return

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
        setTimeout(() => setFading(true), 2800)
      }
    }, 1000 / speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <motion.span
      animate={fading
        ? {
            opacity: [1, 0.9, 1, 0.65, 0.8, 0.35, 0.5, 0.15, 0],
            filter: ['blur(0px)', 'blur(0px)', 'blur(0.5px)', 'blur(1px)', 'blur(1.5px)', 'blur(2px)', 'blur(3px)', 'blur(4px)', 'blur(6px)'],
          }
        : { opacity: 1, filter: 'blur(0px)' }
      }
      transition={fading ? { duration: 2.0, ease: 'easeIn' } : {}}
      style={{
        fontFamily: "'Syne Mono', monospace",
        fontWeight: 400,
        fontSize: '1.4rem',
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.82)',
        lineHeight: 1.7,
        display: 'inline-block',
      }}
    >
      {displayed}
      {!fading && (
        <span style={{
          display: 'inline-block',
          width: '1px',
          height: '0.85em',
          background: 'rgba(255,255,255,0.7)',
          marginLeft: '2px',
          verticalAlign: 'middle',
          animation: 'blink 1s step-end infinite',
        }} />
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </motion.span>
  )
}
