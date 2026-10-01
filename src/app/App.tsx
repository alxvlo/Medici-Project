import { useEffect, useReducer, type MouseEvent } from 'react'
import { Stage } from './Stage'
import { reducer, type State } from './store'
import { loadSave, writeSave } from './save'
import { play, setSound, startAmbience } from '../audio'
import { Title } from '../screens/Title'
import { LevelSelect } from '../screens/LevelSelect'
import { Settings } from '../screens/Settings'
import { levelById } from '../data/levels'
import { mistakes, stars } from '../game/rules'
import { Level } from '../stages/Level'

const init = (): State => ({ screen: { name: 'title' }, save: loadSave(), settingsOpen: false })

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init)
  const { screen, save } = state
  useEffect(() => writeSave(save), [save])
  useEffect(() => setSound(save.settings.sound), [save.settings.sound])

  const onClickCapture = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) play('sfx-click')
    startAmbience()
  }

  return (
    <Stage>
      <div className="app" onClickCapture={onClickCapture}>
        {screen.name === 'title' && <Title save={save} dispatch={dispatch} />}
        {screen.name === 'levelSelect' && <LevelSelect save={save} dispatch={dispatch} />}
        {screen.name === 'level' && (
          <Level key={screen.id} level={levelById(screen.id)}
            onFinish={(result) => dispatch({
              type: 'finish', id: screen.id, result, stars: stars(mistakes(result, levelById(screen.id))),
            })} />
        )}
        {state.settingsOpen && <Settings save={save} dispatch={dispatch} />}
      </div>
    </Stage>
  )
}
