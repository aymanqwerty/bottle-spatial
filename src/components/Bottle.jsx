import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

import {
  bottleGeometry,
  bottleMetrics,
  capGeometry,
  labelGeometry,
  tamperRingGeometry,
  waterGeometry,
} from '../three/bottle'
import { useDisposable } from '../three/useDisposable'
import { renderLabel } from '../label/renderLabel'
import { ensureFonts } from '../config/fonts'

export default function Bottle({ design }) {
  const { shapeId, sizeId, presetId, values, colors, fonts, logo, capColor, finish } = design
  const gl = useThree((s) => s.gl)

  const metrics = useMemo(() => bottleMetrics(shapeId, sizeId), [shapeId, sizeId])

  const shellGeo = useDisposable(() => bottleGeometry(shapeId, sizeId), [shapeId, sizeId])
  const waterGeo = useDisposable(() => waterGeometry(shapeId, sizeId), [shapeId, sizeId])
  const labelGeo = useDisposable(() => labelGeometry(shapeId, sizeId), [shapeId, sizeId])
  const capGeo = useDisposable(() => capGeometry(shapeId, sizeId), [shapeId, sizeId])
  const ringGeo = useDisposable(() => tamperRingGeometry(shapeId, sizeId), [shapeId, sizeId])

  // ── label texture ────────────────────────────────────────────────────────
  const canvas = useMemo(() => document.createElement('canvas'), [])
  const texture = useDisposable(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    t.anisotropy = gl.capabilities.getMaxAnisotropy()
    return t
  }, [canvas, gl])

  useEffect(() => {
    let alive = true
    const paint = () => {
      if (!alive) return
      renderLabel(canvas, {
        presetId,
        values,
        colors,
        fonts,
        logo,
        aspect: metrics.labelAspect,
        front: metrics.front,
      })
      texture.needsUpdate = true
    }
    // Draw immediately so typing feels instant, then repaint once the real
    // webfonts are guaranteed to be resident.
    paint()
    ensureFonts([fonts.display, fonts.body]).then(paint)
    return () => {
      alive = false
    }
  }, [canvas, texture, presetId, values, colors, fonts, logo, metrics.labelAspect, metrics.front])

  const glossy = finish === 'glossy'

  return (
    <group scale={metrics.viewScale}>
      {/* liquid — deliberately opaque so it still shows through the transmissive shell */}
      <mesh geometry={waterGeo}>
        <meshPhysicalMaterial
          color="#cfeaf7"
          roughness={0.07}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          ior={1.33}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* PET shell */}
      <mesh geometry={shellGeo} renderOrder={2}>
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1}
          thickness={0.28}
          roughness={0.045}
          metalness={0}
          ior={1.46}
          clearcoat={0.7}
          clearcoatRoughness={0.08}
          envMapIntensity={1.3}
          transparent
          attenuationColor="#d8eef7"
          attenuationDistance={2.4}
        />
      </mesh>

      {/* printed wrap label — rotated so the artwork's centre faces the camera */}
      <mesh geometry={labelGeo} rotation-y={Math.PI} renderOrder={1}>
        <meshStandardMaterial
          map={texture}
          roughness={glossy ? 0.22 : 0.78}
          metalness={0}
          envMapIntensity={glossy ? 1.15 : 0.55}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* cap */}
      <group position-y={metrics.H - metrics.capH * 0.5 + metrics.capH * 0.06}>
        <mesh geometry={capGeo}>
          <meshStandardMaterial color={capColor} roughness={0.36} metalness={0.05} envMapIntensity={1} />
        </mesh>
      </group>
      <mesh
        geometry={ringGeo}
        position-y={metrics.H - metrics.capH * 1.12}
      >
        <meshStandardMaterial color={capColor} roughness={0.42} metalness={0.05} envMapIntensity={0.9} />
      </mesh>
    </group>
  )
}
