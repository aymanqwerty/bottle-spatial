import * as THREE from 'three'

/**
 * A generalised surface of revolution.
 *
 * THREE.LatheGeometry can only spin a circular cross-section, which rules out
 * square-edge bottles. This sweeps a silhouette around the Y axis using an
 * arbitrary closed cross-section instead, and adds two things the label depends
 * on:
 *
 *  - `u` follows **arc length** around the cross-section, not the polar angle.
 *    On a square bottle those differ sharply, and using the angle would squash
 *    the artwork into the corners and stretch it across the flats.
 *  - each silhouette point carries a `blend` (0 = full shape, 1 = circle) so the
 *    body can be square while the shoulder rounds off into a circular neck —
 *    which is what real square bottles do, since the cap is always round.
 *
 * Cross-section points are stored as Vector2 where **x is world X and y is
 * world Z**, matching LatheGeometry's convention that angle 0 lies on +Z.
 */

/** Calibrated so a circular cross-section reports a 0.44 front panel. */
const FRONT_CONE = 0.44 * Math.PI

export function buildCrossSection(cross, segments) {
  const points = []
  const n = cross?.type === 'superellipse' ? cross.n : 2

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    // |x|^n + |z|^n = 1, so n = 2 is a circle and larger n squares it off.
    const r =
      n === 2
        ? 1
        : (Math.abs(Math.cos(t)) ** n + Math.abs(Math.sin(t)) ** n) ** (-1 / n)
    points.push(new THREE.Vector2(r * Math.sin(t), r * Math.cos(t)))
  }

  // Normalise so the widest point of any cross-section sits at radius 1; the
  // silhouette radius then means the same thing whatever the shape.
  let max = 0
  for (const p of points) max = Math.max(max, p.length())
  if (max > 0) for (const p of points) p.divideScalar(max)

  const u = [0]
  let perimeter = 0
  for (let i = 1; i <= segments; i++) {
    perimeter += points[i].distanceTo(points[i - 1])
    u.push(perimeter)
  }
  if (perimeter > 0) for (let i = 0; i <= segments; i++) u[i] /= perimeter

  return { points, u, perimeter, front: frontFraction(points) }
}

/**
 * How much of the wrap reads as the "front panel" — the share of the perimeter
 * whose outward normal points roughly at the viewer. A flat-faced bottle has a
 * much narrower readable front than a cylinder, and the label presets size their
 * artwork against this.
 */
function frontFraction(points) {
  let front = 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const len = a.distanceTo(b)
    if (len === 0) continue
    total += len

    // Outward normal of this segment, flipped to face away from the axis.
    let nx = b.y - a.y
    let nz = -(b.x - a.x)
    const mx = (a.x + b.x) / 2
    const mz = (a.y + b.y) / 2
    if (nx * mx + nz * mz < 0) {
      nx = -nx
      nz = -nz
    }
    const angle = Math.acos(THREE.MathUtils.clamp(nz / Math.hypot(nx, nz), -1, 1))
    if (angle <= FRONT_CONE) front += len
  }
  return total > 0 ? front / total : 0.44
}

/**
 * Sweeps `profile` (an array of `{ r, y, blend }`, bottom to top) around the Y
 * axis. Returns a BufferGeometry with u = arc length around the section and
 * v = 0 at the first silhouette point.
 */
export function revolveGeometry(profile, cross, segments) {
  const shape = buildCrossSection(cross, segments)
  const circle = buildCrossSection({ type: 'circle' }, segments)
  const rows = profile.length
  const count = (segments + 1) * rows

  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const uvs = new Float32Array(count * 2)
  const index = []

  const at = (i, j) => i * rows + j

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j < rows; j++) {
      const p = profile[j]
      const b = p.blend ?? 0
      const sx = shape.points[i].x + (circle.points[i].x - shape.points[i].x) * b
      const sz = shape.points[i].y + (circle.points[i].y - shape.points[i].y) * b
      const k = at(i, j)
      positions[k * 3] = sx * p.r
      positions[k * 3 + 1] = p.y
      positions[k * 3 + 2] = sz * p.r
      uvs[k * 2] = shape.u[i]
      uvs[k * 2 + 1] = rows > 1 ? j / (rows - 1) : 0
    }
  }

  // Normals from finite differences on the vertex grid. The angular neighbours
  // wrap (index `segments` is a duplicate of index 0), so the seam gets
  // identical normals on both sides and stays invisible.
  const pa = new THREE.Vector3()
  const pb = new THREE.Vector3()
  const tTheta = new THREE.Vector3()
  const tProfile = new THREE.Vector3()
  const normal = new THREE.Vector3()

  for (let i = 0; i <= segments; i++) {
    const ip = i === segments ? 1 : i + 1
    const im = i === 0 ? segments - 1 : i - 1
    for (let j = 0; j < rows; j++) {
      const jp = Math.min(rows - 1, j + 1)
      const jm = Math.max(0, j - 1)

      tTheta.subVectors(
        pa.fromArray(positions, at(ip, j) * 3),
        pb.fromArray(positions, at(im, j) * 3),
      )
      tProfile.subVectors(
        pa.fromArray(positions, at(i, jp) * 3),
        pb.fromArray(positions, at(i, jm) * 3),
      )
      normal.crossVectors(tTheta, tProfile)

      if (normal.lengthSq() < 1e-12) {
        // Degenerate ring — the closed base or the sealed top.
        normal.set(0, j < rows / 2 ? -1 : 1, 0)
      } else {
        normal.normalize()
      }

      const k = at(i, j)
      normals[k * 3] = normal.x
      normals[k * 3 + 1] = normal.y
      normals[k * 3 + 2] = normal.z
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const a = at(i, j)
      const b = at(i + 1, j)
      const c = at(i + 1, j + 1)
      const d = at(i, j + 1)
      index.push(a, b, d, c, d, b)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.setIndex(index)
  return geo
}
