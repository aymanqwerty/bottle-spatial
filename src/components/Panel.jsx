import { useRef } from 'react'
import { PRESETS } from '../label/presets'
import { FONTS } from '../config/fonts'
import { SIZE_LIST } from '../three/bottle'

const FONT_GROUPS = ['Script', 'Serif', 'Sans', 'Display']

function Section({ num, title, hint, children }) {
  return (
    <section className="sec">
      <h2 className="sec-title">
        <span className="num">{num}</span>
        {title}
      </h2>
      {hint && <p className="sec-hint">{hint}</p>}
      {children}
    </section>
  )
}

function Segmented({ options, value, onChange, name }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'seg on' : 'seg'}
          onClick={() => onChange(o.value)}
        >
          <span>{o.label}</span>
          {o.note && <small>{o.note}</small>}
        </button>
      ))}
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="color-field">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="color-meta">
        <b>{label}</b>
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  )
}

function FontSelect({ label, value, onChange }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {FONT_GROUPS.map((kind) => (
          <optgroup key={kind} label={kind}>
            {FONTS.filter((f) => f.kind === kind).map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}

export default function Panel({
  preset,
  onPreset,
  values,
  onValue,
  colors,
  onColors,
  onPalette,
  fonts,
  onFonts,
  sizeId,
  onSize,
  capColor,
  onCapColor,
  finish,
  onFinish,
  logo,
  onLogo,
  onClearLogo,
  autoRotate,
  onAutoRotate,
  onResetView,
}) {
  const fileRef = useRef(null)

  return (
    <div className="panel-inner">
      <Section num="01" title="Style" hint="Pick a starting design — everything below stays editable.">
        <div className="style-grid">
          {PRESETS.map((p) => {
            const pal = p.palettes[0]
            return (
              <button
                key={p.id}
                type="button"
                className={p.id === preset.id ? 'style-card on' : 'style-card'}
                onClick={() => onPreset(p.id)}
              >
                <span className="style-swatch" style={{ background: pal.bg }}>
                  <i style={{ background: pal.accent }} />
                  <em style={{ color: pal.fg }}>Aa</em>
                </span>
                <span className="style-meta">
                  <b>{p.name}</b>
                  <small>{p.category}</small>
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section num="02" title="Your text" hint="Leave a field empty to drop that line from the label.">
        {preset.fields.map((f) => (
          <label className="field" key={f.key}>
            <span className="field-label">
              {f.label}
              <small>
                {(values[f.key] || '').length}/{f.max}
              </small>
            </span>
            <input
              type="text"
              maxLength={f.max}
              value={values[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => onValue(f.key, e.target.value)}
            />
          </label>
        ))}
      </Section>

      <Section num="03" title="Colours">
        <div className="palette-row">
          {preset.palettes.map((p) => {
            const active =
              p.bg.toLowerCase() === colors.bg.toLowerCase() &&
              p.accent.toLowerCase() === colors.accent.toLowerCase() &&
              p.fg.toLowerCase() === colors.fg.toLowerCase()
            return (
              <button
                key={p.name}
                type="button"
                title={p.name}
                className={active ? 'palette on' : 'palette'}
                onClick={() => onPalette(p)}
              >
                <i style={{ background: p.bg }} />
                <i style={{ background: p.fg }} />
                <i style={{ background: p.accent }} />
                <small>{p.name}</small>
              </button>
            )
          })}
        </div>
        <div className="color-grid">
          <ColorField label="Label" value={colors.bg} onChange={(v) => onColors({ ...colors, bg: v })} />
          <ColorField label="Text" value={colors.fg} onChange={(v) => onColors({ ...colors, fg: v })} />
          <ColorField label="Accent" value={colors.accent} onChange={(v) => onColors({ ...colors, accent: v })} />
          <ColorField label="Cap" value={capColor} onChange={onCapColor} />
        </div>
      </Section>

      <Section num="04" title="Typography">
        <div className="two-up">
          <FontSelect label="Headline font" value={fonts.display} onChange={(v) => onFonts({ ...fonts, display: v })} />
          <FontSelect label="Supporting font" value={fonts.body} onChange={(v) => onFonts({ ...fonts, body: v })} />
        </div>
      </Section>

      <Section num="05" title="Logo" hint={preset.logoHint}>
        <div className="logo-row">
          <div className="logo-thumb" data-empty={logo ? 'no' : 'yes'}>
            {logo ? <img src={logo.src} alt="Uploaded logo preview" /> : <span>No logo</span>}
          </div>
          <div className="logo-actions">
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              {logo ? 'Replace image' : 'Upload image'}
            </button>
            {logo && (
              <button type="button" className="btn ghost" onClick={onClearLogo}>
                Remove
              </button>
            )}
            <small>PNG with a transparent background looks best. Max 5 MB.</small>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            hidden
            onChange={(e) => {
              onLogo(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      </Section>

      <Section num="06" title="Bottle">
        <span className="field-label plain">Size</span>
        <Segmented
          name="Bottle size"
          value={sizeId}
          onChange={onSize}
          options={SIZE_LIST.map((s) => ({ value: s.id, label: s.label, note: s.note }))}
        />
        <span className="field-label plain">Label finish</span>
        <Segmented
          name="Label finish"
          value={finish}
          onChange={onFinish}
          options={[
            { value: 'matte', label: 'Matte', note: 'Soft, premium' },
            { value: 'glossy', label: 'Glossy', note: 'Bright, punchy' },
          ]}
        />
      </Section>

      <Section num="07" title="View">
        <div className="view-row">
          <label className="switch">
            <input type="checkbox" checked={autoRotate} onChange={(e) => onAutoRotate(e.target.checked)} />
            <span className="track" />
            <span>Auto-rotate</span>
          </label>
          <button type="button" className="btn ghost" onClick={onResetView}>
            Reset view
          </button>
        </div>
        <p className="sec-hint">Drag to spin the bottle, scroll or pinch to zoom.</p>
      </Section>
    </div>
  )
}
