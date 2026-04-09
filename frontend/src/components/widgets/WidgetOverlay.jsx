import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useRimeStore } from '../../store/useRimeStore'

const C = {
  bg:     '#080808',
  border: 'rgba(210,205,195,0.10)',
  text:   'rgba(200,195,185,0.38)',
}

/**
 * Tiroir qui glisse depuis la droite.
 * Occupe ~68% de la largeur — TheEye reste visible à gauche.
 * Contient le widget actif (enfant).
 */
export default function WidgetOverlay({ children }) {
  const activeWidget = useRimeStore((s) => s.activeWidget)
  const closeWidget  = useRimeStore((s) => s.closeWidget)

  return (
    <AnimatePresence>
      {activeWidget && (
        <>
          {/* Fond semi-transparent cliquable pour fermer */}
          <motion.div
            key="overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeWidget}
            style={{
              position:   'absolute',
              inset:      0,
              zIndex:     30,
              background: 'rgba(0,0,0,0.35)',
            }}
          />

          {/* Tiroir */}
          <motion.div
            key="overlay-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            style={{
              position:      'absolute',
              top:           0,
              right:         0,
              bottom:        0,
              width:         '68%',
              zIndex:        40,
              background:    C.bg,
              borderLeft:    `1px solid ${C.border}`,
              display:       'flex',
              flexDirection: 'column',
              overflow:      'hidden',
            }}
          >
            {/* Barre de fermeture */}
            <div style={{
              flexShrink:     0,
              height:         '36px',
              borderBottom:   `1px solid ${C.border}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'flex-end',
              padding:        '0 1rem',
            }}>
              <button
                onClick={closeWidget}
                style={{
                  background: 'none',
                  border:     'none',
                  cursor:     'pointer',
                  color:      C.text,
                  display:    'flex',
                  alignItems: 'center',
                  padding:    '4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(220,215,205,0.75)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.text }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Contenu du widget */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
