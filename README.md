# Water Spatial — Custom Bottle Studio

A 3D bottle configurator for a printed-label water bottle business. A customer picks
a style, types their names or brand, adjusts colours/fonts/size, optionally uploads a
logo — and sees the result on a bottle they can drag, spin and zoom in real time.

## Running it

```bash
npm install     # once
npm run dev     # opens http://localhost:5173
```

To publish:

```bash
npm run build   # outputs to dist/
```

`dist/` is a plain static folder — drop it on Netlify, Vercel, GitHub Pages, Hostinger,
or any web host. No server or database is needed.

## How it works

The bottle is **generated in code**, not loaded from a model file, which is why the
label always sits perfectly flush against the body at every size.

- `src/three/bottle.js` — the bottle silhouette (radius vs. height) and the meshes
  spun from it: shell, water, label band, cap, tamper ring. Change `SIZES` here to
  alter bottle proportions, or `OUTLINE` to reshape the bottle itself.
- `src/label/presets.js` — the six label designs. Each one owns its copy fields,
  colour palettes, default fonts and a `render()` that paints the artwork.
- `src/label/draw-utils.js` — shared drawing helpers (letter-spaced text,
  auto-fitting, leaf sprigs, seam handling).
- `src/components/Bottle.jsx` — paints the label to a canvas and wraps it on the mesh.
- `src/components/Viewer.jsx` — camera, lighting, studio reflections, drag controls.
- `src/components/Panel.jsx` — the customer-facing control panel.

The label artwork is drawn on a 2D canvas 2400 px wide, then wrapped around the
bottle. The canvas height is derived from the real circumference-to-band-height ratio
of the selected bottle, so artwork never stretches when the size changes.

### Designing in the label coordinate system

Inside a preset's `render(c, k)`, **`k.px` is 1% of the label height**. Use it for
every measurement (`14 * k.px`, not `140`) and the design will scale correctly across
the 330 ml, 500 ml and 1 L bottles.

The front of the bottle is the **centre** of the canvas (`k.W / 2`). `x = 0` and
`x = k.W` are the same point on the back seam — use the `atSeam()` helper to paint
anything that straddles it.

## Adding a new style

Append an object to `PRESETS` in `src/label/presets.js`. It needs:

| Key | What it does |
| --- | --- |
| `id`, `name`, `tagline`, `category` | Shown on the style card in the panel |
| `fields` | The text inputs shown to the customer (`key`, `label`, `placeholder`, `max`) |
| `defaults` | Starting copy for those fields |
| `palettes` | Colour presets — `bg`, `fg`, `accent`, `cap` |
| `fonts` | Default `display` and `body` font ids from `src/config/fonts.js` |
| `render(c, k)` | Paints the artwork |

It appears in the panel automatically — nothing else to wire up.

## Changing the branding

The studio's own name sits in `src/App.jsx` (the `.brand` block) and the page title in
`index.html`. Accent colours are the CSS variables at the top of `src/styles.css`.

## Not included yet

These were left out of this version and are each a small addition:

- **Enquiry / order form** — quantity, event date, contact details, submitting to
  email or WhatsApp.
- **Download preview image** — a "save this mockup as PNG" button for the customer.
  This is a few lines against the WebGL canvas, but the renderer must be created with
  `preserveDrawingBuffer: true` in `Viewer.jsx` for it to work.
- **Saving / sharing a design** — encoding the configuration into a shareable URL.

## Notes

- Fonts load from Google Fonts, so the first render of a label needs a connection.
  The label repaints itself once the real fonts arrive.
- Uploaded logos stay in the browser; nothing is sent anywhere.
