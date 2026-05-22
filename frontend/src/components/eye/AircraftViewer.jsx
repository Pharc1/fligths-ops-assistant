import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Vector3 } from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

function Aircraft() {
  const geometry = useLoader(STLLoader, '/747-400.stl')
  const ref = useRef()

  const scale = useMemo(() => {
    geometry.computeBoundingBox()
    geometry.center()
    const size = new Vector3()
    geometry.boundingBox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? 2.05 / maxDim : 1
  }, [geometry])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.12
  })

  return (
    <mesh ref={ref} geometry={geometry} scale={scale} rotation={[Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#c8c0ad" roughness={0.68} metalness={0.22} />
    </mesh>
  )
}

function FallbackPlane() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4
  })
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.8, 0.12, 0.6]} />
      <meshStandardMaterial color="#a79d87" wireframe />
    </mesh>
  )
}

export default function AircraftViewer({ height = 140 }) {
  const fullHeight = height === '100%'

  return (
    <div
      style={{
        width: '100%',
        height: fullHeight ? '100%' : height,
        position: fullHeight ? 'absolute' : 'relative',
        inset: fullHeight ? 0 : 'auto',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.15], fov: 34 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.58} />
        <directionalLight position={[3, 4, 3]} intensity={1.15} color="#fff8f0" />
        <directionalLight position={[-2, -2, -1]} intensity={0.2} color="#d6c59b" />

        <Suspense fallback={<FallbackPlane />}>
          <Aircraft />
        </Suspense>
      </Canvas>
    </div>
  )
}
