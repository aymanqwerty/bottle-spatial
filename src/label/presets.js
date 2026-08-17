import {
  atSeam,
  diamond,
  drawLogo,
  drawTracked,
  fitTracked,
  initials,
  line,
  measureTracked,
  roundRect,
  setFont,
  sheen,
  sprig,
  withAlpha,
} from './draw-utils'

/**
 * A label preset owns three things: the copy fields it asks the customer for,
 * the colour/type defaults it ships with, and a `render(c, k)` that paints the
 * full 360° wrap-around artwork onto a 2D canvas.
 *
 * Inside render():
 *   k.W / k.H  canvas size in device pixels
 *   k.px       1% of label height — every measurement is expressed in these
 *   k.colors   { bg, fg, accent }
 *   k.display / k.body   CSS font stacks
 *   k.v(key)   trimmed value of a copy field
 *   k.logo     HTMLImageElement or null
 *   k.front    share of the wrap that reads as the front panel — a square
 *              bottle shows far less of the label head-on than a cylinder, so
 *              artwork is sized against this rather than a fixed fraction
 *
 * The front of the bottle sits at the centre of the canvas (x = W/2); x = 0 and
 * x = W are the same point on the back seam.
 */

const upper = (s) => String(s || '').toUpperCase()

/** Draws auto-fitted tracked text and reports back how wide it ended up. */
function fitLine(c, text, cx, y, stack, weight, maxW, startPx, minPx, track = 0) {
  if (!text) return { size: 0, width: 0 }
  const size = fitTracked(c, text, stack, weight, maxW, startPx, minPx, track)
  const width = measureTracked(c, text, size * track)
  drawTracked(c, text, cx, y, size * track, 'center')
  return { size, width }
}

/** Repeats a tracked micro-caption across the whole wrap (used on band edges). */
function repeatStrip(c, text, y, stack, size, track, W, px) {
  if (!text) return
  setFont(c, 600, size, stack)
  const unit = measureTracked(c, text, size * track) + px * 10
  if (unit <= 0) return
  for (let x = unit / 2; x < W + unit; x += unit) {
    drawTracked(c, text, x, y, size * track, 'center')
  }
}

/** Deterministic noise so confetti/blobs don't reshuffle on every keystroke. */
function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const PRESETS = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'wedding-classic',
    name: 'Wedding Classic',
    tagline: 'Script names, gold rules, formal',
    category: 'Wedding',
    supportsLogo: true,
    logoHint: 'Monogram or crest',
    fonts: { display: 'great-vibes', body: 'montserrat' },
    fields: [
      { key: 'eyebrow', label: 'Top line', placeholder: 'The Wedding Of', max: 26 },
      { key: 'main', label: 'Names', placeholder: 'Aarav & Anaya', max: 34 },
      { key: 'sub', label: 'Date', placeholder: '12 · 02 · 2026', max: 26 },
      { key: 'foot', label: 'Venue / message', placeholder: 'Taj Palace, Jaipur', max: 34 },
    ],
    defaults: {
      eyebrow: 'The Wedding Of',
      main: 'Aarav & Anaya',
      sub: '12 · 02 · 2026',
      foot: 'Taj Palace, Jaipur',
    },
    palettes: [
      { name: 'Ivory & Gold', bg: '#f6f1e7', fg: '#3d3226', accent: '#b08d3f', cap: '#c8a24a' },
      { name: 'Blush & Rose', bg: '#f7ecec', fg: '#5b3b41', accent: '#c07d84', cap: '#d3a0a6' },
      { name: 'Sage & Cream', bg: '#eef1e8', fg: '#39432f', accent: '#7d8f63', cap: '#8ea172' },
      { name: 'Navy & Gold', bg: '#1c2b45', fg: '#f2ecdf', accent: '#cba95d', cap: '#c8a24a' },
    ],
    render(c, k) {
      const { W, H, px, colors, display, body, v, logo, front } = k
      const cx = W / 2
      const maxW = W * front

      c.fillStyle = colors.bg
      c.fillRect(0, 0, W, H)
      sheen(c, W, H)

      c.strokeStyle = colors.accent
      c.lineWidth = 1.3 * px
      line(c, 0, 5 * px, W, 5 * px)
      line(c, 0, 95 * px, W, 95 * px)
      c.lineWidth = 0.5 * px
      line(c, 0, 8.5 * px, W, 8.5 * px)
      line(c, 0, 91.5 * px, W, 91.5 * px)

      c.fillStyle = colors.accent
      if (logo) {
        drawLogo(c, logo, cx, 21 * px, maxW * 0.42, 17 * px)
      } else {
        setFont(c, 600, 6.5 * px, body)
        fitLine(c, upper(v('eyebrow')), cx, 25 * px, body, 600, maxW * 0.8, 6.5 * px, 3.5 * px, 0.34)
      }

      c.fillStyle = colors.fg
      fitLine(c, v('main'), cx, 60 * px, display, 400, maxW, 28 * px, 9 * px, 0.01)

      // ornament rule
      c.strokeStyle = colors.accent
      c.fillStyle = colors.accent
      c.lineWidth = 0.55 * px
      line(c, cx - maxW * 0.24, 72 * px, cx - 3.5 * px, 72 * px)
      line(c, cx + 3.5 * px, 72 * px, cx + maxW * 0.24, 72 * px)
      diamond(c, cx, 72 * px, 2.4 * px)
      c.fill()

      c.fillStyle = colors.fg
      fitLine(c, upper(v('sub')), cx, 83 * px, body, 500, maxW * 0.85, 6 * px, 3.5 * px, 0.3)
      c.fillStyle = colors.accent
      fitLine(c, upper(v('foot')), cx, 89.5 * px, body, 400, maxW * 0.85, 4.6 * px, 3 * px, 0.22)

      // back seam monogram
      const mono = initials(v('main'))
      atSeam(c, W, () => {
        c.strokeStyle = withAlpha(colors.accent, 0.75)
        c.lineWidth = 0.6 * px
        c.beginPath()
        c.arc(0, 50 * px, 15 * px, 0, Math.PI * 2)
        c.stroke()
        if (mono) {
          c.fillStyle = withAlpha(colors.accent, 0.85)
          setFont(c, 500, 12 * px, display)
          c.textAlign = 'center'
          c.fillText(mono, 0, 55 * px)
          c.textAlign = 'left'
        }
      })

      // quarter-point accents
      c.fillStyle = withAlpha(colors.accent, 0.6)
      for (const x of [W * 0.25, W * 0.75]) {
        for (const y of [42, 50, 58]) {
          diamond(c, x, y * px, 2.1 * px)
          c.fill()
        }
      }
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'wedding-floral',
    name: 'Wedding Botanical',
    tagline: 'Soft wash, leaf sprigs, romantic',
    category: 'Wedding',
    supportsLogo: true,
    logoHint: 'Monogram or crest',
    fonts: { display: 'parisienne', body: 'cormorant' },
    fields: [
      { key: 'eyebrow', label: 'Top line', placeholder: 'Together with their families', max: 34 },
      { key: 'main', label: 'Names', placeholder: 'Rohan & Meera', max: 34 },
      { key: 'sub', label: 'Date', placeholder: '9th November 2026', max: 28 },
      { key: 'foot', label: 'Venue / message', placeholder: 'With love & gratitude', max: 34 },
    ],
    defaults: {
      eyebrow: 'Together with their families',
      main: 'Rohan & Meera',
      sub: '9th November 2026',
      foot: 'With love & gratitude',
    },
    palettes: [
      { name: 'Blush Garden', bg: '#faeef0', fg: '#5d3a42', accent: '#a9757e', cap: '#d9a7ae' },
      { name: 'Eucalyptus', bg: '#eef3ee', fg: '#33443a', accent: '#6f8f74', cap: '#89a98d' },
      { name: 'Peach Bloom', bg: '#fdf0e6', fg: '#6a452f', accent: '#c98a5b', cap: '#e0a877' },
      { name: 'Lavender', bg: '#f1eef7', fg: '#443a5c', accent: '#8878ab', cap: '#a294c7' },
    ],
    render(c, k) {
      const { W, H, px, colors, display, body, v, logo, front } = k
      const cx = W / 2
      const maxW = W * front

      c.fillStyle = colors.bg
      c.fillRect(0, 0, W, H)

      // soft watercolour wash
      const rnd = seeded(7)
      for (let i = 0; i < 14; i++) {
        const x = rnd() * W
        const y = 12 * px + rnd() * 76 * px
        const r = (10 + rnd() * 22) * px
        const g = c.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, withAlpha(colors.accent, 0.1))
        g.addColorStop(1, withAlpha(colors.accent, 0))
        c.fillStyle = g
        c.beginPath()
        c.arc(x, y, r, 0, Math.PI * 2)
        c.fill()
      }
      sheen(c, W, H, 0.7)

      c.strokeStyle = withAlpha(colors.accent, 0.55)
      c.lineWidth = 0.5 * px
      line(c, 0, 7 * px, W, 7 * px)
      line(c, 0, 93 * px, W, 93 * px)

      if (logo) {
        drawLogo(c, logo, cx, 22 * px, maxW * 0.4, 16 * px)
      } else {
        c.fillStyle = withAlpha(colors.fg, 0.8)
        fitLine(c, v('eyebrow'), cx, 26 * px, body, 400, maxW * 0.85, 7 * px, 3.5 * px, 0.16)
      }

      c.fillStyle = colors.fg
      const main = fitLine(c, v('main'), cx, 60 * px, display, 400, maxW * 0.86, 28 * px, 9 * px, 0.01)

      const sprigLen = Math.min(maxW * 0.2, (maxW - main.width) * 0.42)
      if (sprigLen > 6 * px) {
        sprig(c, cx - main.width / 2 - 4 * px, 58 * px, sprigLen, -1, withAlpha(colors.accent, 0.85))
        sprig(c, cx + main.width / 2 + 4 * px, 58 * px, sprigLen, 1, withAlpha(colors.accent, 0.85))
      }

      c.fillStyle = colors.accent
      fitLine(c, upper(v('sub')), cx, 76 * px, body, 600, maxW * 0.8, 6 * px, 3.5 * px, 0.3)
      c.fillStyle = withAlpha(colors.fg, 0.75)
      fitLine(c, v('foot'), cx, 87 * px, body, 400, maxW * 0.85, 5.4 * px, 3 * px, 0.14)

      const mono = initials(v('main'))
      atSeam(c, W, () => {
        sprig(c, -9 * px, 58 * px, 12 * px, -1, withAlpha(colors.accent, 0.6))
        sprig(c, 9 * px, 58 * px, 12 * px, 1, withAlpha(colors.accent, 0.6))
        if (mono) {
          c.fillStyle = withAlpha(colors.accent, 0.8)
          setFont(c, 400, 14 * px, display)
          c.textAlign = 'center'
          c.fillText(mono, 0, 48 * px)
          c.textAlign = 'left'
        }
      })
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cafe-modern',
    name: 'Café Modern',
    tagline: 'Bold colour block, condensed caps',
    category: 'Café & Restaurant',
    supportsLogo: true,
    logoHint: 'Café / restaurant logo',
    fonts: { display: 'bebas', body: 'montserrat' },
    fields: [
      { key: 'main', label: 'Brand name', placeholder: 'BLUE TOKAI', max: 24 },
      { key: 'sub', label: 'Tagline', placeholder: 'Roasters & Coffee Bar', max: 30 },
      { key: 'eyebrow', label: 'Edge strip text', placeholder: 'Fresh · Pure · Chilled', max: 26 },
      { key: 'foot', label: 'Contact / website', placeholder: 'bluetokai.in', max: 30 },
    ],
    defaults: {
      main: 'BLUE TOKAI',
      sub: 'Roasters & Coffee Bar',
      eyebrow: 'Fresh · Pure · Chilled',
      foot: 'bluetokai.in',
    },
    palettes: [
      { name: 'Espresso', bg: '#2f2a26', fg: '#f4ece1', accent: '#d99a4e', cap: '#d99a4e' },
      { name: 'Deep Teal', bg: '#10514f', fg: '#effaf6', accent: '#7fd6c1', cap: '#0f6f6a' },
      { name: 'Terracotta', bg: '#b7563c', fg: '#fdf1e7', accent: '#f2c48b', cap: '#8f3f2c' },
      { name: 'Clean White', bg: '#f5f5f3', fg: '#1d1d1b', accent: '#e0533d', cap: '#1d1d1b' },
    ],
    render(c, k) {
      const { W, H, px, colors, display, body, v, logo, front } = k
      const cx = W / 2
      const maxW = W * front

      c.fillStyle = colors.bg
      c.fillRect(0, 0, W, H)
      sheen(c, W, H, 0.8)

      // edge strips carrying repeated micro-copy
      c.fillStyle = colors.accent
      c.fillRect(0, 0, W, 13 * px)
      c.fillRect(0, H - 13 * px, W, 13 * px)
      c.fillStyle = colors.bg
      repeatStrip(c, upper(v('eyebrow')), 8.6 * px, body, 5 * px, 0.42, W, px)
      repeatStrip(c, upper(v('eyebrow')), H - 4.6 * px, body, 5 * px, 0.42, W, px)

      const hasLogo = !!logo
      if (hasLogo) drawLogo(c, logo, cx, 33 * px, maxW * 0.5, 20 * px)

      c.fillStyle = colors.fg
      const mainY = hasLogo ? 62 * px : 56 * px
      const main = fitLine(c, upper(v('main')), cx, mainY, display, 400, maxW, 30 * px, 10 * px, 0.05)

      c.strokeStyle = colors.accent
      c.lineWidth = 1.1 * px
      const ruleW = Math.min(main.width + 6 * px, maxW)
      line(c, cx - ruleW / 2, mainY + 7 * px, cx + ruleW / 2, mainY + 7 * px)

      c.fillStyle = withAlpha(colors.fg, 0.9)
      fitLine(c, upper(v('sub')), cx, mainY + 17 * px, body, 500, maxW * 0.9, 6 * px, 3.4 * px, 0.34)
      c.fillStyle = colors.accent
      fitLine(c, upper(v('foot')), cx, 82 * px, body, 600, maxW * 0.8, 5 * px, 3 * px, 0.24)

      const mono = initials(v('main'))
      if (mono) {
        atSeam(c, W, () => {
          c.fillStyle = withAlpha(colors.fg, 0.13)
          setFont(c, 400, 42 * px, display)
          c.textAlign = 'center'
          c.fillText(mono, 0, 64 * px)
          c.textAlign = 'left'
        })
      }
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'hotel-luxe',
    name: 'Hotel Luxe',
    tagline: 'Dark ground, gold cartouche, letterspaced',
    category: 'Hotel & Banquet',
    supportsLogo: true,
    logoHint: 'Hotel crest or wordmark',
    fonts: { display: 'marcellus', body: 'montserrat' },
    fields: [
      { key: 'main', label: 'Hotel / brand name', placeholder: 'THE GRAND MERIDIAN', max: 26 },
      { key: 'sub', label: 'Sub line', placeholder: 'Hotels & Resorts', max: 28 },
      { key: 'eyebrow', label: 'Top mark', placeholder: 'Est. 1998', max: 20 },
      { key: 'foot', label: 'Bottom line', placeholder: 'Natural Mineral Water · 500 ml', max: 36 },
    ],
    defaults: {
      main: 'THE GRAND MERIDIAN',
      sub: 'Hotels & Resorts',
      eyebrow: 'Est. 1998',
      foot: 'Natural Mineral Water · 500 ml',
    },
    palettes: [
      { name: 'Midnight & Gold', bg: '#131a24', fg: '#f0e7d6', accent: '#c8a24a', cap: '#c8a24a' },
      { name: 'Obsidian', bg: '#161616', fg: '#efefef', accent: '#b9b9b9', cap: '#2b2b2b' },
      { name: 'Bordeaux', bg: '#3d1420', fg: '#f6e7dd', accent: '#d0a05e', cap: '#c8a24a' },
      { name: 'Forest', bg: '#132a22', fg: '#eaf1e9', accent: '#c2a565', cap: '#c8a24a' },
    ],
    render(c, k) {
      const { W, H, px, colors, display, body, v, logo, front } = k
      const cx = W / 2
      const maxW = W * front

      c.fillStyle = colors.bg
      c.fillRect(0, 0, W, H)
      sheen(c, W, H, 1.1)

      c.strokeStyle = withAlpha(colors.accent, 0.9)
      c.lineWidth = 1.1 * px
      line(c, 0, 4 * px, W, 4 * px)
      line(c, 0, 96 * px, W, 96 * px)
      c.lineWidth = 0.45 * px
      line(c, 0, 7 * px, W, 7 * px)
      line(c, 0, 93 * px, W, 93 * px)

      // front cartouche
      c.strokeStyle = withAlpha(colors.accent, 0.65)
      c.lineWidth = 0.5 * px
      const fw = maxW * 1.06
      c.strokeRect(cx - fw / 2, 13 * px, fw, 74 * px)

      if (logo) {
        drawLogo(c, logo, cx, 29 * px, maxW * 0.44, 17 * px)
      } else {
        const mono = initials(v('main'))
        c.strokeStyle = withAlpha(colors.accent, 0.8)
        c.lineWidth = 0.5 * px
        c.beginPath()
        c.arc(cx, 29 * px, 9.5 * px, 0, Math.PI * 2)
        c.stroke()
        if (mono) {
          c.fillStyle = colors.accent
          setFont(c, 400, 9 * px, display)
          c.textAlign = 'center'
          c.fillText(mono, cx, 32.4 * px)
          c.textAlign = 'left'
        }
      }

      c.fillStyle = colors.fg
      fitLine(c, upper(v('main')), cx, 54 * px, display, 400, maxW, 15 * px, 5 * px, 0.2)

      c.strokeStyle = colors.accent
      c.lineWidth = 0.6 * px
      line(c, cx - maxW * 0.16, 62 * px, cx + maxW * 0.16, 62 * px)

      c.fillStyle = colors.accent
      fitLine(c, upper(v('sub')), cx, 72 * px, body, 500, maxW * 0.85, 5.6 * px, 3.2 * px, 0.36)
      c.fillStyle = withAlpha(colors.fg, 0.75)
      fitLine(c, upper(v('eyebrow')), cx, 81 * px, body, 400, maxW * 0.7, 4.4 * px, 2.8 * px, 0.28)

      c.fillStyle = withAlpha(colors.fg, 0.65)
      fitLine(c, upper(v('foot')), cx, 90.5 * px, body, 400, W * 0.6, 4.2 * px, 2.6 * px, 0.26)

      atSeam(c, W, () => {
        c.strokeStyle = withAlpha(colors.accent, 0.5)
        c.lineWidth = 0.45 * px
        line(c, -2.5 * px, 20 * px, -2.5 * px, 80 * px)
        line(c, 2.5 * px, 20 * px, 2.5 * px, 80 * px)
        c.fillStyle = withAlpha(colors.accent, 0.8)
        diamond(c, 0, 50 * px, 4 * px)
        c.fill()
      })
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'corporate-minimal',
    name: 'Corporate Minimal',
    tagline: 'Clean sans, one accent bar, logo-first',
    category: 'Corporate & Events',
    supportsLogo: true,
    logoHint: 'Company logo (PNG with transparency works best)',
    fonts: { display: 'poppins', body: 'montserrat' },
    fields: [
      { key: 'main', label: 'Company / event name', placeholder: 'Northwind Systems', max: 28 },
      { key: 'sub', label: 'Sub line', placeholder: 'Annual Summit 2026', max: 30 },
      { key: 'eyebrow', label: 'Top line', placeholder: 'Welcome', max: 22 },
      { key: 'foot', label: 'Website / contact', placeholder: 'northwind.example', max: 32 },
    ],
    defaults: {
      main: 'Northwind Systems',
      sub: 'Annual Summit 2026',
      eyebrow: 'Welcome',
      foot: 'northwind.example',
    },
    palettes: [
      { name: 'Ice & Blue', bg: '#ffffff', fg: '#12233a', accent: '#1f6fd0', cap: '#1f6fd0' },
      { name: 'Graphite', bg: '#f1f2f4', fg: '#1b1d21', accent: '#4a4f57', cap: '#2b2e33' },
      { name: 'Emerald', bg: '#ffffff', fg: '#10261d', accent: '#1e8a63', cap: '#1e8a63' },
      { name: 'Ink', bg: '#101418', fg: '#f2f5f7', accent: '#4fb2e5', cap: '#1f6fd0' },
    ],
    render(c, k) {
      const { W, H, px, colors, display, body, v, logo, front } = k
      const cx = W / 2
      const maxW = W * front

      c.fillStyle = colors.bg
      c.fillRect(0, 0, W, H)
      sheen(c, W, H, 0.6)

      c.fillStyle = colors.accent
      c.fillRect(0, 0, W, 3.5 * px)
      c.fillRect(0, H - 3.5 * px, W, 3.5 * px)

      const hasLogo = !!logo
      if (hasLogo) {
        drawLogo(c, logo, cx, 30 * px, maxW * 0.55, 21 * px)
      } else {
        c.fillStyle = colors.accent
        fitLine(c, upper(v('eyebrow')), cx, 30 * px, body, 600, maxW * 0.7, 5.6 * px, 3.2 * px, 0.4)
      }

      c.fillStyle = colors.fg
      fitLine(c, v('main'), cx, 56 * px, display, 600, maxW, 17 * px, 6 * px, 0.02)

      c.fillStyle = colors.accent
      c.fillRect(cx - maxW * 0.05, 62 * px, maxW * 0.1, 1.1 * px)

      c.fillStyle = withAlpha(colors.fg, 0.78)
      fitLine(c, upper(v('sub')), cx, 74 * px, body, 500, maxW * 0.9, 5.6 * px, 3.2 * px, 0.3)
      c.fillStyle = colors.accent
      fitLine(c, upper(v('foot')), cx, 86 * px, body, 500, maxW * 0.85, 4.6 * px, 2.8 * px, 0.24)

      const mono = initials(v('main'))
      if (mono) {
        atSeam(c, W, () => {
          c.fillStyle = withAlpha(colors.accent, 0.16)
          setFont(c, 700, 34 * px, display)
          c.textAlign = 'center'
          c.fillText(mono, 0, 62 * px)
          c.textAlign = 'left'
        })
      }
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'party-fun',
    name: 'Party & Birthday',
    tagline: 'Confetti, bright card, playful',
    category: 'Party & Birthday',
    supportsLogo: true,
    logoHint: 'Photo or icon',
    fonts: { display: 'josefin', body: 'poppins' },
    fields: [
      { key: 'eyebrow', label: 'Occasion', placeholder: 'Happy Birthday', max: 24 },
      { key: 'main', label: 'Name', placeholder: 'Ishaan', max: 22 },
      { key: 'sub', label: 'Age / date', placeholder: 'Turning Seven', max: 26 },
      { key: 'foot', label: 'Message', placeholder: 'Thanks for celebrating with us', max: 36 },
    ],
    defaults: {
      eyebrow: 'Happy Birthday',
      main: 'Ishaan',
      sub: 'Turning Seven',
      foot: 'Thanks for celebrating with us',
    },
    palettes: [
      { name: 'Sunshine', bg: '#ffd23f', fg: '#3a2a06', accent: '#e2492d', cap: '#e2492d' },
      { name: 'Bubblegum', bg: '#ff9ec4', fg: '#4a1430', accent: '#7b3fa0', cap: '#7b3fa0' },
      { name: 'Sky', bg: '#6ec6f2', fg: '#0c2c40', accent: '#f2b705', cap: '#0f7fbf' },
      { name: 'Mint Pop', bg: '#8fe3c2', fg: '#0f3a2c', accent: '#ef6f6c', cap: '#ef6f6c' },
    ],
    render(c, k) {
      const { W, H, px, colors, display, body, v, logo, front } = k
      const cx = W / 2
      const maxW = W * front

      c.fillStyle = colors.bg
      c.fillRect(0, 0, W, H)

      const rnd = seeded(1337)
      for (let i = 0; i < 190; i++) {
        const x = rnd() * W
        const y = rnd() * H
        const s = (0.9 + rnd() * 2.2) * px
        c.save()
        c.translate(x, y)
        c.rotate(rnd() * Math.PI)
        c.fillStyle = withAlpha(rnd() > 0.5 ? colors.accent : colors.fg, 0.28)
        if (rnd() > 0.5) {
          c.beginPath()
          c.arc(0, 0, s * 0.6, 0, Math.PI * 2)
          c.fill()
        } else {
          c.fillRect(-s * 0.5, -s * 1.6, s, s * 3.2)
        }
        c.restore()
      }
      sheen(c, W, H, 0.7)

      // front card
      const cw = maxW * 1.12
      roundRect(c, cx - cw / 2, 14 * px, cw, 72 * px, 7 * px)
      c.fillStyle = 'rgba(255,255,255,0.92)'
      c.fill()
      c.strokeStyle = colors.accent
      c.lineWidth = 1 * px
      c.setLineDash([3 * px, 2.4 * px])
      c.stroke()
      c.setLineDash([])

      const hasLogo = !!logo
      if (hasLogo) drawLogo(c, logo, cx, 29 * px, maxW * 0.4, 15 * px)

      c.fillStyle = colors.accent
      if (!hasLogo) {
        fitLine(c, upper(v('eyebrow')), cx, 31 * px, body, 600, maxW * 0.85, 6.4 * px, 3.4 * px, 0.32)
      }

      c.fillStyle = colors.fg
      fitLine(c, v('main'), cx, 57 * px, display, 700, maxW, 22 * px, 7 * px, 0.03)

      c.fillStyle = colors.accent
      fitLine(c, upper(v('sub')), cx, 69 * px, body, 600, maxW * 0.85, 5.8 * px, 3.2 * px, 0.26)
      c.fillStyle = withAlpha('#1a1a1a', 0.6)
      fitLine(c, v('foot'), cx, 80 * px, body, 400, maxW * 0.95, 4.8 * px, 2.8 * px, 0.1)
    },
  },
]

export const presetById = (id) => PRESETS.find((p) => p.id === id) || PRESETS[0]
