import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Send } from 'lucide-react'
import TheEye from '../components/eye/TheEye'
import { streamAgentAsk } from '../lib/rimeStream'
import { INVESTIGATION_MOCK_PANELS } from '../mock/rimePanels'
import { useRimeStore } from '../store/useRimeStore'

const ease = [0.4, 0, 0.2, 1]

function HudCorner({ style, children }) {
  return (
    <div style={{
      position: 'absolute',
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      letterSpacing: '0.12em',
      color: 'rgba(26,26,46,0.42)',
      zIndex: 20,
      pointerEvents: 'none',
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
  const hasEnteredInvestigation = useRef(false)

  const setRimeText = useRimeStore((state) => state.setRimeText)
  const setThinking = useRimeStore((state) => state.setThinking)
  const addPanel = useRimeStore((state) => state.addPanel)
  const openPanels = useRimeStore((state) => state.openPanels)
  const enterInvestigation = useRimeStore((state) => state.enterInvestigation)
  const activeWidget = useRimeStore((state) => state.activeWidget)

  const scheduleInvestigation = () => {
    if (hasEnteredInvestigation.current) return
    hasEnteredInvestigation.current = true
    window.setTimeout(() => enterInvestigation(), 650)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const question = input.trim()
    if (!question) return

    setInput('')
    hasEnteredInvestigation.current = false

    if (question.toLowerCase().includes('affiche') || question.toLowerCase().includes('demo')) {
      setRimeText("J'ai isole une preuve documentaire, une valeur capteur et un historique court.")
      openPanels(INVESTIGATION_MOCK_PANELS)
      scheduleInvestigation()
      return
    }

    setThinking(true)
    setRimeText('Connexion au moteur RIME...')

    try {
      await streamAgentAsk({
        question,
        onEvent: (streamEvent) => {
          if (streamEvent.type === 'assistant_delta') {
            setRimeText(streamEvent.content ?? streamEvent.data?.content ?? '')
          }

          if (streamEvent.type === 'panel') {
            addPanel(streamEvent.panel ?? streamEvent.data?.panel)
            scheduleInvestigation()
          }

          if (streamEvent.type === 'tool_use') {
            setThinking(true)
          }

          if (streamEvent.type === 'result') {
            setThinking(false)
            const content = streamEvent.content ?? streamEvent.data?.content
            if (content) setRimeText(content)
          }

          if (streamEvent.type === 'error') {
            setThinking(false)
            setRimeText(streamEvent.message ?? 'Erreur agent RIME.')
          }
        },
      })
    } catch (error) {
      setThinking(false)
      setRimeText(`Backend indisponible: ${error.message}`)
    }
  }

  const iconColor = (hover) => hover ? 'rgba(26,26,46,0.86)' : 'rgba(26,26,46,0.48)'

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
      {!activeWidget && (
        <>
          <HudCorner style={{ top: '1.5rem', left: '2rem' }}>
            SYS.RIME // v1.0.0 - [ONLINE]
          </HudCorner>
          <HudCorner style={{ top: '1.5rem', right: '2rem', textAlign: 'right' }}>
            AIRCRAFT: F-GZCP
            <br />
            {new Date().toLocaleTimeString('fr-FR')}
          </HudCorner>
        </>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.07, 0.07, 0] }}
        transition={{ duration: 3.8, times: [0, 0.12, 0.65, 1] }}
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
        psi = U . (r - R2/r) . sin theta
        <br />
        + Gamma . theta / (2pi)
      </motion.div>

      <TheEye />

      {!activeWidget && (
        <form
          onSubmit={handleSubmit}
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(620px, 90vw)',
            zIndex: 20,
          }}
        >
          <div className="rime-eye-input">
            <span>{'>'}</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Demander une verification, une valeur ou une source..."
            />
            <button
              type="button"
              onMouseEnter={() => setMicHover(true)}
              onMouseLeave={() => setMicHover(false)}
              style={{ color: iconColor(micHover) }}
              aria-label="Microphone"
            >
              <Mic size={16} />
            </button>
            <button
              type="submit"
              onMouseEnter={() => setSendHover(true)}
              onMouseLeave={() => setSendHover(false)}
              style={{ color: iconColor(sendHover) }}
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      )}
    </motion.div>
  )
}
