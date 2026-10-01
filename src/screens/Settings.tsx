import { useState, type Dispatch } from 'react'
import type { Action } from '../app/store'
import type { Save } from '../app/save'

/** Sound and reset progress only: timers are mandatory and there are no hints (spec §4.2). */
export function Settings({ save, dispatch }: { save: Save; dispatch: Dispatch<Action> }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="overlay" role="dialog" aria-label="Settings">
      <div className="panel">
        <h2>Settings</h2>
        <label className="row">
          <input type="checkbox" checked={save.settings.sound} onChange={() => dispatch({ type: 'toggleSound' })} />
          Sound
        </label>
        {confirming ? (
          <div className="row">
            Erase all progress?
            <button className="btn" onClick={() => { dispatch({ type: 'resetProgress' }); setConfirming(false) }}>Yes, reset</button>
            <button className="btn" onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn" onClick={() => setConfirming(true)}>Reset progress</button>
        )}
        <button className="btn" onClick={() => dispatch({ type: 'closeSettings' })}>Close</button>
      </div>
    </div>
  )
}
