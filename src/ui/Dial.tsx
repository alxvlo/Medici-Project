import { Img } from './Img'

type Props = {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; art: 'dial' | 'knob'; wrong?: boolean; unit?: string
}

/** Drag (a native range input) or ± buttons. Values are rounded to the step's precision. */
export function Dial({ label, value, min, max, step, onChange, art, wrong = false, unit = '' }: Props) {
  const decimals = step < 1 ? 1 : 0
  const set = (v: number) => onChange(Number(Math.min(max, Math.max(min, v)).toFixed(decimals)))
  const turn = { transform: `rotate(${-135 + (270 * (value - min)) / (max - min)}deg)` }
  return (
    <div className={wrong ? 'dial wrong' : 'dial'}>
      <div className="dial-face">
        <Img id={art} style={art === 'knob' ? turn : undefined} />
        {art === 'dial' && <Img id="dial-needle" className="needle" style={turn} />}
      </div>
      <output className="readout">{value.toFixed(decimals)}{unit}</output>
      <div className="dial-controls">
        <button aria-label={`${label} down`} onClick={() => set(value - step)}>−</button>
        <input type="range" aria-label={label} min={min} max={max} step={step} value={value}
          onChange={(e) => set(Number(e.target.value))} />
        <button aria-label={`${label} up`} onClick={() => set(value + step)}>+</button>
      </div>
      <span className="dial-label">{label}</span>
    </div>
  )
}
