import { motion } from 'framer-motion'
import { useRimeStore } from '../store/useRimeStore'
import TheEye from '../components/eye/TheEye'
import AircraftViewer from '../components/eye/AircraftViewer'
import WidgetDoc from '../components/widgets/WidgetDoc'

const C = {
  bg:        '#080808',
  border:    'rgba(210,205,195,0.08)',
  text:      'rgba(225,220,210,0.75)',
  textFaint: 'rgba(190,185,175,0.22)',
  amber:     'rgba(220,180,80,0.85)',
}

// ─── Map tool → composant widget ─────────────────────────────────────────────
const WIDGETS = {
  display_document: WidgetDoc,
}

// ─── Zone widgets droite ──────────────────────────────────────────────────────
function WidgetZone() {
  const widgets      = useRimeStore((s) => s.widgets)
  const activeWidget = useRimeStore((s) => s.activeWidget)

  const keys = Object.keys(widgets).filter((k) => WIDGETS[k])
  if (keys.length === 0) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.textFaint, letterSpacing: '0.18em' }}>
        EN ATTENTE
      </span>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {keys.map((key) => {
        const Component = WIDGETS[key]
        const isActive  = activeWidget === key
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              flex:     isActive ? 1 : '0 0 auto',
              minHeight: 0,
              position: 'relative',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <Component />
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InvestigationPage() {
  const returnToEye = useRimeStore((s) => s.returnToEye)
  const rimeText    = useRimeStore((s) => s.rimeText)

  return (
    <motion.div
      key="investigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        width:   '100vw',
        height:  '100vh',
        background: C.bg,
        display: 'flex',
        overflow: 'hidden',
      }}
    >

      {/* ══ SIDEBAR GAUCHE ════════════════════════════════════════════════════ */}
      <div style={{
        width:    '600px',
        flexShrink: 0,
        position: 'relative',
        borderRight: `1px solid ${C.border}`,
        display:  'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Avion 3D — remplit toute la sidebar */}
        <div style={{ flex: 1, position: 'relative' }}>
          <AircraftViewer height="100%" />

          {/* TheEye mini — superposé en haut à gauche sur l'avion */}
          <div style={{
            position: 'absolute',
            top:      '14px',
            left:     '14px',
            zIndex:   10,
            width:    '52px',
            height:   '52px',
          }}>
            <TheEye miniaturized />
          </div>
        </div>

        {/* Infos appareil + bouton retour — collés en bas */}
        <div style={{
          flexShrink: 0,
          borderTop:  `1px solid ${C.border}`,
          padding:    '0.8rem 1rem',
          display:    'flex',
          flexDirection: 'column',
          gap:        '0.5rem',
        }}>
          {rimeText && (
            <p style={{
              fontFamily:   'var(--font-mono)',
              fontSize:     '0.42rem',
              color:        C.textFaint,
              lineHeight:   1.6,
              letterSpacing:'0.04em',
              margin:       0,
              display:      '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow:     'hidden',
            }}>
              {rimeText}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.text, letterSpacing: '0.08em' }}>
                F-GZCP
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.38rem', color: C.textFaint, letterSpacing: '0.08em' }}>
                A330-203
              </div>
            </div>
            <button
              onClick={returnToEye}
              style={{
                fontFamily:   'var(--font-mono)',
                fontSize:     '0.38rem',
                color:        C.textFaint,
                letterSpacing:'0.1em',
                background:   'none',
                border:       `1px solid ${C.border}`,
                padding:      '3px 8px',
                cursor:       'pointer',
                transition:   'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textFaint }}
            >
              ← EYE
            </button>
          </div>
        </div>
      </div>

      {/* ══ ZONE WIDGETS ══════════════════════════════════════════════════════ */}
      <div style={{
        flex:     1,
        display:  'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <WidgetZone />
      </div>

    </motion.div>
  )
}
