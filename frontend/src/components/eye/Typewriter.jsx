import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const MotionSpan = motion.span

export default function Typewriter({ text, speed = 32 }) {
  const [displayed, setDisplayed] = useState('')
  const [fading, setFading] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    let interval
    let fadeTimeout

    const resetTimeout = window.setTimeout(() => {
      setDisplayed('')
      setFading(false)
      indexRef.current = 0

      if (!text) return

      interval = window.setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayed(text.slice(0, indexRef.current + 1))
          indexRef.current += 1
        } else {
          window.clearInterval(interval)
          fadeTimeout = window.setTimeout(() => setFading(true), 2800)
        }
      }, 1000 / speed)
    }, 0)

    return () => {
      window.clearTimeout(resetTimeout)
      window.clearTimeout(fadeTimeout)
      window.clearInterval(interval)
    }
  }, [text, speed])

  return (
    <MotionSpan
      animate={fading
        ? {
            opacity: [1, 0.9, 1, 0.65, 0.8, 0.35, 0.5, 0.15, 0],
            filter: ['blur(0px)', 'blur(0px)', 'blur(0.5px)', 'blur(1px)', 'blur(1.5px)', 'blur(2px)', 'blur(3px)', 'blur(4px)', 'blur(6px)'],
          }
        : { opacity: 1, filter: 'blur(0px)' }}
      transition={fading ? { duration: 2.0, ease: 'easeIn' } : {}}
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 400,
        fontSize: 'clamp(0.76rem, 1.02vw, 0.98rem)',
        letterSpacing: '0.035em',
        color: 'rgba(255,255,255,0.82)',
        lineHeight: 1.55,
        display: 'inline-block',
      }}
    >
      {displayed}
      {!fading && (
        <span className="rime-type-caret" />
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} } .rime-type-caret{display:inline-block;width:1px;height:.85em;background:rgba(255,255,255,.7);margin-left:2px;vertical-align:middle;animation:blink 1s step-end infinite}`}</style>
    </MotionSpan>
  )
}
