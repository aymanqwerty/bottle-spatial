import { useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'

import Bottle from './Bottle'

/**
 * A neutral studio environment baked from three's built-in RoomEnvironment.
 * Doing it locally (rather than fetching an HDRI) keeps the reflections on the
 * PET shell working with no network dependency.
 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = target.texture
    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return null
}

function Rig({ autoRotate, resetSignal }) {
  const controls = useRef()

  useEffect(() => {
    if (resetSignal > 0) controls.current?.reset()
  }, [resetSignal])

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 1.2, 0]}
      enablePan={false}
      enableDamping
      dampingFactor={0.055}
      rotateSpeed={0.85}
      zoomSpeed={0.7}
      minDistance={3.4}
      maxDistance={9}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI * 0.86}
      autoRotate={autoRotate}
      autoRotateSpeed={0.9}
    />
  )
}

export default function Viewer({ design, autoRotate, resetSignal }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.55, 6.2], fov: 28, near: 0.1, far: 100 }}
    >
      <StudioEnvironment />

      <ambientLight intensity={0.35} />
      <directionalLight position={[4.5, 7, 5]} intensity={2.1} />
      <directionalLight position={[-5, 3.5, 2.5]} intensity={0.65} />
      <directionalLight position={[-2.5, 4.5, -5.5]} intensity={1.5} color="#dceaf5" />

      <Bottle design={design} />

      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.42}
        scale={6}
        blur={2.4}
        far={2.6}
        resolution={1024}
        color="#16222e"
      />

      <Rig autoRotate={autoRotate} resetSignal={resetSignal} />
    </Canvas>
  )
}
