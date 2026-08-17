import * as THREE from 'three'

import { ROUND_FROM, ROUND_TO, SHAPES, outlineOf, shapeById } from './shapes'
import { buildCrossSection, revolveGeometry } from './revolve'

/**
 * The bottle is generated procedurally: a 2D silhouette (radius vs. height) is
 * swept around the Y axis through the shape's cross-section. The shell, water,
 * label band and cap are all derived from that one silhouette, which is why the
 * label sits flush against the body for every shape and size.
 *
 * World units: 1 unit ≈ 10 cm.
 */

export const SIZES = {
  330: { id: '330', label: '330 ml', note: 'Compact', H: 1.75, R: 0.29, neckR: 0.112 },
  500: { id: '500', label: '500 ml', note: 'Most popular', H: 2.15, R: 0.325, neckR: 0.122 },
  1000: { id: '1000', label: '1 litre', note: 'Table bottle', H: 2.7, R: 0.4, neckR: 0.132 },
}

export const SIZE_LIST = [SIZES[330], SIZES[500], SIZES[1000]]
export const SHAPE_LIST = SHAPES

const BODY_SEGMENTS = 128
const LABEL_SEGMENTS = 208
const PROFILE_SAMPLES = 260

const cache = new Map()
const keyOf = (shapeId, sizeId) => `${shapeId}|${sizeId}`

/** Smooth 0→1 ramp used to round a square body off into its circular neck. */
function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Inserts points so no gap in `[y0, y1]` exceeds `maxDy` — ribs need the density. */
function densify(pts, y0, y1, maxDy) {
  const out = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    out.push(a)
    const b = pts[i + 1]
    if (!b || b.y <= a.y) continue
    if ((a.y + b.y) / 2 < y0 || (a.y + b.y) / 2 > y1) continue
    const steps = Math.ceil((b.y - a.y) / maxDy)
    for (let s = 1; s < steps; s++) {
      const t = s / steps
      out.push({ r: a.r + (b.r - a.r) * t, y: a.y + (b.y - a.y) * t })
    }
  }
  return out
}

/**
 * Builds the silhouette for a shape/size pair.
 *
 * Returns both the ribbed `profile` and the smooth `envelope` it was cut from:
 * a wrap label bridges across ribs rather than sinking into them, so the label
 * band is built on the envelope.
 */
export function bottleProfile(shapeId, sizeId) {
  const key = keyOf(shapeId, sizeId)
  if (cache.has(key)) return cache.get(key)

  const shape = shapeById(shapeId)
  const size = SIZES[String(sizeId)] || SIZES[500]
  const R = size.R * shape.rScale
  const H = size.H * shape.hScale
  const neckR = size.neckR

  const ctrl = outlineOf(shape).map(
    (p) => new THREE.Vector3(p.r * (p.n ? neckR : R), p.y * H, 0),
  )
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', 0.5)

  let envelope = curve
    .getPoints(PROFILE_SAMPLES)
    .map((p) => ({ r: Math.max(0, p.x), y: Math.max(0, p.y) }))

  if (shape.ribs) {
    const { from, to, period } = shape.ribs
    envelope = densify(envelope, from * H, to * H, (period * H) / 12)
  }

  const withBlend = (p) => ({ ...p, blend: smoothstep(ROUND_FROM * H, ROUND_TO * H, p.y) })
  envelope = envelope.map(withBlend)

  let profile = envelope
  if (shape.ribs) {
    const { from, to, period, depth } = shape.ribs
    const y0 = from * H
    const y1 = to * H
    // Snap the period so a whole number of ribs fits and both ends land flush.
    const ribCount = Math.max(1, Math.round((y1 - y0) / (period * H)))
    const step = (y1 - y0) / ribCount
    profile = envelope.map((p) => {
      if (p.y < y0 || p.y > y1) return p
      const phase = ((p.y - y0) / step) * Math.PI * 2
      return { ...p, r: p.r * (1 - depth * (0.5 - 0.5 * Math.cos(phase))) }
    })
  }

  const value = { profile, envelope, R, H, neckR, shape }
  cache.set(key, value)
  return value
}

/** Linear interpolation of a silhouette's radius at a given height. */
export function radiusAtY(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    if (b.y <= a.y) continue
    if (y >= a.y && y <= b.y) return a.r + ((b.r - a.r) * (y - a.y)) / (b.y - a.y)
  }
  return pts[0].r
}

export function bottleMetrics(shapeId, sizeId) {
  const { envelope, R, H, neckR, shape } = bottleProfile(shapeId, sizeId)
  const size = SIZES[String(sizeId)] || SIZES[500]

  const capH = H * 0.062
  const capR = neckR * 1.24
  const totalH = H + capH * 0.45

  const bandY0 = H * shape.band[0]
  const bandY1 = H * shape.band[1]
  const bandR = radiusAtY(envelope, (bandY0 + bandY1) / 2)

  const section = buildCrossSection(shape.cross, LABEL_SEGMENTS)

  // Keep every bottle framed nicely while preserving a hint of real scale.
  const viewScale = (2.4 / totalH) * (totalH / 2.28) ** 0.25

  return {
    shapeId: shape.id,
    sizeId: size.id,
    label: size.label,
    R,
    H,
    neckR,
    capH,
    capR,
    totalH,
    bandY0,
    bandY1,
    bandR,
    // perimeter : band height — the aspect the label artwork is drawn at
    labelAspect: (section.perimeter * bandR) / (bandY1 - bandY0),
    // share of the wrap that reads as the readable front panel
    front: section.front,
    viewScale,
  }
}

export function bottleGeometry(shapeId, sizeId) {
  const { profile, shape } = bottleProfile(shapeId, sizeId)
  return revolveGeometry(profile, shape.cross, BODY_SEGMENTS)
}

/** The liquid: the same silhouette, inset by the wall thickness and capped off. */
export function waterGeometry(shapeId, sizeId) {
  const { profile, H, shape } = bottleProfile(shapeId, sizeId)
  const wall = 0.012
  const fillY = H * 0.735

  const pts = profile
    .filter((p) => p.y <= fillY)
    .map((p) => ({ ...p, r: Math.max(0, p.r - wall) }))
  pts.push({ r: Math.max(0, radiusAtY(profile, fillY) - wall), y: fillY, blend: 0 })
  pts.push({ r: 0, y: fillY, blend: 0 })

  return revolveGeometry(pts, shape.cross, 96)
}

/**
 * The label band. Built on evenly spaced heights so v runs 0→1 bottom to top,
 * and on the smooth envelope so it bridges ribs instead of sinking into them.
 */
export function labelGeometry(shapeId, sizeId, rows = 56) {
  const { envelope, shape } = bottleProfile(shapeId, sizeId)
  const m = bottleMetrics(shapeId, sizeId)

  const pts = []
  for (let i = 0; i <= rows; i++) {
    const y = m.bandY0 + ((m.bandY1 - m.bandY0) * i) / rows
    // blend is 0 across the whole band by construction, so the cross-section —
    // and therefore the arc-length UV — is constant up the label.
    pts.push({ r: radiusAtY(envelope, y) + 0.0035, y, blend: 0 })
  }
  return revolveGeometry(pts, shape.cross, LABEL_SEGMENTS)
}

/** Screw cap with vertical flutes — always round, whatever the body shape. */
export function capGeometry(shapeId, sizeId) {
  const m = bottleMetrics(shapeId, sizeId)
  const geo = new THREE.CylinderGeometry(m.capR, m.capR, m.capH, 96, 1, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = Math.hypot(v.x, v.z)
    if (r > 1e-4) {
      const k = 1 + 0.035 * Math.sin(Math.atan2(v.z, v.x) * 24)
      pos.setXYZ(i, v.x * k, v.y, v.z * k)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

export function tamperRingGeometry(shapeId, sizeId) {
  const m = bottleMetrics(shapeId, sizeId)
  return new THREE.CylinderGeometry(m.capR * 0.97, m.capR * 0.97, m.capH * 0.2, 64, 1, false)
}

/**
 * SVG paths for the shape picker: a real front silhouette and a real top-down
 * cross-section, both generated from the same geometry the viewer uses.
 */
export function shapePreview(shapeId, w = 34, h = 58) {
  const { profile, H } = bottleProfile(shapeId, '500')
  const m = bottleMetrics(shapeId, '500')
  const maxR = Math.max(...profile.map((p) => p.r), m.capR)
  const top = H + m.capH * 0.5
  const sx = (r) => w / 2 + (r / maxR) * (w / 2)
  const sy = (y) => h - (y / top) * h

  const right = profile.map((p) => `${sx(p.r).toFixed(2)},${sy(p.y).toFixed(2)}`)
  const left = [...profile].reverse().map((p) => `${sx(-p.r).toFixed(2)},${sy(p.y).toFixed(2)}`)
  const capTop = sy(H + m.capH * 0.45)
  const capY = sy(H - m.capH)
  const capX = sx(m.capR)

  const silhouette =
    `M ${right.join(' L ')} ` +
    `L ${capX.toFixed(2)},${capY.toFixed(2)} L ${capX.toFixed(2)},${capTop.toFixed(2)} ` +
    `L ${sx(-m.capR).toFixed(2)},${capTop.toFixed(2)} L ${sx(-m.capR).toFixed(2)},${capY.toFixed(2)} ` +
    `L ${left.join(' L ')} Z`

  const section = buildCrossSection(shapeById(shapeId).cross, 64)
  const rr = 9
  const sectionPath =
    'M ' +
    section.points
      .map((p) => `${(11 + p.x * rr).toFixed(2)},${(11 + p.y * rr).toFixed(2)}`)
      .join(' L ') +
    ' Z'

  return { silhouette, section: sectionPath }
}
