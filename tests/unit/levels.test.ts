import { describe, it, expect } from 'vitest'
import { LEVELS } from '../../src/data/levels'
import { MANIFEST, filmId } from '../../src/assets'

const FILMS = ['good', 'under', 'over'] as const

describe('shipped levels', () => {
  it('are exactly levels 1–20', () =>
    expect(LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1)))

  it('sit in the six sections, in order (spec §1)', () =>
    expect(LEVELS.map((l) => l.section)).toEqual([
      ...Array(3).fill('chest'), ...Array(3).fill('upper-ext'), ...Array(3).fill('lower-ext'),
      ...Array(3).fill('abdomen'), ...Array(3).fill('skull'), ...Array(5).fill('refresher'),
    ]))

  it('name only assets that were delivered — sprite, every pose, and three derived films', () => {
    expect(LEVELS).toHaveLength(20)
    const ids = LEVELS.flatMap((l) => [
      l.patient.sprite, ...l.position.options.map((o) => o.image), ...FILMS.map((f) => filmId(l.films.slug, f)),
    ])
    expect(ids.filter((id) => !(id in MANIFEST))).toEqual([])
  })

  it('produce sixty distinct film ids', () =>
    expect(new Set(LEVELS.flatMap((l) => FILMS.map((f) => filmId(l.films.slug, f)))).size).toBe(60))

  it('list position options alphabetically by image id (spec §5)', () => {
    expect(LEVELS).toHaveLength(20)
    for (const l of LEVELS) {
      const ids = l.position.options.map((o) => o.image)
      expect(ids, `level ${l.id}`).toEqual([...ids].sort())
    }
  })

  it('match the case database on spot-checked values', () => {
    const pick = (id: number) => {
      const l = LEVELS.find((x) => x.id === id)
      return [l?.patient.name, l?.technique.kvp.target, l?.technique.mas.target]
    }
    expect(pick(1)).toEqual(['Fernando R. Castillo', 125, 4])
    expect(pick(10)).toEqual(['Sofia M. Anderson', 70, 4])
    expect(pick(20)).toEqual(['Michael R. Aquino', 75, 16])
  })
})
