import * as THREE from 'three'

/**
 * The bottle is generated procedurally: a 2D silhouette (radius vs. height) is
 * spun around the Y axis with LatheGeometry. Everything — the shell, the water
 * inside, and the label band — is derived from that one silhouette, which is
 * why the label sits perfectly flush against the body at every size.
 *
 * World units: 1 unit ≈ 10 cm.
 */

export const SIZES = {
  330: { id: '330', label: '330 ml', note: 'Compact', H: 1.75, R: 0.29, neckR: 0.112 },
  500: { id: '500', label: '500 ml', note: 'Most popular', H: 2.15, R: 0.325, neckR: 0.122 },
  1000: { id: '1000', label: '1 litre', note: 'Table bottle', H: 2.7, R: 0.4, neckR: 0.132 },
}

export const SIZE_LIST = [SIZES[330], SIZES[500], SIZES[1000]]

// Label band, as a fraction of total bottle height.
const BAND_BOTTOM = 0.235
const BAND_TOP = 0.615

// Silhouette control points as [radius factor, height factor]. `n` marks a point
// measured against the neck radius rather than the body radius.
//
// The straight barrel carries redundant collinear points on purpose: a
// Catmull-Rom spline left to span it in one long segment overshoots outward and
// bows the barrel — which would in turn bow the label wrapped around it.
const OUTLINE = [
  { r: 0.0, y: 0.0 },
  { r: 0.55, y: 0.0 },
  { r: 0.8, y: 0.004 },
  { r: 0.93, y: 0.014 },
  { r: 0.985, y: 0.03 },
  { r: 1.0, y: 0.048 },
  { r: 1.0, y: 0.075 },
  { r: 0.992, y: 0.088 },
  { r: 0.955, y: 0.105 }, // grip groove
  { r: 0.992, y: 0.122 },
  { r: 1.0, y: 0.138 },
  { r: 1.0, y: 0.17 },
  { r: 0.992, y: 0.184 },
  { r: 0.962, y: 0.2 }, // grip groove
  { r: 0.992, y: 0.216 },
  { r: 1.0, y: 0.232 },
  { r: 1.0, y: 0.3 },
  { r: 1.0, y: 0.4 },
  { r: 1.0, y: 0.5 },
  { r: 1.0, y: 0.58 },
  { r: 1.0, y: 0.64 },
  { r: 0.985, y: 0.672 },
  { r: 0.92, y: 0.712 }, // shoulder
  { r: 0.8, y: 0.756 },
  { r: 0.6, y: 0.8 },
  { r: 0.462, y: 0.836 },
  { r: 1.1, y: 0.862, n: true },
  { r: 1.05, y: 0.884, n: true },
  { r: 1.0, y: 0.9, n: true },
  { r: 1.0, y: 0.908, n: true },
  { r: 1.22, y: 0.912, n: true }, // neck support ring
  { r: 1.22, y: 0.924, n: true },
  { r: 1.0, y: 0.93, n: true },
  { r: 1.0, y: 0.946, n: true }, // tamper-band zone
  { r: 1.06, y: 0.96, n: true }, // thread
  { r: 1.02, y: 0.985, n: true },
  { r: 1.02, y: 1.0, n: true },
  { r: 0.86, y: 1.0, n: true }, // lip
  { r: 0.86, y: 0.988, n: true },
  { r: 0.0, y: 0.988 },
]

/** Cached silhouette polyline (Vector2 list, x = radius, y = height). */
const profileCache = new Map()

export function bottleProfile(sizeId) {
  const key = String(sizeId)
  if (profileCache.has(key)) return profileCache.get(key)

  const s = SIZES[key] || SIZES[500]
  const ctrl = OUTLINE.map(
    (p) => new THREE.Vector3(p.r * (p.n ? s.neckR : s.R), p.y * s.H, 0),
  )
  // Centripetal parameterisation keeps the tight neck rings from overshooting.
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal', 0.5)
  const pts = curve
    .getPoints(260)
    .map((p) => new THREE.Vector2(Math.max(0, p.x), Math.max(0, p.y)))

  profileCache.set(key, pts)
  return pts
}

/** Linear interpolation of the silhouette radius at a given height. */
export function radiusAtY(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    if (b.y <= a.y) continue
    if (y >= a.y && y <= b.y) {
      return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y)
    }
  }
  return pts[0].x
}

export function bottleMetrics(sizeId) {
  const s = SIZES[String(sizeId)] || SIZES[500]
  const capH = s.H * 0.062
  const capR = s.neckR * 1.24
  const totalH = s.H + capH * 0.45
  const bandY0 = s.H * BAND_BOTTOM
  const bandY1 = s.H * BAND_TOP
  const bandR = radiusAtY(bottleProfile(s.id), (bandY0 + bandY1) / 2)

  // Keep every size framed nicely while preserving a hint of real scale.
  const fit = 2.4 / totalH
  const relative = (totalH / 2.28) ** 0.25

  return {
    ...s,
    capH,
    capR,
    totalH,
    bandY0,
    bandY1,
    bandR,
    // circumference : band height — the aspect the label artwork is drawn at
    labelAspect: (2 * Math.PI * bandR) / (bandY1 - bandY0),
    viewScale: fit * relative,
  }
}

// LatheGeometry's own normals are computed from the silhouette tangents and are
// identical either side of the wrap seam, so they are left alone — running
// computeVertexNormals() here would introduce a visible seam.
export function bottleGeometry(sizeId, radialSegments = 128) {
  return new THREE.LatheGeometry(bottleProfile(sizeId), radialSegments)
}

/** The liquid: the same silhouette, inset by the wall thickness and capped off. */
export function waterGeometry(sizeId, radialSegments = 96) {
  const m = bottleMetrics(sizeId)
  const wall = 0.012
  const fillY = m.H * 0.735
  const pts = bottleProfile(sizeId)
    .filter((p) => p.y <= fillY)
    .map((p) => new THREE.Vector2(Math.max(0, p.x - wall), p.y))
  pts.push(new THREE.Vector2(Math.max(0, radiusAtY(bottleProfile(sizeId), fillY) - wall), fillY))
  pts.push(new THREE.Vector2(0, fillY))

  return new THREE.LatheGeometry(pts, radialSegments)
}

/**
 * The label band. Because it is lathed from evenly spaced heights, LatheGeometry
 * hands us exactly the UVs we want: u wraps 0→1 around the bottle, v runs 0→1
 * from the bottom of the band to the top.
 */
export function labelGeometry(sizeId, radialSegments = 192, rows = 56) {
  const m = bottleMetrics(sizeId)
  const profile = bottleProfile(sizeId)
  const pts = []
  for (let i = 0; i <= rows; i++) {
    const y = m.bandY0 + ((m.bandY1 - m.bandY0) * i) / rows
    pts.push(new THREE.Vector2(radiusAtY(profile, y) + 0.0035, y))
  }
  return new THREE.LatheGeometry(pts, radialSegments)
}

/** Screw cap with vertical flutes, plus its tamper-evident ring. */
export function capGeometry(sizeId) {
  const m = bottleMetrics(sizeId)
  const geo = new THREE.CylinderGeometry(m.capR, m.capR, m.capH, 96, 1, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = Math.hypot(v.x, v.z)
    if (r > 1e-4) {
      const theta = Math.atan2(v.z, v.x)
      const k = 1 + 0.035 * Math.sin(theta * 24)
      pos.setXYZ(i, v.x * k, v.y, v.z * k)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

export function tamperRingGeometry(sizeId) {
  const m = bottleMetrics(sizeId)
  return new THREE.CylinderGeometry(m.capR * 0.97, m.capR * 0.97, m.capH * 0.2, 64, 1, false)
}
