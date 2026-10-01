import { useRef, useState } from 'react'
import type { Level } from '../data/schema'
import { play } from '../audio'
import { Copy } from '../ui/Copy'
import { Img } from '../ui/Img'
import { TimerRing, useCountdown } from '../ui/TimerRing'

const LONG_PRESS_MS = 400
const SHAKE_MS = 400 // spec §6: the shake plays first, then the explanation

/** One attempt. A wrong pick (or the timer running out) explains, reveals the right pose, then advances (spec §4.3). */
export function Position({ level, onComplete }: { level: Level; onComplete: (pose: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [wrong, setWrong] = useState<{ pose: string | null } | null>(null)
  const [explain, setExplain] = useState(false)
  const [committed, setCommitted] = useState(false)
  const done = useRef(false) // guards a double click landing before the re-render
  const press = useRef<{ timer?: number; long: boolean }>({ long: false })
  const options = level.position.options
  const correct = options.find((o) => o.correct)!

  const commit = (pose: string | null) => {
    if (done.current) return
    done.current = true
    setCommitted(true)
    if (pose === correct.image) {
      play('sfx-correct')
      onComplete(pose)
    } else {
      play('sfx-wrong')
      setWrong({ pose })
      window.setTimeout(() => setExplain(true), SHAKE_MS)
    }
  }
  const left = useCountdown(level.timers.position, !committed, () => commit(null))
  const chosen = wrong && options.find((o) => o.image === wrong.pose)

  return (
    <div className="screen position">
      <Img id="bg-xray-room" className="bg" />
      <h2 className="prompt">Choose the patient position</h2>
      <TimerRing left={left} total={level.timers.position} />
      <div className={wrong ? 'poses wrong' : 'poses'}>
        {options.map((o, i) => (
          <button key={o.image} className="pose" aria-label={`Position option ${i + 1}`}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setPreview(o.image) }}
            onPointerLeave={() => setPreview(null)}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') return
              press.current.long = false
              press.current.timer = window.setTimeout(() => { press.current.long = true; setPreview(o.image) }, LONG_PRESS_MS)
            }}
            onPointerUp={() => {
              window.clearTimeout(press.current.timer)
              if (press.current.long) setPreview(null)
            }}
            onClick={() => {
              if (press.current.long) { press.current.long = false; return } // the end of a long-press, not a choice
              commit(o.image)
            }}
            onContextMenu={(e) => e.preventDefault()}>
            <Img id={o.image} />
          </button>
        ))}
      </div>
      {preview && !wrong && (
        <div className="pose-preview" data-testid="pose-preview"><Img id={preview} /></div>
      )}
      {wrong && explain && (
        <div className="overlay" role="dialog" aria-label="Wrong position">
          <div className="panel">
            <h2>{chosen ? `${chosen.label} is not the right position` : "Time's up: no position was chosen"}</h2>
            {chosen && <p><Copy text={chosen.why} /></p>}
            <p>The correct position is {correct.label}.</p>
            <Img id={correct.image} className="correct-pose" />
            <button className="btn" onClick={() => onComplete(wrong.pose)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  )
}
