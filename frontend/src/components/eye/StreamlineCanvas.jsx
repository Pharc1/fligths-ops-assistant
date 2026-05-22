import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRimeStore } from '../../store/useRimeStore'
import { streamlineFragmentShader, streamlineVertexShader } from './StreamlineShader'

function StreamlineMesh() {
  const meshRef = useRef()
  const { size } = useThree()
  const isThinking = useRimeStore((state) => state.isThinking)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
  }), [size.width, size.height])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const material = meshRef.current.material
    material.uniforms.uTime.value = clock.getElapsedTime()

    const target = isThinking ? 1.0 : 0.0
    material.uniforms.uIntensity.value += (target - material.uniforms.uIntensity.value) * 0.03
    material.uniforms.uResolution.value.set(size.width, size.height)
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
