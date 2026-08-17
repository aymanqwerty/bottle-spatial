import { fontById } from '../config/fonts'
import { presetById } from './presets'

const TEXTURE_WIDTH = 2400

/**
 * Paints the full wrap-around artwork into `canvas`.
 *
 * `aspect` is the real perimeter / band-height ratio of the bottle the label is
 * going onto — matching the canvas to it is what stops the artwork from looking
 * stretched once it is wrapped around the mesh. `front` is the share of that
 * wrap the customer actually sees head-on.
 */
export function renderLabel(canvas, { presetId, values, colors, fonts, logo, aspect, front }) {
  const preset = presetById(presetId)
  const W = TEXTURE_WIDTH
  const H = Math.max(320, Math.round(W / aspect))

  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W
    canvas.height = H
  }

  const c = canvas.getContext('2d')
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, W, H)
  c.textBaseline = 'alphabetic'
  c.textAlign = 'left'
  c.lineJoin = 'round'

  const k = {
    W,
    H,
    px: H / 100,
    colors,
    display: fontById(fonts.display).stack,
    body: fontById(fonts.body).stack,
    logo,
    front: front ?? 0.44,
    v: (key) => String(values[key] ?? '').trim(),
  }

  c.save()
  preset.render(c, k)
  c.restore()

  return { width: W, height: H }
}
