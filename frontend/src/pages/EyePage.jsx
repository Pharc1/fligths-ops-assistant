import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Send } from 'lucide-react'
import TheEye from '../components/eye/TheEye'
import CitationWidget, { CITATION_MOCK } from '../components/widgets/CitationWidget'
import { useRimeStore } from '../store/useRimeStore'

const ease = [0.4, 0, 0.2, 1]

function HudCorner({ style, children }) {
  return (
    <div style={{
      position: 'absolute',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '0.12em',
      color: 'rgba(255,255,255,0.72)',
      zIndex: 20,
      ...style,
    }}>
      {children}
    </div>
  )
}


export default function EyePage() {
  const [input, setInput] = useState('')
  const [micHover, setMicHover] = useState(false)
  const [sendHover, setSendHover] = useState(false)
  const setRimeText  = useRimeStore((s) => s.setRimeText)
  const setThinking  = useRimeStore((s) => s.setThinking)
  const setWidget    = useRimeStore((s) => s.setWidget)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const question = input.trim()
    setInput('')

    // Mock : "affiche" → widget citation
    if (question.toLowerCase().includes('affiche')) {
      setWidget('citation', CITATION_MOCK)
      return
    }

    setThinking(true)
    setRimeText('Analyse en cours...')

    // TODO: remplacer par le vrai fetch SSE
    const mockTokens = `Analyse du vol AF447 en cours. Anomalie détectée sur le capteur Pitot — vitesse anémométrique incohérente à FL350. Corrélation avec les données météo : zone de convection active. Recommandation : activation du mode dégradé et recalibration des sondes.`
    let finalText = ''
    for (const char of mockTokens) {
      await new Promise((r) => setTimeout(r, 18))
      finalText += char
      setRimeText(finalText)
    }
    setThinking(false)
  }

  const iconColor = (hover) => hover ? '#00E5FF' : 'rgba(255,255,255,0.65)'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease }}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#f0ede8',
        overflow: 'hidden',
      }}
    >
      {/* HUD coins */}
      <HudCorner style={{ top: '1.5rem', left: '2rem' }}>
        SYS.RIME // v1.0.0 — [ONLINE]
      </HudCorner>
      <HudCorner style={{ top: '1.5rem', right: '2rem', textAlign: 'right' }}>
        AIRCRAFT: UNASSIGNED<br />
        <span id="hud-clock" style={{ opacity: 0.95 }}>{new Date().toLocaleTimeString('fr-FR')}</span>
      </HudCorner>

      {/* Équation du flux — watermark transitoire */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.09, 0.09, 0] }}
        transition={{ duration: 3.8, times: [0, 0.12, 0.65, 1], ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          pointerEvents: 'none',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.65rem, 1.2vw, 0.95rem)',
          letterSpacing: '0.12em',
          lineHeight: 2.2,
          color: '#1a1a2e',
          whiteSpace: 'nowrap',
        }}
      >
        ψ = U · (r − R²/r) · sin θ<br />
        + Γ · θ / (2π)
      </motion.div>

      {/* Streamlines + cercle */}
      <TheEye />

      {/* Widget citation — overlay full screen */}
      <CitationWidget />

      {/* Input en bas */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'absolute',
          bottom: '3rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(560px, 90vw)',
          zIndex: 20,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          borderRadius: '999px',
          padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.45)',
          transition: 'box-shadow 0.4s ease',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.65)',
            flexShrink: 0,
          }}>{'>'}</span>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question technique..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              padding: '2px 0',
              outline: 'none',
              letterSpacing: '0.04em',
            }}
          />

          {/* Micro */}
          <button
            type="button"
            onMouseEnter={() => setMicHover(true)}
            onMouseLeave={() => setMicHover(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: iconColor(micHover),
              transition: 'color 0.2s ease',
              flexShrink: 0,
            }}
          >
            <Mic size={15} />
          </button>

          {/* Send */}
          <button
            type="submit"
            onMouseEnter={() => setSendHover(true)}
            onMouseLeave={() => setSendHover(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: iconColor(sendHover),
              transition: 'color 0.2s ease',
              flexShrink: 0,
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </motion.div>
  )
}
