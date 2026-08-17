/**
 * Bottle shape catalogue.
 *
 * Each shape supplies a body silhouette (bottom up to the shoulder), a
 * cross-section, and how tall/wide it is relative to the nominal size. Every
 * body ends at `0.462R @ 0.836H` so the shared PCO neck finish below can be
 * appended unchanged — real bottles differ in the body, not the neck.
 *
 * Radii are fractions of the body radius R; points marked `n: true` are
 * fractions of the neck radius instead. Heights are fractions of H.
 *
 * Straight sections carry redundant collinear points on purpose: a Catmull-Rom
 * spline left to span a long run overshoots outward and bows the barrel, which
 * would bow the label wrapped around it.
 */

const NECK = [
  { r: 1.1, y: 0.862, n: true },
  { r: 1.05, y: 0.884, n: true },
  { r: 1.0, y: 0.9, n: true },
  { r: 1.0, y: 0.908, n: true },
  { r: 1.22, y: 0.912, n: true }, // support ring
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

/** Where the body stops being square and starts rounding into the neck. */
export const ROUND_FROM = 0.72
export const ROUND_TO = 0.86

const CIRCLE = { type: 'circle' }

export const SHAPES = [
  {
    id: 'classic',
    name: 'Classic Round',
    note: 'Round · grip grooves',
    cross: CIRCLE,
    rScale: 1,
    hScale: 1,
    band: [0.235, 0.615],
    body: [
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
      { r: 0.92, y: 0.712 },
      { r: 0.8, y: 0.756 },
      { r: 0.6, y: 0.8 },
      { r: 0.462, y: 0.836 },
    ],
  },

  {
    id: 'cylinder',
    name: 'Smooth Cylinder',
    note: 'Round · clean straight wall',
    cross: CIRCLE,
    rScale: 0.96,
    hScale: 1.06,
    band: [0.2, 0.6],
    body: [
      { r: 0.0, y: 0.0 },
      { r: 0.52, y: 0.0 },
      { r: 0.78, y: 0.004 },
      { r: 0.92, y: 0.015 },
      { r: 0.98, y: 0.034 },
      { r: 1.0, y: 0.056 },
      { r: 1.0, y: 0.14 },
      { r: 1.0, y: 0.28 },
      { r: 1.0, y: 0.42 },
      { r: 1.0, y: 0.56 },
      { r: 1.0, y: 0.66 },
      { r: 0.99, y: 0.69 },
      { r: 0.97, y: 0.72 },
      { r: 0.93, y: 0.75 },
      { r: 0.86, y: 0.776 },
      { r: 0.75, y: 0.798 },
      { r: 0.6, y: 0.818 },
      { r: 0.462, y: 0.836 },
    ],
  },

  {
    id: 'square',
    name: 'Square Edge',
    note: 'Square section · crisp shoulder',
    cross: { type: 'superellipse', n: 4.2 },
    rScale: 1.05,
    hScale: 1.1,
    band: [0.185, 0.66],
    body: [
      { r: 0.0, y: 0.0 },
      { r: 0.55, y: 0.0 },
      { r: 0.85, y: 0.004 },
      { r: 0.96, y: 0.013 },
      { r: 0.995, y: 0.026 },
      { r: 1.0, y: 0.042 },
      { r: 1.0, y: 0.15 },
      { r: 1.0, y: 0.3 },
      { r: 1.0, y: 0.45 },
      { r: 1.0, y: 0.6 },
      { r: 1.0, y: 0.7 },
      { r: 1.0, y: 0.735 },
      { r: 0.985, y: 0.755 },
      { r: 0.94, y: 0.775 },
      { r: 0.86, y: 0.795 },
      { r: 0.72, y: 0.816 },
      { r: 0.462, y: 0.836 },
    ],
  },

  {
    id: 'ribbed',
    name: 'Ribbed',
    note: 'Round · ribbed wall',
    cross: CIRCLE,
    rScale: 1.04,
    hScale: 0.96,
    band: [0.22, 0.58],
    // The label bridges the ribs rather than sinking into them, so it is built
    // on the smooth envelope radius — which is what a wrap label really does.
    ribs: { from: 0.07, to: 0.63, period: 0.0335, depth: 0.055 },
    smoothLabel: true,
    body: [
      { r: 0.0, y: 0.0 },
      { r: 0.55, y: 0.0 },
      { r: 0.82, y: 0.004 },
      { r: 0.94, y: 0.014 },
      { r: 0.99, y: 0.03 },
      { r: 1.0, y: 0.05 },
      { r: 1.0, y: 0.12 },
      { r: 1.0, y: 0.26 },
      { r: 1.0, y: 0.4 },
      { r: 1.0, y: 0.54 },
      { r: 1.0, y: 0.63 },
      { r: 0.99, y: 0.664 },
      { r: 0.955, y: 0.7 },
      { r: 0.9, y: 0.734 },
      { r: 0.82, y: 0.764 },
      { r: 0.7, y: 0.79 },
      { r: 0.58, y: 0.812 },
      { r: 0.462, y: 0.836 },
    ],
  },

  {
    id: 'slim',
    name: 'Slim Faceted',
    note: 'Soft square · tall and narrow',
    cross: { type: 'superellipse', n: 3 },
    rScale: 0.92,
    hScale: 1.22,
    band: [0.29, 0.695],
    body: [
      { r: 0.0, y: 0.0 },
      { r: 0.5, y: 0.0 },
      { r: 0.78, y: 0.004 },
      { r: 0.9, y: 0.014 },
      { r: 0.95, y: 0.032 },
      { r: 0.965, y: 0.06 },
      { r: 0.975, y: 0.12 }, // gentle taper up from the base
      { r: 0.99, y: 0.2 },
      { r: 1.0, y: 0.26 },
      { r: 1.0, y: 0.4 },
      { r: 1.0, y: 0.55 },
      { r: 1.0, y: 0.66 },
      { r: 1.0, y: 0.72 },
      { r: 0.985, y: 0.748 },
      { r: 0.945, y: 0.776 },
      { r: 0.875, y: 0.8 },
      { r: 0.75, y: 0.82 },
      // This shape is narrow, so it ends wider than the other bodies: at 0.462R
      // its shoulder would meet the neck at almost exactly the neck radius,
      // leaving no taper for the spline to follow and letting it wobble.
      { r: 0.6, y: 0.836 },
    ],
  },
]

export const shapeById = (id) => SHAPES.find((s) => s.id === id) || SHAPES[0]

export const outlineOf = (shape) => [...shape.body, ...NECK]
