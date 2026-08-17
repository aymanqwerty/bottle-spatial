// Font catalogue used both by the on-screen pickers and by the 2D canvas that
// paints the label texture. `stack` is what actually goes into ctx.font, so it
// always carries a system fallback in case the Google font has not loaded yet.

export const FONTS = [
  { id: 'great-vibes', name: 'Great Vibes', kind: 'Script', stack: '"Great Vibes", "Segoe Script", cursive' },
  { id: 'parisienne', name: 'Parisienne', kind: 'Script', stack: '"Parisienne", "Segoe Script", cursive' },
  { id: 'playfair', name: 'Playfair Display', kind: 'Serif', stack: '"Playfair Display", Georgia, serif' },
  { id: 'cormorant', name: 'Cormorant Garamond', kind: 'Serif', stack: '"Cormorant Garamond", Garamond, serif' },
  { id: 'marcellus', name: 'Marcellus', kind: 'Serif', stack: '"Marcellus", Georgia, serif' },
  { id: 'montserrat', name: 'Montserrat', kind: 'Sans', stack: '"Montserrat", Arial, sans-serif' },
  { id: 'poppins', name: 'Poppins', kind: 'Sans', stack: '"Poppins", Arial, sans-serif' },
  { id: 'josefin', name: 'Josefin Sans', kind: 'Sans', stack: '"Josefin Sans", Arial, sans-serif' },
  { id: 'bebas', name: 'Bebas Neue', kind: 'Display', stack: '"Bebas Neue", Impact, sans-serif' },
  { id: 'oswald', name: 'Oswald', kind: 'Display', stack: '"Oswald", Impact, sans-serif' },
]

export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[2]

/**
 * Canvas text silently falls back to a system font if the webfont has not been
 * fetched yet, so the label must wait for the real faces before it is painted.
 */
export function ensureFonts(ids) {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve()
  const jobs = []
  for (const id of ids) {
    const { name } = fontById(id)
    for (const weight of [300, 400, 600, 700]) {
      jobs.push(document.fonts.load(`${weight} 100px "${name}"`).catch(() => {}))
    }
  }
  return Promise.all(jobs)
}
