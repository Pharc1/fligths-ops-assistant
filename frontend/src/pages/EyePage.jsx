import { motion } from 'framer-motion'
import TheEye from '../components/eye/TheEye'
import AgentTrace from '../components/widgets/AgentTrace'
import RimePromptInput from '../components/widgets/RimePromptInput'
import { useRimeAsk } from '../hooks/useRimeAsk'
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
  const { input, setInput, submitQuestion } = useRimeAsk({ enterInvestigationOnPanel: true })
  const activeWidget = useRimeStore((state) => state.activeWidget)

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
        <AgentTrace floating />
      )}

      {!activeWidget && (
        <div
          style={{
            position: 'absolute',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(620px, 90vw)',
            zIndex: 20,
          }}
        >
          <RimePromptInput input={input} setInput={setInput} onSubmit={submitQuestion} />
        </div>
      )}
    </motion.div>
  )
}
