import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useRimeStore } from '../../store/useRimeStore'

const C = {
  bg:              '#080808',
  bgModal:         '#0e0d0b',
  border:          'rgba(210,205,195,0.08)',
  borderMid:       'rgba(210,205,195,0.18)',
  text:            'rgba(225,220,210,0.82)',
  textDim:         'rgba(200,195,185,0.40)',
  textFaint:       'rgba(190,185,175,0.18)',
  amber:           'rgba(230,200,120,0.95)',
  amberBg:         'rgba(200,160,60,0.15)',
  amberBorder:     'rgba(200,160,60,0.40)',
  accent:          'rgba(220,215,205,0.50)',
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
export const WIDGET_DOC_MOCK = {
  confidence: 0.91,
  timestamp:  '03:14:22 UTC',
  // Chaque entrée = un passage trouvé dans un document
  entries: [
    {
      rimeNote: "J'ai trouvé dans le rapport final BEA une correspondance directe avec la signature de panne Pitot signalée — obstruction simultanée des trois capteurs, identique à votre incident.",
      rimeAlert: "Vérifier SB A330-34-3045 — modification du chauffage sondes.",
      source: {
        id:    'BEA-2012-04',
        label: 'RAPPORT FINAL BEA',
        date:  '2012-07-29',
        page:  42,
      },
      before:    "3.1 DÉFAILLANCE DES SONDES PITOT\n\nLes investigations ont établi que les trois sondes de vitesse (Pitot) se sont obstruées simultanément par des cristaux de glace. Cette obstruction, d'une durée de 54 secondes, a privé les systèmes automatiques de toute référence de vitesse fiable.\n\n",
      highlight: "Les trois sondes de vitesse se sont obstruées simultanément, privant l'équipage de l'indication de vitesse air pendant 54 secondes consécutives.",
      after:     "\n\nEn conséquence, le pilote automatique s'est déconnecté et la loi de pilotage a régressé en loi alternante. L'équipage n'était pas préparé à cette situation dégradée à cette altitude.",
    },
    {
      rimeNote: "Les messages ACARS confirment la séquence exacte de dégradation des systèmes — AP OFF puis ALTN LAW puis STALL WARNING en moins de 4 minutes, ce qui fait écho à la timeline de votre incident.",
      rimeAlert: null,
      source: {
        id:    'ACARS-AF447',
        label: 'MESSAGES ACARS',
        date:  '2009-06-01',
        page:  1,
      },
      before:    "AIRBUS A330 — MESSAGES ACARS VOL AF447\nSéquence enregistrée entre 02h10 et 02h14 UTC\n\n02h10:34 — AUTO FLT AP OFF\n02h10:35 — AUTO FLT AP OFF (confirmation)\n02h10:51 — F/CTL ALTN LAW\n02h11:03 — STALL WARNING (1ère occurrence)\n\n",
      highlight: "AUTO FLT AP OFF — F/CTL ALTN LAW — STALL WARNING — enregistré à 02h14 UTC. Séquence de 28 messages en 3 minutes.",
      after:     "\n\n02h14:28 — FIN DE TRANSMISSION\nImpact estimé : 02h14:28 UTC",
    },
    {
      rimeNote: "La transcription CVR documente l'absence totale d'input correcteur malgré l'alarme active — pattern identique au comportement observé sur votre appareil d'après les données ACARS reçues.",
      rimeAlert: "Taux de chute −10 900 ft/min confirmé. Comparer avec les données de descente actuelles.",
      source: {
        id:    'CVR-TRANSCRIPT',
        label: 'TRANSCRIPTION CVR',
        date:  '2009-06-01',
        page:  3,
      },
      before:    "COCKPIT VOICE RECORDER — TRANSCRIPTION PARTIELLE\nDernières minutes du vol AF447\n\n[02h11:37] CDB : \"Qu'est-ce qui se passe ?\"\n[02h11:43] OPL : \"On a perdu les vitesses...\"\n[02h12:02] GPWS : \"STALL STALL STALL\"\n\n",
      highlight: "Taux de chute confirmé −10 900 ft/min. Alarme de décrochage active 54 secondes. Aucun input correcteur enregistré.",
      after:     "\n\n[02h14:26] OPL : \"On va taper...\"\n[02h14:28] FIN D'ENREGISTREMENT",
    },
  ],
}

// ─── Modal document complet ───────────────────────────────────────────────────
function DocModal({ entry, onClose }) {
  const fullText = entry.before + entry.highlight + entry.after
  const parts    = fullText.split(entry.highlight)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(680px, 88vw)', maxHeight: '78vh',
            background: C.bgModal, border: `1px solid ${C.borderMid}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.8rem 1.2rem', borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.4rem', color: C.textFaint, letterSpacing: '0.16em', marginBottom: '2px' }}>
                {entry.source.id} · p.{entry.source.page} · {entry.source.date}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.text, letterSpacing: '0.1em', fontWeight: 600 }}>
                {entry.source.label}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, padding: '4px' }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.6rem' }}>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.56rem',
              color: C.textDim, lineHeight: 1.95, letterSpacing: '0.04em',
              whiteSpace: 'pre-wrap', margin: 0,
            }}>
              {parts.length > 1 ? (
                <>
                  <span>{parts[0]}</span>
                  <span style={{
                    background: C.amberBg,
                    borderBottom: `1px solid ${C.amberBorder}`,
                    color: C.amber, padding: '0 2px',
                  }}>{entry.highlight}</span>
                  <span>{parts.slice(1).join(entry.highlight)}</span>
                </>
              ) : <span>{fullText}</span>}
            </pre>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Widget principal ─────────────────────────────────────────────────────────
export default function WidgetDoc() {
  const widgets     = useRimeStore((s) => s.widgets)
  const returnToEye = useRimeStore((s) => s.returnToEye)

  const [index,      setIndex]      = useState(0)
  const [modalOpen,  setModalOpen]  = useState(false)

  const data = widgets['display_document']
  if (!data) return null

  const entries = data.entries ?? []
  const total   = entries.length
  if (total === 0) return null

  const entry = entries[Math.min(index, total - 1)]
  const conf  = Math.round((data.confidence ?? 0) * 100)

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(total - 1, i + 1))

  return (
    <div style={{
      position:      'absolute',
      inset:         0,
      background:    C.bg,
      display:       'grid',
      gridTemplateRows: 'auto 1fr',
      overflow:      'hidden',
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: `1px solid ${C.border}`,
        padding: '0.65rem 1.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.4rem', color: C.textFaint, letterSpacing: '0.2em' }}>
            DOCUMENT.VIEW
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.4rem', color: C.textFaint, letterSpacing: '0.1em' }}>
            CONF. {conf}%
          </span>
        </div>
        <button
          onClick={returnToEye}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.38rem', color: C.textFaint,
            letterSpacing: '0.12em', background: 'none', border: `1px solid ${C.border}`,
            padding: '2px 8px', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.text }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.textFaint }}
        >
          ← EYE
        </button>
      </div>

      {/* ── CORPS : doc | note RIME ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', minHeight: 0 }}>

        {/* Gauche — lecteur de passage ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${C.border}` }}>

          {/* Note de RIME — fil conducteur */}
          <div style={{
            flexShrink: 0,
            padding: '1.2rem 1.8rem 1rem',
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: C.textFaint, letterSpacing: '0.18em', marginBottom: '0.5rem' }}>
              RIME
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                  color: 'rgba(225,220,210,0.65)', lineHeight: 1.75,
                  letterSpacing: '0.03em', margin: 0, fontStyle: 'italic',
                }}
              >
                {entry.rimeNote}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Passage du document */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.8rem' }}>
            <AnimatePresence mode="wait">
              <motion.pre
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                  lineHeight: 2.0, letterSpacing: '0.03em',
                  whiteSpace: 'pre-wrap', margin: 0,
                  color: C.textDim,
                }}
              >
                <span>{entry.before}</span>
                <span style={{
                  background:   C.amberBg,
                  borderBottom: `1px solid ${C.amberBorder}`,
                  color:        C.amber,
                  padding:      '2px 4px',
                }}>
                  {entry.highlight}
                </span>
                <span>{entry.after}</span>
              </motion.pre>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div style={{
            flexShrink: 0,
            borderTop: `1px solid ${C.border}`,
            padding: '0.7rem 1.8rem',
            display: 'flex', alignItems: 'center', gap: '0.8rem',
          }}>
            <button onClick={prev} disabled={index === 0}
              style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? C.textFaint : C.textDim, padding: '2px', display: 'flex', alignItems: 'center' }}
            ><ChevronLeft size={16} /></button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.textFaint, letterSpacing: '0.1em' }}>
              {index + 1} / {total}
            </span>
            <button onClick={next} disabled={index === total - 1}
              style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', color: index === total - 1 ? C.textFaint : C.textDim, padding: '2px', display: 'flex', alignItems: 'center' }}
            ><ChevronRight size={16} /></button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: C.textFaint, letterSpacing: '0.08em', marginLeft: 'auto' }}>
              {data.timestamp}
            </span>
          </div>
        </div>

        {/* Droite — source + alerte ───────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: '1.4rem 1.2rem', gap: '1.4rem',
          overflowY: 'auto',
        }}>
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}
            >
              {/* Métadonnées source */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: C.textFaint, letterSpacing: '0.18em', marginBottom: '0.7rem' }}>
                  SOURCE
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: C.text, letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.4rem', lineHeight: 1.4 }}>
                  {entry.source.label}
                </div>
                <div style={{
                  display: 'inline-block', marginBottom: '0.4rem',
                  fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                  color: 'rgba(200,160,60,0.85)', background: 'rgba(200,160,60,0.10)',
                  border: '1px solid rgba(200,160,60,0.25)', padding: '2px 8px', letterSpacing: '0.08em',
                }}>
                  {entry.source.id}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: C.textFaint, letterSpacing: '0.06em', marginBottom: '1rem' }}>
                  p.{entry.source.page} · {entry.source.date}
                </div>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
                    color: C.textDim, letterSpacing: '0.1em',
                    background: 'none', border: `1px solid ${C.border}`,
                    padding: '6px 0', cursor: 'pointer', transition: 'all 0.15s', width: '100%',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.borderMid }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border }}
                >
                  <ExternalLink size={11} /> VOIR DOCUMENT
                </button>
              </div>

              {/* Alerte RIME */}
              {entry.rimeAlert && (
                <div style={{
                  padding: '1rem',
                  background: 'rgba(200,160,60,0.07)',
                  border: '1px solid rgba(200,160,60,0.22)',
                  borderLeft: '2px solid rgba(200,160,60,0.6)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: 'rgba(200,160,60,0.55)', letterSpacing: '0.16em', marginBottom: '0.5rem' }}>
                    ATTENTION
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.68rem',
                    color: 'rgba(225,200,140,0.80)', lineHeight: 1.7,
                    letterSpacing: '0.03em', margin: 0,
                  }}>
                    {entry.rimeAlert}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modal document complet */}
      {modalOpen && (
        <DocModal entry={entry} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
