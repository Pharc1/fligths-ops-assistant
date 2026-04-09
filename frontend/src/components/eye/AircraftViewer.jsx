import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { Vector3 } from 'three'

// ─── Mesh STL auto-centré + rotation lente ────────────────────────────────────
function Aircraft() {
  const geo = useLoader(STLLoader, '/747-400.stl')
  const ref = useRef()

  // Centre + calcule l'échelle depuis les attributs de position directement
  const scale = useMemo(() => {
    geo.computeBoundingBox()
    geo.center()
    const size = new Vector3()
    geo.boundingBox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? 1.2 / maxDim : 1
  }, [geo])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.18
  })

  return (
    <mesh ref={ref} geometry={geo} scale={scale} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#b0aa9e" roughness={0.72} metalness={0.18} />
    </mesh>
  )
}

// ─── Fallback pendant le chargement STL ──────────────────────────────────────
function FallbackPlane() {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.4 })
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.6, 0.12, 0.6]} />
      <meshStandardMaterial color="#888" wireframe />
    </mesh>
  )
}

// ─── Canvas exporté ───────────────────────────────────────────────────────────
export default function AircraftViewer({ height = 140 }) {
  return (
    <div style={{ width: '100%', height: height === '100%' ? '100%' : height, position: height === '100%' ? 'absolute' : 'relative', inset: height === '100%' ? 0 : 'auto' }}>
      <Canvas
        camera={{ position: [0, 0, 2.6], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[3, 4, 3]} intensity={1.1} color="#fff8f0" />
        <directionalLight position={[-2, -2, -1]} intensity={0.25} color="#a0c0e0" />

        <Suspense fallback={<FallbackPlane />}>
          <Aircraft />
        </Suspense>
      </Canvas>
    </div>
  )
}
