import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three' 
import { streamlineVertexShader, streamlineFragmentShader } from './StreamlineShader'
import { useRimeStore } from '../../store/useRimeStore'

function StreamlineMesh() {
  const meshRef = useRef()
  const { size } = useThree()
  const isThinking = useRimeStore((s) => s.isThinking)

  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uIntensity:  { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) }, 
  }), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    mat.uniforms.uTime.value = clock.getElapsedTime()

    // Transition douce vers l'état thinking
    const target = isThinking ? 1.0 : 0.0
    mat.uniforms.uIntensity.value +=
      (target - mat.uniforms.uIntensity.value) * 0.03

    mat.uniforms.uResolution.value.set(size.width, size.height)
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={streamlineVertexShader}
        fragmentShader={streamlineFragmentShader}
        uniforms={uniforms}
        depthWrite={false} 
        depthTest={false}  
      />
    </mesh>
  )
}

export default function StreamlineCanvas({ style }) {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <StreamlineMesh />
    </Canvas>
  )
}