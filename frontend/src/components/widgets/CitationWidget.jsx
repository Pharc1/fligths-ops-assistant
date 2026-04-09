import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, ChevronRight } from 'lucide-react'
import { useRimeStore } from '../../store/useRimeStore'

const C = {
  bg:         '#0c0c0a',
  bgPanel:    '#0f0f0d',
  bgModal:    '#111110',
  border:     'rgba(210,205,195,0.12)',
  borderHover:'rgba(210,205,195,0.28)',
  accent:     'rgba(220,215,205,0.55)',
  text:       'rgba(225,220,210,0.85)',
  textDim:    'rgba(200,195,185,0.45)',
  textFaint:  'rgba(190,185,175,0.22)',
  highlight:  'rgba(200,160,60,0.28)',   // surligné amber
  highlightBorder: 'rgba(200,160,60,0.55)',
  badge:      'rgba(200,160,60,0.15)',
  badgeText:  'rgba(220,180,80,0.9)',
}

// ─── Mock de données ──────────────────────────────────────────────────────────
export const CITATION_MOCK = {
  subject: 'REF-447',
  title: 'AF447 — ANALYSE CAUSALE',
  confidence: 0.91,
  // Texte principal de l'analyse RIME avec des passages à citer
  body: [
    { type: 'paragraph', text: "L'incident du vol AF447 résulte d'une séquence d'événements initiée par l'obstruction simultanée des trois sondes Pitot. La perte des informations de vitesse a conduit à une désactivation du pilote automatique et à un changement de loi de pilotage." },
    { type: 'highlight', text: "Les trois sondes de vitesse se sont obstruées simultanément, privant l'équipage de l'indication de vitesse air pendant 54 secondes consécutives.", sourceId: 'BEA-2012-04', page: 42 },
    { type: 'paragraph', text: "En réponse, l'équipage a effectué des actions de pilotage inappropriées. L'alarme de décrochage s'est déclenchée à plusieurs reprises sans action corrective de la part des pilotes." },
    { type: 'highlight', text: "AUTO FLT AP OFF — F/CTL ALTN LAW — STALL WARNING — enregistré à 02h14 UTC. Séquence de 28 messages en 3 minutes.", sourceId: 'ACARS-AF447', page: 1 },
    { type: 'paragraph', text: "Les données du CVR confirment que l'alarme de décrochage était active et audible tout au long de la descente finale. Aucune action de récupération coordonnée n'a été effectuée." },
    { type: 'highlight', text: "Taux de chute confirmé −10 900 ft/min. Alarme de décrochage active 54 secondes. Aucun input correcteur enregistré.", sourceId: 'CVR-TRANSCRIPT', page: 3 },
  ],
  sources: [
    {
      id: 'BEA-2012-04',
      label: 'RAPPORT FINAL BEA',
      date: '2012-07-29',
      page: 42,
      fullText: `BUREAU D'ENQUÊTES ET D'ANALYSES — RAPPORT FINAL
Vol AF447 — Accident survenu le 1er juin 2009

3.1 DÉFAILLANCE DES SONDES PITOT

Les investigations ont établi que les trois sondes de vitesse (Pitot) se sont obstruées simultanément par des cristaux de glace. Cette obstruction, d'une durée de 54 secondes, a privé les systèmes automatiques de toute référence de vitesse fiable.

Les trois sondes de vitesse se sont obstruées simultanément, privant l'équipage de l'indication de vitesse air pendant 54 secondes consécutives.

En conséquence, le pilote automatique s'est déconnecté et la loi de pilotage a régressé en loi alternante. L'équipage n'était pas préparé à cette situation dégradée à cette altitude et dans ces conditions météorologiques.

3.2 RÉPONSE DE L'ÉQUIPAGE

Lors du passage en loi alternante, le commandant de bord était en phase de repos réglementaire. Les deux copilotes ont effectué des actions contradictoires sur les commandes de vol, aggravant la situation.`,
    },
    {
      id: 'ACARS-AF447',
      label: 'MESSAGES ACARS',
      date: '2009-06-01',
      page: 1,
      fullText: `AIRBUS A330 — MESSAGES ACARS VOL AF447
Séquence enregistrée entre 02h10 et 02h14 UTC

02h10:34 — AUTO FLT AP OFF
02h10:35 — AUTO FLT AP OFF (confirmation)
02h10:51 — F/CTL ALTN LAW
02h11:03 — STALL WARNING (1ère occurrence)
02h12:02 — STALL WARNING (2ème occurrence)
02h13:41 — STALL WARNING (3ème occurrence)

AUTO FLT AP OFF — F/CTL ALTN LAW — STALL WARNING — enregistré à 02h14 UTC. Séquence de 28 messages en 3 minutes.

02h14:28 — FIN DE TRANSMISSION
Impact estimé : 02h14:28 UTC`,
    },
    {
      id: 'CVR-TRANSCRIPT',
      label: 'TRANSCRIPTION CVR',
      date: '2009-06-01',
      page: 3,
      fullText: `COCKPIT VOICE RECORDER — TRANSCRIPTION PARTIELLE
Dernières minutes du vol AF447

[02h11:37] CDB (entrant en cabine de pilotage) : "Qu'est-ce qui se passe ?"
[02h11:43] OPL : "On a perdu les vitesses..."
[02h12:02] GPWS : "STALL STALL STALL"
[02h13:12] OPL : "Je suis en TOGA hein"
[02h13:40] CDB : "Mais qu'est-ce que vous foutez ?"

Taux de chute confirmé −10 900 ft/min. Alarme de décrochage active 54 secondes. Aucun input correcteur enregistré.

[02h14:26] OPL : "On va taper..."
[02h14:28] FIN D'ENREGISTREMENT`,
    },
  ],
}

// ─── Badge citation inline ────────────────────────────────────────────────────
function CitationBadge({ sourceId, page, onOpen }) {
  const [hover, setHover] = useState(false)
  return (
    <span
      onClick={() => onOpen(sourceId)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        marginLeft: '6px',
        padding: '1px 6px',
        background: hover ? 'rgba(200,160,60,0.25)' : C.badge,
        border: `1px solid ${hover ? 'rgba(200,160,60,0.7)' : 'rgba(200,160,60,0.3)'}`,
        borderRadius: '2px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.48rem',
        color: C.badgeText,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        verticalAlign: 'middle',
        userSelect: 'none',
      }}
    >
      <FileText size={8} />
      {sourceId.split('-')[0]} p.{page}
    </span>
  )
}

// ─── Modal document complet ───────────────────────────────────────────────────
function DocumentModal({ source, highlightText, onClose }) {
  if (!source) return null

  // Découpe le fullText autour du passage à surligner
  const parts = source.fullText.split(highlightText)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: 'min(680px, 90vw)',
            maxHeight: '75vh',
            background: C.bgModal,
            border: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header modal */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.8rem 1.2rem',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: C.textFaint, letterSpacing: '0.14em', display: 'block', marginBottom: '2px' }}>
                {source.id}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: C.text, letterSpacing: '0.1em', fontWeight: 600 }}>
                {source.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.textFaint, letterSpacing: '0.1em' }}>
                p.{source.page} — {source.date}
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textDim, display: 'flex', alignItems: 'center', padding: '2px' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Corps du document */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.6rem' }}>
            <pre style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.58rem',
              color: C.textDim,
              lineHeight: 1.9,
              letterSpacing: '0.04em',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {parts.length > 1 ? (
                <>
                  <span>{parts[0]}</span>
                  <span style={{
                    background: C.highlight,
                    borderBottom: `1px solid ${C.highlightBorder}`,
                    color: 'rgba(230,200,120,0.95)',
                    padding: '0 2px',
                  }}>{highlightText}</span>
                  <span>{parts.slice(1).join(highlightText)}</span>
                </>
              ) : (
                <span>{source.fullText}</span>
              )}
            </pre>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Widget principal ─────────────────────────────────────────────────────────
export default function CitationWidget() {
  const widgets      = useRimeStore((s) => s.widgets)
  const clearWidgets = useRimeStore((s) => s.clearWidgets)
  const [modalSourceId, setModalSourceId] = useState(null)

  const data = widgets.citation
  if (!data) return null

  const conf = Math.round((data.confidence ?? 0) * 100)
  const sources = data.sources ?? []

  const modalSource = sources.find(s => s.id === modalSourceId)
  // Le texte à surligner dans le modal = l'excerpt de la source
  const modalHighlight = modalSource?.excerpt ?? ''

  const handleOpenModal = (sourceId) => setModalSourceId(sourceId)
  const handleCloseModal = () => setModalSourceId(null)

  return (
    <AnimatePresence>
      <motion.div
        key="citation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: C.bg,
          display: 'grid', gridTemplateRows: 'auto 1fr auto',
          overflow: 'hidden',
        }}
      >
        {/* Scanlines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.10) 2px, rgba(0,0,0,0.10) 4px)`,
        }} />

        {/* ── HEADER ── */}
        <div style={{
          borderBottom: `1px solid ${C.border}`,
          padding: '0.85rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: C.textFaint, letterSpacing: '0.18em' }}>[ RIME ]</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: C.text, letterSpacing: '0.15em' }}>DOCUMENT.VIEW // SOURCE.SCAN</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.textFaint, letterSpacing: '0.1em' }}>
              {sources.length} REF
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.textFaint, letterSpacing: '0.1em' }}>
              CONF. {conf}%
            </span>
            <button
              onClick={clearWidgets}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: C.textDim,
                letterSpacing: '0.12em', background: 'none',
                border: `1px solid ${C.border}`, cursor: 'pointer', padding: '3px 10px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border }}
            >
              [ CLOSE ]
            </button>
          </div>
        </div>

        {/* ── CONTENU ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', zIndex: 2, minHeight: 0 }}>

          {/* ─ GAUCHE : texte avec surligné ─ */}
          <div style={{ padding: '2rem 2.4rem', overflowY: 'auto', borderRight: `1px solid ${C.border}` }}>
            <div style={{ marginBottom: '1.8rem' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.textFaint, letterSpacing: '0.18em', marginBottom: '0.3rem' }}>
                SUJET
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: C.text, letterSpacing: '0.12em', fontWeight: 600 }}>
                {data.subject}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: C.textDim, letterSpacing: '0.1em', marginTop: '0.2rem' }}>
                {data.title}
              </div>
              <div style={{ height: '1px', background: C.border, marginTop: '0.8rem' }} />
            </div>

            {/* Corps du document avec passages surlignés */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: C.textDim, lineHeight: 2.0, letterSpacing: '0.04em' }}>
              {(data.body ?? []).map((block, i) => {
                if (block.type === 'paragraph') {
                  return (
                    <p key={i} style={{ margin: '0 0 1.2rem 0' }}>{block.text}</p>
                  )
                }
                if (block.type === 'highlight') {
                  return (
                    <p key={i} style={{ margin: '0 0 1.2rem 0' }}>
                      <span style={{
                        background: C.highlight,
                        borderBottom: `1px solid ${C.highlightBorder}`,
                        color: 'rgba(230,200,120,0.95)',
                        padding: '1px 3px',
                      }}>
                        {block.text}
                      </span>
                      <CitationBadge
                        sourceId={block.sourceId}
                        page={block.page}
                        onOpen={handleOpenModal}
                      />
                    </p>
                  )
                }
                return null
              })}
            </div>
          </div>

          {/* ─ DROITE : liste sources ─ */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{
              padding: '1rem 1.2rem 0.6rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.42rem',
              color: C.textFaint, letterSpacing: '0.16em',
              borderBottom: `1px solid ${C.border}`,
            }}>
              SOURCES — {sources.length} DOC.
            </div>

            {sources.map((src, i) => {
              const isActive = modalSourceId === src.id
              return (
                <motion.div
                  key={src.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                  onClick={() => handleOpenModal(src.id)}
                  style={{
                    padding: '0.9rem 1.2rem',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    background: isActive ? 'rgba(200,160,60,0.05)' : 'transparent',
                    borderLeft: isActive ? `2px solid ${C.highlightBorder}` : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(210,205,195,0.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: C.text, letterSpacing: '0.08em', fontWeight: 600 }}>
                      {src.label}
                    </span>
                    <ChevronRight size={10} color={C.textFaint} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: C.badgeText,
                      background: C.badge, border: `1px solid rgba(200,160,60,0.3)`,
                      padding: '0 4px', letterSpacing: '0.08em',
                    }}>
                      {src.id}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: C.textFaint, letterSpacing: '0.08em' }}>
                      p.{src.page} · {src.date}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.48rem', color: C.textDim,
                    lineHeight: 1.7, margin: 0, letterSpacing: '0.03em',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {src.excerpt}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: '0.6rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1.2rem', zIndex: 2,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.44rem', color: C.textFaint, letterSpacing: '0.12em' }}>
            CONF.
          </span>
          <div style={{ flex: '0 0 120px', height: '1px', background: 'rgba(210,205,195,0.1)', position: 'relative' }}>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: conf / 100 }}
              transition={{ delay: 0.9, duration: 0.7 }}
              style={{ position: 'absolute', inset: 0, background: C.accent, transformOrigin: 'left' }}
            />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: C.text, letterSpacing: '0.1em' }}>{conf}%</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.42rem', color: C.textFaint, letterSpacing: '0.08em', marginLeft: 'auto' }}>
            {data.timestamp}
          </span>
        </div>

        {/* ── MODAL document complet ── */}
        {modalSourceId && (
          <DocumentModal
            source={modalSource}
            highlightText={modalHighlight}
            onClose={handleCloseModal}
          />
        )}

        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </motion.div>
    </AnimatePresence>
  )
}
