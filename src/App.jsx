import { useCallback, useMemo, useRef, useState } from 'react'

import Viewer from './components/Viewer'
import Panel from './components/Panel'
import { presetById } from './label/presets'

const FIRST = presetById('wedding-classic')
const paletteColors = (p) => ({ bg: p.bg, fg: p.fg, accent: p.accent })
const MAX_LOGO_BYTES = 5 * 1024 * 1024

export default function App() {
  const [presetId, setPresetId] = useState(FIRST.id)
  const [values, setValues] = useState(() => ({ ...FIRST.defaults }))
  const [colors, setColors] = useState(() => paletteColors(FIRST.palettes[0]))
  const [fonts, setFonts] = useState(() => ({ ...FIRST.fonts }))
  const [capColor, setCapColor] = useState(FIRST.palettes[0].cap)
  const [sizeId, setSizeId] = useState('500')
  const [finish, setFinish] = useState('matte')
  const [logo, setLogo] = useState(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)
  const [notice, setNotice] = useState('')

  const preset = presetById(presetId)
  const logoUrl = useRef(null)

  const choosePreset = useCallback(
    (id) => {
      const next = presetById(id)
      const current = presetById(presetId)
      // Carry over anything the customer actually typed; refill the rest.
      setValues((prev) =>
        Object.fromEntries(
          next.fields.map((f) => {
            const was = prev[f.key]
            const untouched = was === undefined || was === current.defaults[f.key]
            return [f.key, untouched ? (next.defaults[f.key] ?? '') : was]
          }),
        ),
      )
      setColors(paletteColors(next.palettes[0]))
      setCapColor(next.palettes[0].cap)
      setFonts({ ...next.fonts })
      setPresetId(id)
    },
    [presetId],
  )

  const setValue = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const applyPalette = useCallback((p) => {
    setColors(paletteColors(p))
    setCapColor(p.cap)
  }, [])

  const clearLogo = useCallback(() => {
    if (logoUrl.current) URL.revokeObjectURL(logoUrl.current)
    logoUrl.current = null
    setLogo(null)
  }, [])

  const loadLogo = useCallback(
    (file) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setNotice('That file is not an image.')
        return
      }
      if (file.size > MAX_LOGO_BYTES) {
        setNotice('That image is larger than 5 MB — please use a smaller file.')
        return
      }
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        if (logoUrl.current) URL.revokeObjectURL(logoUrl.current)
        logoUrl.current = url
        setNotice('')
        setLogo(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setNotice('That image could not be read.')
      }
      img.src = url
    },
    [],
  )

  const design = useMemo(
    () => ({ sizeId, presetId, values, colors, fonts, logo, capColor, finish }),
    [sizeId, presetId, values, colors, fonts, logo, capColor, finish],
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            <b>Water Spatial</b>
            <small>Custom Bottle Studio</small>
          </span>
        </div>
        <p className="topbar-note">
          Personalised printed bottles for weddings, cafés, hotels &amp; events
        </p>
      </header>

      <main className="layout">
        <div className="stage">
          <Viewer design={design} autoRotate={autoRotate} resetSignal={resetSignal} />
          <div className="stage-caption">
            <b>{preset.name}</b>
            <span>
              {preset.tagline} · {sizeId === '1000' ? '1 litre' : `${sizeId} ml`}
            </span>
          </div>
          <div className="stage-hint">Drag to rotate · scroll to zoom</div>
        </div>

        <aside className="panel">
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          <Panel
            preset={preset}
            onPreset={choosePreset}
            values={values}
            onValue={setValue}
            colors={colors}
            onColors={setColors}
            onPalette={applyPalette}
            fonts={fonts}
            onFonts={setFonts}
            sizeId={sizeId}
            onSize={setSizeId}
            capColor={capColor}
            onCapColor={setCapColor}
            finish={finish}
            onFinish={setFinish}
            logo={logo}
            onLogo={loadLogo}
            onClearLogo={clearLogo}
            autoRotate={autoRotate}
            onAutoRotate={setAutoRotate}
            onResetView={() => setResetSignal((n) => n + 1)}
          />
        </aside>
      </main>
    </div>
  )
}
