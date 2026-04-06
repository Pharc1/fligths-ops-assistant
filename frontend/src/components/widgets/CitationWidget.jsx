import { useRef, useMemo, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { useRimeStore } from '../../store/useRimeStore'

// Palette ivoire — même que les streamlines
const C = {
  bg:      '#0c0c0a',
  bgPanel: '#111110',
  border:  'rgba(210,205,195,0.18)',
  accent:  'rgba(220,215,205,0.55)',
  text:    'rgba(225,220,210,0.85)',
  textDim: 'rgba(200,195,185,0.45)',
  textFaint: 'rgba(190,185,175,0.28)',
  bar:     'rgba(220,215,205,0.7)',
  barBg:   'rgba(220,215,205,0.1)',
  shadow:  'rgba(220,215,205,0.15)',
}

// ─── Données mock ─────────────────────────────────────────────────────────────

export const CITATION_MOCK = {
  subject: 'REF-447',
  title: 'AF447 — ANALYSE CAUSALE',
  confidence: 0.91,
  timestamp: '2009-06-01T02:14:00Z',
  sources: [
    {
      id: 'BEA-2012-04',
      label: 'RAPPORT FINAL BEA',
      date: '2012-07-29',
      excerpt: "Les trois sondes de vitesse se sont obstruées simultanément, privant l'équipage de l'indication de vitesse air pendant 54 secondes consécutives.",
    },
    {
      id: 'ACARS-AF447',
      label: 'MESSAGES ACARS',
      date: '2009-06-01',
      excerpt: 'AUTO FLT AP OFF — F/CTL ALTN LAW — STALL WARNING — enregistré à 02h14 UTC. Séquence de 28 messages en 3 minutes.',
    },
    {
      id: 'CVR-TRANSCRIPT',
      label: 'TRANSCRIPTION CVR',
      date: '2009-06-01',
      excerpt: 'Taux de chute confirmé −10 900 ft/min. Alarme de décrochage active 54 secondes. Aucun input correcteur enregistré.',
    },
  ],
}

// ─── Mesh STL 747-400 ─────────────────────────────────────────────────────────

function AircraftMesh() {
  const geometry = useLoader(STLLoader, '/747-400.stl')
  const groupRef = useRef()

  const { edges, scale, grainMat } = useMemo(() => {
    geometry.computeBoundingBox()
    const size = new THREE.Vector3()
    geometry.boundingBox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale  = 3.2 / maxDim
    geometry.center()
    geometry.computeBoundingBox()

    // STL Z-up : le socle est à z_min → clipper sur Z original
    const zMin  = geometry.boundingBox.min.z
    const clipZ = zMin + size.z * 0.12

    const edges = new THREE.EdgesGeometry(geometry, 1)

    const grainMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying float vZ;
        varying vec3  vPos;
        void main() {
          vZ   = position.z;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uClipZ;
        uniform float uDensity;
        varying float vZ;
        varying vec3  vPos;

        float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898,78.233)))*43758.5453); }
        float rand3(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }

        void main() {
          if (vZ < uClipZ) discard;
          // Densité : hash par segment (quantisation → même valeur sur toute l'arête)
          if (rand3(floor(vPos * 6.0)) > uDensity) discard;
          float g = rand(floor(gl_FragCoord.xy * 0.4) + fract(uTime * 0.65)) * 0.2;
          float alpha = 0.68 - g * 0.4;
          gl_FragColor = vec4(0.88 - g, 0.85 - g, 0.80 - g, alpha);
        }
      `,
      uniforms: { uTime: { value: 0 }, uClipZ: { value: clipZ }, uDensity: { value: 0.35 } },
      transparent: true,
    })

    return { edges, scale, grainMat }
  }, [geometry])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    grainMat.uniforms.uTime.value = t
    if (!groupRef.current) return
    // Après rotation parent -PI/2 sur X, l'axe "haut" de l'avion est Z local
    groupRef.current.rotation.z = t * 0.22
  })

  return (
    <group scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={groupRef}>
        <lineSegments geometry={edges} material={grainMat} />
      </group>
    </group>
  )
}

// ─── Sous-composants UI ───────────────────────────────────────────────────────

function HudBracket({ top, left, right, bottom, size = 14 }) {
  const shared = {
    position: 'absolute', width: size, height: size,
    borderColor: C.accent, borderStyle: 'solid',
    borderTopWidth: 0, borderBottomWidth: 0,
    borderLeftWidth: 0, borderRightWidth: 0,
  }
  const style = { ...shared }
  if (top    !== undefined) { style.top    = top;    style.borderTopWidth    = 1 }
  if (bottom !== undefined) { style.bottom = bottom; style.borderBottomWidth = 1 }
  if (left   !== undefined) { style.left   = left;   style.borderLeftWidth   = 1 }
  if (right  !== undefined) { style.right  = right;  style.borderRightWidth  = 1 }
  return <div style={style} />
}

function SourceCard({ source, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ borderLeft: `1px solid ${C.accent}`, paddingLeft: '0.85rem', marginBottom: '1.2rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.25rem' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.48rem',
          color: C.text, letterSpacing: '0.12em',
          border: `1px solid ${C.border}`, padding: '1px 5px',
        }}>{source.id}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
          color: C.text, letterSpacing: '0.1em', fontWeight: 600,
        }}>{source.label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.44rem',
          color: C.textDim, letterSpacing: '0.08em', marginLeft: 'auto',
        }}>{source.date}</span>
      </div>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
        color: C.textDim, letterSpacing: '0.05em', lineHeight: 1.7, margin: 0,
      }}>{source.excerpt}</p>
    </motion.div>
  )
}

// ─── Widget principal ─────────────────────────────────────────────────────────

export default function CitationWidget() {
  const widgets      = useRimeStore((s) => s.widgets)
  const clearWidgets = useRimeStore((s) => s.clearWidgets)

  const data = widgets.citation
  if (!data) return null

  const conf = Math.round((data.confidence ?? 0) * 100)

  return (
    <AnimatePresence>
      <motion.div
        key="citation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
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
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)`,
        }} />

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          style={{
            borderBottom: `1px solid ${C.border}`,
            padding: '0.9rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
              color: C.textDim, letterSpacing: '0.18em',
            }}>[ RIME ]</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
              color: C.text, letterSpacing: '0.15em',
            }}>CITATION.MODE // SOURCE.SCAN</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.48rem',
              color: C.textFaint, letterSpacing: '0.1em',
            }}>SYS.RIME v1.0.0</span>
            <button
              onClick={clearWidgets}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                color: C.textDim, letterSpacing: '0.12em',
                background: 'none', border: `1px solid ${C.border}`,
                cursor: 'pointer', padding: '3px 10px', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.text}
              onMouseLeave={e => e.currentTarget.style.color = C.textDim}
            >
              [ CLOSE ]
            </button>
          </div>
        </motion.div>

        {/* ── CONTENU ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', zIndex: 2, minHeight: 0 }}>

          {/* ─ GAUCHE : mesh 3D ─ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{ position: 'relative', borderRight: `1px solid ${C.border}`, padding: '1rem' }}
          >
            <HudBracket top={8}    left={8} />
            <HudBracket top={8}    right={8} />
            <HudBracket bottom={8} left={8} />
            <HudBracket bottom={8} right={8} />

            <div style={{
              position: 'absolute', top: '1.4rem', left: '1.4rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.44rem',
              color: C.accent, letterSpacing: '0.14em', zIndex: 3,
            }}>
              SCAN ACTIVE
              <span style={{ marginLeft: '0.5rem', animation: 'blink 1s step-end infinite' }}>▮</span>
            </div>

            <div style={{
              position: 'absolute', bottom: '1.8rem', left: '1.6rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.42rem',
              color: C.textFaint, letterSpacing: '0.1em', lineHeight: 1.8,
            }}>0.357<br />0.085</div>

            <Canvas
              camera={{ position: [0, 0, 4], fov: 45 }}
              style={{ width: '100%', height: '100%', background: C.bg }}
            >
              <Suspense fallback={null}>
                <AircraftMesh />
              </Suspense>
            </Canvas>
          </motion.div>

          {/* ─ DROITE : sources ─ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            style={{ padding: '1.5rem 1.8rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ marginBottom: '1.4rem' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.48rem',
                color: C.textDim, letterSpacing: '0.18em', marginBottom: '0.3rem',
              }}>SUBJECT</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.95rem',
                color: C.text, letterSpacing: '0.12em', fontWeight: 600,
                textShadow: `0 0 20px ${C.shadow}`,
              }}>{data.subject}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.55rem',
                color: C.textDim, letterSpacing: '0.1em', marginTop: '0.2rem',
              }}>{data.title}</div>
              <div style={{ height: '1px', background: C.border, marginTop: '0.8rem' }} />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.44rem',
                color: C.textFaint, letterSpacing: '0.16em', marginBottom: '0.8rem',
              }}>SOURCES RÉFÉRENCÉES — {(data.sources ?? []).length} DOC.</div>

              {(data.sources ?? []).map((src, i) => (
                <SourceCard key={src.id} source={src} delay={0.85 + i * 0.12} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── FOOTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: '0.7rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '1.2rem', zIndex: 2,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.48rem',
            color: C.textDim, letterSpacing: '0.12em',
          }}>CONF.</span>
          <div style={{ flex: '0 0 140px', height: '2px', background: C.barBg, position: 'relative' }}>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: conf / 100 }}
              transition={{ delay: 1.0, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: 'absolute', inset: 0, background: C.bar,
                transformOrigin: 'left', boxShadow: `0 0 6px ${C.shadow}`,
              }}
            />
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.52rem',
            color: C.text, letterSpacing: '0.1em',
          }}>{conf}%</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.44rem',
            color: C.textFaint, letterSpacing: '0.1em', marginLeft: 'auto',
          }}>{data.timestamp}</span>
        </motion.div>

        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </motion.div>
    </AnimatePresence>
  )
}
