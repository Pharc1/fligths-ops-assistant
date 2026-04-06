import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRimeStore } from '../store/useRimeStore'

const ease = [0.4, 0, 0.2, 1]
const TOTAL_DURATION = 4800

// Séquence de boot : panels qui apparaissent, s'écrivent, disparaissent
// Chaque panel = { lines, startMs, durationMs }
const BOOT_PANELS = [
  {
    id: 'bios',
    startMs: 150,
    durationMs: 1000,
    lines: [
      '> RIME-BIOS v2.1 — COLD BOOT',
      '  Checking memory banks... ECC 32768MB OK',
      '  CPU topology: 2x8 cores @ 3.8GHz',
      '  Hyperthreading: ENABLED',
      '  PCIe bus scan: 14 devices found',
      '  NVMe /dev/nvme0: 2048GB SAMSUNG 990 PRO',
      '  GPU 0: NVIDIA A100 80GB — driver 535.104',
      '  GPU 1: NVIDIA A100 80GB — driver 535.104',
      '  IOMMU: ENABLED (VT-d)',
      '  Secure Boot: BYPASSED [MAINTENANCE MODE]',
      '  TPM 2.0: DETECTED — not used',
      '  Network: eth0 10GbE LINK UP',
      '> BIOS OK — handoff to GRUB...',
    ],
  },
  {
    id: 'kernel',
    startMs: 800,
    durationMs: 1300,
    lines: [
      '$ systemctl start rime.target',
      '  Loaded: /etc/systemd/system/rime.target',
      '  [  OK  ] Started network-online.target',
      '  [  OK  ] Mounted /mnt/rag-store (ext4)',
      '  [  OK  ] Started postgresql@15-main',
      '           Listening on 0.0.0.0:5432',
      '  [  OK  ] Started zookeeper.service',
      '           Binding to /0.0.0.0:2181',
      '  [  OK  ] Started kafka.service',
      '           Binding to /0.0.0.0:9092',
      '           Log dir: /var/kafka/logs',
      '  [  OK  ] Started redis.service (cache)',
      '  [  OK  ] Started python-ai.service',
      '           Workers: 4 uvicorn procs',
      '  [  OK  ] Started java-backend.service',
      '           Spring Boot 3.2 — port 8080',
      '  [WARN  ] ChromaDB: cold start, building index...',
      '           Scanning /mnt/rag-store/vectors/',
      '           Loading segment 001/048...',
      '           Loading segment 012/048...',
      '           Loading segment 031/048...',
      '           Loading segment 048/048...',
      '  [  OK  ] 14832 vectors loaded in 1.2s',
    ],
  },
  {
    id: 'skills',
    startMs: 1900,
    durationMs: 1200,
    lines: [
      '$ pip install -r requirements.txt',
      '  Collecting langchain==0.2.1',
      '  Collecting langchain-google-genai',
      '  Collecting chromadb==0.5.3',
      '  Collecting kafka-python==2.0.2',
      '  Collecting fastapi==0.111.0',
      '  Collecting uvicorn[standard]',
      '  Collecting tenacity==8.3.0',
      '  Collecting pydantic==2.7.1',
      '  Installing collected packages: 31 packages',
      '  Successfully installed all packages.',
      '$ rime --load-skills /skills/**',
      '  SCAN   incident-analysis/SKILL.md  [OK]',
      '  SCAN   impact-assessment/SKILL.md  [OK]',
      '  SCAN   troubleshooting/SKILL.md    [OK]',
      '  REGISTER 3 behavioral skills',
      '  BUILD  rag_tools        [1 tool]',
      '  BUILD  task_tools       [7 tools]',
      '  BUILD  ui_tools         [7 tools]',
      '  BUILD  report_tools     [1 tool]',
      '  BUILD  skill_tools      [1 tool]',
      '  TOTAL  tool_registry: 17 tools loaded',
      '$ rime --handshake gemini-2.0-flash-exp',
      '  POST https://generativelanguage.googleapis.com',
      '  Status: 200 OK — latency: 187ms',
      '  Context window: 1,000,000 tokens',
      '  [  OK  ] LLM ready',
    ],
  },
  {
    id: 'status',
    startMs: 3000,
    durationMs: 1600,
    lines: [
      '$ rime --status --verbose',
      '  KAFKA   broker@localhost:9092  [ONLINE]',
      '  TOPIC   incident.created       [READY]',
      '  TOPIC   incident.processed     [READY]',
      '  PGSQL   rime_db@localhost:5432 [ONLINE]',
      '  TABLE   incidents (0 rows)     [EMPTY]',
      '  RAG     chromadb@localhost     [ONLINE]',
      '           14832 vectors / 3 collections',
      '  API     http://0.0.0.0:8000   [ONLINE]',
      '  AGENT   mode=interactive       [STANDBY]',
      '  SKILLS  3/3 loaded             [OK]',
      '',
      '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '  ALL SYSTEMS NOMINAL',
      '  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '> Launching RIME interface...',
    ],
  },
]

// Typer une ligne
function TypedLine({ text, speed = 120, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idx = useRef(0)

  useEffect(() => {
    if (!text) { setDone(true); onDone?.(); return }
    const iv = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1))
        idx.current++
      } else {
        clearInterval(iv)
        setDone(true)
        onDone?.()
      }
    }, 1000 / speed)
    return () => clearInterval(iv)
  }, [])

  const isOk = text.includes('[  OK  ]')
  const isWarn = text.includes('[WARN  ]')
  const isCmd = text.startsWith('$') || text.startsWith('>')

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.58rem',
      lineHeight: 1.85,
      letterSpacing: '0.06em',
      color: isOk
        ? 'rgba(26,26,46,0.55)'
        : isWarn
        ? 'rgba(180,120,40,0.7)'
        : isCmd
        ? 'rgba(26,26,46,0.7)'
        : 'rgba(26,26,46,0.35)',
      fontWeight: isCmd ? 500 : 400,
      whiteSpace: 'pre',
    }}>
      {displayed}
      {!done && (
        <span style={{
          display: 'inline-block',
          width: '5px',
          height: '0.65em',
          background: 'rgba(26,26,46,0.5)',
          marginLeft: '1px',
          verticalAlign: 'middle',
          animation: 'blink 0.6s step-end infinite',
        }} />
      )}
    </div>
  )
}

// Panel de terminal avec animation d'ouverture/fermeture
function BootPanel({ panel }) {
  const [currentLine, setCurrentLine] = useState(0)

  const handleLineDone = (i) => {
    if (i + 1 < panel.lines.length) {
      setTimeout(() => setCurrentLine(i + 1), 60)
    }
  }

  return (
    <AnimatePresence>
      {true && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '8px 14px',
          }}
        >
          {panel.lines.slice(0, currentLine + 1).map((line, i) => (
            <TypedLine
              key={i}
              text={line}
              speed={i < currentLine ? 9999 : 120}
              onDone={() => handleLineDone(i)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Coin de visée
function Corner({ position }) {
  const isRight = position.includes('right')
  const isBottom = position.includes('bottom')
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      style={{
        position: 'absolute',
        [isBottom ? 'bottom' : 'top']: '1.5rem',
        [isRight ? 'right' : 'left']: '1.5rem',
        width: 20,
        height: 20,
        borderTop: isBottom ? 'none' : '1px solid rgba(26,26,46,0.28)',
        borderBottom: isBottom ? '1px solid rgba(26,26,46,0.28)' : 'none',
        borderLeft: isRight ? 'none' : '1px solid rgba(26,26,46,0.28)',
        borderRight: isRight ? '1px solid rgba(26,26,46,0.28)' : 'none',
      }}
    />
  )
}

export default function IntroPage() {
  const setPhase = useRimeStore((s) => s.setPhase)
  const [activePanels, setActivePanels] = useState([])

  useEffect(() => {
    const timers = []

    BOOT_PANELS.forEach((panel) => {
      const t1 = setTimeout(() => {
        setActivePanels(prev => [...prev, panel.id])
      }, panel.startMs)

      const t2 = setTimeout(() => {
        setActivePanels(prev => prev.filter(id => id !== panel.id))
      }, panel.startMs + panel.durationMs)

      timers.push(t1, t2)
    })

    const tEnd = setTimeout(() => setPhase('eye'), TOTAL_DURATION)
    timers.push(tEnd)

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(12px)', scale: 1.02 }}
      transition={{ duration: 0.9, ease }}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#f0ede8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Grille */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(26,26,46,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26,26,46,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <Corner position="top-left" />
      <Corner position="top-right" />
      <Corner position="bottom-left" />
      <Corner position="bottom-right" />

      {/* Coordonnées */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
        style={{ position: 'absolute', top: '2rem', left: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(26,26,46,0.32)', letterSpacing: '0.1em' }}>
        48°51'24"N / 02°21'03"E<br />CDG — MAINTENANCE OPS
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }}
        style={{ position: 'absolute', top: '2rem', right: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'rgba(26,26,46,0.32)', letterSpacing: '0.1em', textAlign: 'right' }}>
        BUILD 0041-ALPHA<br />RESTRICTED ACCESS
      </motion.div>

      {/* TITRE — fixe, ne bouge pas */}
      <motion.h1
        initial={{ opacity: 0, letterSpacing: '0.8em' }}
        animate={{ opacity: 1, letterSpacing: '0.4em' }}
        transition={{ duration: 1.0, ease }}
        style={{
          fontFamily: 'var(--font-interface)',
          fontWeight: 100,
          fontSize: 'clamp(3rem, 10vw, 7rem)',
          color: '#1a1a2e',
          margin: 0,
          position: 'absolute', // fixe dans le centre absolu
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -58%)',
          zIndex: 1,
          whiteSpace: 'nowrap',
        }}
      >
        RIME
      </motion.h1>

      {/* Sous-titre — fixe */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'rgba(26,26,46,0.38)',
          letterSpacing: '0.25em',
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -10%)',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        REASONING & INFERENCE MAINTENANCE ENGINE
      </motion.p>

      {/* Panel de terminal — sous le titre, position absolue donc titre immobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          position: 'absolute',
          top: '60%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '340px',
          minHeight: '140px',
          border: '1px solid rgba(26,26,46,0.10)',
          borderRadius: '2px',
          background: 'rgba(26,26,46,0.03)',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {/* Barre titre du panel */}
        <div style={{
          borderBottom: '1px solid rgba(26,26,46,0.08)',
          padding: '5px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.5rem',
          color: 'rgba(26,26,46,0.25)',
          letterSpacing: '0.12em',
        }}>
          <span>RIME — BOOT TERMINAL</span>
          <span>PID 0x0041</span>
        </div>

        {/* Zone de contenu — scroll automatique vers le bas */}
        <div style={{ position: 'relative', height: '140px', overflowY: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {BOOT_PANELS.map(panel =>
            activePanels.includes(panel.id) && (
              <BootPanel key={panel.id} panel={panel} />
            )
          )}
        </div>
      </motion.div>

      {/* Barre de progression */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ position: 'absolute', bottom: '1.8rem', left: '50%', transform: 'translateX(-50%)', width: '200px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: 'rgba(26,26,46,0.38)', letterSpacing: '0.1em', marginBottom: '5px' }}>
          <span>BOOT SEQUENCE</span><span>0x0041</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(26,26,46,0.08)', position: 'relative', overflow: 'hidden' }}>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: TOTAL_DURATION / 1000, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.32)', transformOrigin: 'left' }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
