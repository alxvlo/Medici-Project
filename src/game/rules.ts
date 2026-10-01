/** Pure scoring rules (spec §4.4, §6). Nothing here knows about React or the DOM. */
export type DialSpec = { target: number; tolerance: number; step: number }
export type CollimationSpec = { target: { w: number; h: number }; tolerance: number }
export type Film = 'good' | 'under' | 'over'
/** `pose` is the chosen pose's image id, or null when the position timer ran out. */
export type CaseResult = { pose: string | null; kvp: number; mas: number; collimationFailures: number }
export type ScoredLevel = {
  position: { options: { image: string; correct: boolean }[] }
  technique: { kvp: DialSpec; mas: DialSpec }
}

type Band = 'below' | 'in' | 'above'

/** Compared in whole dial steps: with a 0.1 step, 2.5 - 2.2 is 0.30000000000000027 in floating point. */
function band(value: number, d: DialSpec): Band {
  const off = Math.round((value - d.target) / d.step)
  const tol = Math.round(d.tolerance / d.step)
  return off < -tol ? 'below' : off > tol ? 'above' : 'in'
}

export const checkTechnique = (value: number, d: DialSpec) => band(value, d) === 'in'

/** Under wins any low/high disagreement (spec §4.4). Takes kVp and mAs only: nothing else may change the film. */
export function filmFor(kvp: number, mas: number, t: { kvp: DialSpec; mas: DialSpec }): Film {
  const bands = [band(kvp, t.kvp), band(mas, t.mas)]
  if (bands.includes('below')) return 'under'
  if (bands.includes('above')) return 'over'
  return 'good'
}

export const checkCollimation = (field: { w: number; h: number }, c: CollimationSpec) =>
  Math.abs(field.w - c.target.w) <= c.tolerance && Math.abs(field.h - c.target.h) <= c.tolerance

/** A null pose (the timer ran out) is never correct. */
export const checkPosition = (pose: string | null, level: Pick<ScoredLevel, 'position'>) =>
  level.position.options.some((o) => o.correct && o.image === pose)

/** Collimation scores on whether the first attempt was right, however many attempts followed (spec §6). */
export const collimatedFirstTry = (failures: number) => failures === 0

/** At most one each from position, kVp, mAs, and collimation (spec §6). */
export function mistakes(r: CaseResult, level: ScoredLevel): number {
  return (
    Number(!checkPosition(r.pose, level)) +
    Number(!checkTechnique(r.kvp, level.technique.kvp)) +
    Number(!checkTechnique(r.mas, level.technique.mas)) +
    Number(!collimatedFirstTry(r.collimationFailures))
  )
}

export const stars = (mistakeCount: number): 1 | 2 | 3 => (mistakeCount === 0 ? 3 : mistakeCount <= 2 ? 2 : 1)
