import { useState, useEffect, useRef } from 'react'

export default function Typewriter({ text, speed = 28 }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    if (!text) return

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
      }
    }, 1000 / speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span style={{
      fontFamily: 'var(--font-interface)',
      fontWeight: 200,
      fontSize: '0.82rem',
      letterSpacing: '0.06em',
      color: 'rgba(255,255,255,0.82)',
      lineHeight: 1.7,
    }}>
      {displayed}
      <span style={{
        display: 'inline-block',
        width: '1px',
        height: '0.85em',
        background: 'rgba(255,255,255,0.7)',
        marginLeft: '2px',
        verticalAlign: 'middle',
        animation: 'blink 1s step-end infinite',
      }} />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  )
}
