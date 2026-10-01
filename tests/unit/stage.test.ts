import { describe, it, expect } from 'vitest'
import { fitScale } from '../../src/app/Stage'

describe('fitScale', () => {
  it('fills a 3:2 viewport exactly', () => expect(fitScale(1920, 1280)).toBe(2))
  it('is limited by height in a wide viewport', () => expect(fitScale(1280, 640)).toBe(1))
  it('is limited by width in a tall viewport', () => expect(fitScale(480, 640)).toBe(0.5))
  it('shrinks below 1 on a phone in landscape', () => expect(fitScale(851, 393)).toBeCloseTo(393 / 640, 6))
})
