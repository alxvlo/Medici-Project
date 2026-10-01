import { describe, it, expect } from 'vitest'
import {
  checkTechnique, filmFor, checkCollimation, checkPosition, collimatedFirstTry, mistakes, stars, type CaseResult,
} from '../../src/game/rules'

const kvp = { target: 125, tolerance: 13, step: 1 }
const mas = { target: 2.5, tolerance: 0.3, step: 0.1 }
const technique = { kvp, mas }
const level = {
  position: { options: [
    { image: 'pose-chest-ap', correct: false },
    { image: 'pose-chest-lateral', correct: false },
    { image: 'pose-chest-pa', correct: true },
  ] },
  technique,
}
const clean: CaseResult = { pose: 'pose-chest-pa', kvp: 125, mas: 2.5, collimationFailures: 0 }

describe('stars', () => {
  it('maps 0/1/2/3/4 mistakes to 3/2/2/1/1', () => expect([0, 1, 2, 3, 4].map(stars)).toEqual([3, 2, 2, 1, 1]))
})

describe('checkTechnique', () => {
  it('accepts the inclusive kVp edges', () => {
    expect(checkTechnique(112, kvp)).toBe(true)
    expect(checkTechnique(138, kvp)).toBe(true)
  })
  it('rejects one step outside kVp', () => {
    expect(checkTechnique(111, kvp)).toBe(false)
    expect(checkTechnique(139, kvp)).toBe(false)
  })
  it('accepts the inclusive mAs edges on a 0.1 step (2.2 and 2.8 against 2.5 +/- 0.3)', () => {
    expect(checkTechnique(2.2, mas)).toBe(true)
    expect(checkTechnique(2.8, mas)).toBe(true)
  })
  // Level 6's real dial. In JS |1.4 - 1.6| is 0.20000000000000018, so a naive `<= 0.2` calls the inclusive edge wrong.
  it('accepts the inclusive mAs edge despite floating point (1.4 against 1.6 +/- 0.2, level 6)', () => {
    const l6 = { target: 1.6, tolerance: 0.2, step: 0.1 }
    expect(checkTechnique(1.4, l6)).toBe(true)
    expect(checkTechnique(1.3, l6)).toBe(false)
  })
  it('rejects one step outside mAs', () => {
    expect(checkTechnique(2.1, mas)).toBe(false)
    expect(checkTechnique(2.9, mas)).toBe(false)
  })
})

describe('filmFor', () => {
  it('is good when both are in tolerance', () => expect(filmFor(125, 2.5, technique)).toBe('good'))
  it('is under when kVp is low', () => expect(filmFor(100, 2.5, technique)).toBe('under'))
  it('is under when mAs is low', () => expect(filmFor(125, 2.0, technique)).toBe('under'))
  it('is over when kVp is high', () => expect(filmFor(140, 2.5, technique)).toBe('over'))
  it('is over when mAs is high', () => expect(filmFor(125, 3.0, technique)).toBe('over'))
  it('is under when kVp is low and mAs high — under wins (spec §4.4)', () =>
    expect(filmFor(100, 3.0, technique)).toBe('under'))
  it('is under when kVp is high and mAs low — under wins either way round', () =>
    expect(filmFor(140, 2.0, technique)).toBe('under'))
  it('takes kVp, mAs, and the technique spec only — position and collimation cannot reach it', () =>
    expect(filmFor.length).toBe(3))
})

describe('checkCollimation', () => {
  const c = { target: { w: 60, h: 70 }, tolerance: 5 }
  it('accepts both dimensions at the inclusive edges', () => {
    expect(checkCollimation({ w: 65, h: 75 }, c)).toBe(true)
    expect(checkCollimation({ w: 55, h: 65 }, c)).toBe(true)
  })
  it('rejects when only width is off', () => expect(checkCollimation({ w: 66, h: 70 }, c)).toBe(false))
  it('rejects when only height is off', () => expect(checkCollimation({ w: 60, h: 76 }, c)).toBe(false))
})

describe('mistakes', () => {
  it('is 0 for a clean case', () => expect(mistakes(clean, level)).toBe(0))
  it('is 1 for a wrong pose', () => expect(mistakes({ ...clean, pose: 'pose-chest-ap' }, level)).toBe(1))
  it('is 1, not 2, when the position timer ran out', () => expect(mistakes({ ...clean, pose: null }, level)).toBe(1))
  it('counts kVp and mAs separately', () => expect(mistakes({ ...clean, kvp: 100, mas: 3.0 }, level)).toBe(2))
  it('counts three failed collimation attempts as 1', () =>
    expect(mistakes({ ...clean, collimationFailures: 3 }, level)).toBe(1))
  it('costs nothing when the technique timer submits dials already in tolerance', () =>
    expect(mistakes({ ...clean, kvp: 112, mas: 2.8 }, level)).toBe(0))
  it('caps at 4', () =>
    expect(mistakes({ pose: null, kvp: 40, mas: 0.5, collimationFailures: 9 }, level)).toBe(4))
})

describe('checkPosition', () => {
  it('is true only for the correct pose', () => {
    expect(checkPosition('pose-chest-pa', level)).toBe(true)
    expect(checkPosition('pose-chest-ap', level)).toBe(false)
  })
  it('is false when the timer ran out and no pose was chosen', () => expect(checkPosition(null, level)).toBe(false))
})

describe('collimatedFirstTry', () => {
  it('is true with no failed attempts and false with any', () => {
    expect(collimatedFirstTry(0)).toBe(true)
    expect(collimatedFirstTry(1)).toBe(false)
    expect(collimatedFirstTry(3)).toBe(false)
  })
})
