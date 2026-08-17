// Small 2D-canvas helpers shared by every label preset.
// All presets work in a 0-100 vertical unit system (`px` = 1% of label height)
// so a design keeps its proportions across the 330 ml / 500 ml / 1 L bottles.

export function setFont(c, weight, size, stack) {
  c.font = `${weight} ${size}px ${stack}`
}

export function line(c, x1, y1, x2, y2) {
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x2, y2)
  c.stroke()
}

export function measureTracked(c, text, tracking) {
  const chars = [...text]
  if (!chars.length) return 0
  let w = 0
  for (const ch of chars) w += c.measureText(ch).width + tracking
  return w - tracking
}

/** fillText with manual letter-spacing (works in every browser, unlike ctx.letterSpacing). */
export function drawTracked(c, text, x, y, tracking, align = 'center') {
  const chars = [...text]
  if (!chars.length) return
  const total = measureTracked(c, text, tracking)
  let sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x
  const prevAlign = c.textAlign
  c.textAlign = 'left'
  for (const ch of chars) {
    c.fillText(ch, sx, y)
    sx += c.measureText(ch).width + tracking
  }
  c.textAlign = prevAlign
}

/**
 * Shrinks the font until the tracked string fits `maxW`. Leaves the chosen font
 * active on the context and returns the size that was picked.
 */
export function fitTracked(c, text, stack, weight, maxW, startPx, minPx, trackRatio = 0) {
  let size = startPx
  while (size > minPx) {
    setFont(c, weight, size, stack)
    if (measureTracked(c, text, size * trackRatio) <= maxW) break
    size -= 1
  }
  setFont(c, weight, size, stack)
  return size
}

/** Draws `text` centred at `x`, auto-fitted to `maxW`, and returns its size. */
export function fitCentered(c, text, x, y, stack, weight, maxW, startPx, minPx, trackRatio = 0) {
  const size = fitTracked(c, text, stack, weight, maxW, startPx, minPx, trackRatio)
  drawTracked(c, text, x, y, size * trackRatio, 'center')
  return size
}

export function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + rr, y)
  c.arcTo(x + w, y, x + w, y + h, rr)
  c.arcTo(x + w, y + h, x, y + h, rr)
  c.arcTo(x, y + h, x, y, rr)
  c.arcTo(x, y, x + w, y, rr)
  c.closePath()
}

export function diamond(c, x, y, r) {
  c.beginPath()
  c.moveTo(x, y - r)
  c.lineTo(x + r * 0.62, y)
  c.lineTo(x, y + r)
  c.lineTo(x - r * 0.62, y)
  c.closePath()
}

/** A short sprig of leaves, mirrored with `dir` (-1 left, 1 right). */
export function sprig(c, x, y, len, dir, color) {
  c.save()
  c.strokeStyle = color
  c.fillStyle = color
  c.lineWidth = len * 0.03
  c.beginPath()
  c.moveTo(x, y)
  c.quadraticCurveTo(x + dir * len * 0.55, y - len * 0.16, x + dir * len, y - len * 0.34)
  c.stroke()
  for (let i = 1; i <= 5; i++) {
    const t = i / 6
    const px = x + dir * len * t
    const py = y - len * 0.34 * t * t - len * 0.08 * t
    const leaf = len * 0.2 * (1 - t * 0.45)
    for (const side of [-1, 1]) {
      c.save()
      c.translate(px, py)
      c.rotate(dir * (-0.5 + side * 0.75))
      c.beginPath()
      c.ellipse(leaf * 0.5, 0, leaf * 0.5, leaf * 0.2, 0, 0, Math.PI * 2)
      c.fill()
      c.restore()
    }
  }
  c.restore()
}

/**
 * The label texture wraps 360°, so anything sitting on the back seam has to be
 * painted twice — once at u=0 and once at u=1 — to appear continuous.
 */
export function atSeam(c, W, fn) {
  for (const offset of [0, W]) {
    c.save()
    c.translate(offset, 0)
    fn(c)
    c.restore()
  }
}

/** Draws an uploaded logo inside a box, preserving aspect ratio. */
export function drawLogo(c, img, cx, cy, maxW, maxH) {
  if (!img || !img.width || !img.height) return 0
  const scale = Math.min(maxW / img.width, maxH / img.height)
  const w = img.width * scale
  const h = img.height * scale
  c.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  return h
}

/** "Aarav & Anaya" -> "A&A";  "Blue Tokai Coffee" -> "BT" */
export function initials(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  if (raw.includes('&')) {
    const [a, b] = raw.split('&').map((s) => s.trim())
    return `${(a[0] || '').toUpperCase()}&${(b?.[0] || '').toUpperCase()}`
  }
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function withAlpha(hex, alpha) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) return `rgba(0,0,0,${alpha})`
  let h = m[1]
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('')
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Vertical sheen that sells the "printed on a curved surface" illusion. */
export function sheen(c, W, H, strength = 1) {
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, `rgba(0,0,0,${0.06 * strength})`)
  g.addColorStop(0.45, `rgba(255,255,255,${0.05 * strength})`)
  g.addColorStop(1, `rgba(0,0,0,${0.08 * strength})`)
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
}
