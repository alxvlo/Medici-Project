import type { Dispatch } from 'react'
import type { Action } from '../app/store'
import type { Save } from '../app/save'
import { Img } from '../ui/Img'

export function Title({ save, dispatch }: { save: Save; dispatch: Dispatch<Action> }) {
  return (
    <div className="screen title">
      <Img id="bg-title" className="bg" />
      <Img id="logo" className="logo" alt="Radtech Simulator" />
      <nav className="menu">
        <button className="btn" onClick={() => dispatch({ type: 'go', screen: { name: 'level', id: save.unlocked } })}>Start</button>
        <button className="btn" onClick={() => dispatch({ type: 'go', screen: { name: 'levelSelect' } })}>Select Level</button>
        <button className="btn" onClick={() => dispatch({ type: 'openSettings' })}>Settings</button>
      </nav>
    </div>
  )
}
