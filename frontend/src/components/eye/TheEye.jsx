import { motion } from 'framer-motion'
import StreamlineCanvas from './StreamlineCanvas'
import Typewriter from './Typewriter'
import { useRimeStore } from '../../store/useRimeStore'

const CIRCLE_RADIUS_VH = 20

export default function TheEye({ miniaturized = false }) {
  const rimeText     = useRimeStore((s) => s.rimeText)
  const isThinking   = useRimeStore((s) => s.isThinking)
  const activeWidget = useRimeStore((s) => s.activeWidget)

  const widgetOpen = !miniaturized && !!activeWidget
  const size       = miniaturized ? '60px' : `${CIRCLE_RADIUS_VH * 2}vh`

  return (
    <div style={{
      position: 'relative',
      width:    miniaturized ? '60px' : '100%',
      height:   miniaturized ? '60px' : '100%',
    }}>

      {/* Streamlines */}
      {!miniaturized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <StreamlineCanvas />
        </motion.div>
      )}

      {/* Wrapper centrage */}
      <div style={{
        position:  'absolute',
        top:       '50%',
        left:      '50%',
        transform: 'translate(-50%, -50%)',
        zIndex:    10,
      }}>
        <motion.div
          initial={miniaturized ? false : { opacity: 0, scale: 0 }}
          animate={miniaturized ? false : {
            opacity: 1,
            scale:   widgetOpen ? 14 : 1,
          }}
          transition={widgetOpen
            ? { duration: 0.65, ease: [0.4, 0, 1, 1] }
            : { type: 'spring', stiffness: 160, damping: 18, delay: 1.4 }
          }
          style={{
            width:          size,
            height:         size,
            borderRadius:   '50%',
            background:     '#080808',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow: isThinking
              ? [
                  '0 0 0 2px rgba(255,255,255,0.9)',
                  '0 0 12px 4px rgba(255,255,255,0.5)',
                  '0 0 40px 12px rgba(255,255,255,0.2)',
                  '0 0 90px 30px rgba(255,255,255,0.07)',
                ].join(', ')
              : [
                  '0 0 0 2px rgba(255,255,255,0.7)',
                  '0 0 10px 3px rgba(255,255,255,0.35)',
                  '0 0 35px 10px rgba(255,255,255,0.12)',
                ].join(', '),
            transition:  'box-shadow 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow:    'hidden',
          }}
        >
          {/* Texte RIME — masqué pendant le zoom */}
          {!miniaturized && rimeText && !widgetOpen && (
            <div style={{
              width:     `${CIRCLE_RADIUS_VH * 2}vh`,
              maxWidth:  '320px',
              textAlign: 'center',
              color:     'rgba(255,255,255,0.85)',
              transform: 'translateY(-30%)',
              padding:   '0 1rem',
            }}>
              <Typewriter text={rimeText} />
            </div>
          )}

          {/* Pulse thinking */}
          {isThinking && !widgetOpen && (
            <motion.div
              style={{
                position:     'absolute',
                width:        '100%',
                height:       '100%',
                borderRadius: '50%',
                border:       '1px solid rgba(255,255,255,0.35)',
                opacity:      0,
              }}
              animate={{ scale: [1, 1.18], opacity: [0.5, 0] }}
              transition={{ duration: 2.0, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
