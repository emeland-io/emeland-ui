import { describe, it, expect } from 'vitest'
import { formatScaleNumber, scaleDomain, scalePosition } from '@/utils/scale'

describe('scaleDomain', () => {
  it('caps percent scales at 100', () => {
    expect(scaleDomain([91, 85], '%')).toEqual({ lo: 0, hi: 100 })
  })

  it('pads the top by 10 percent of the span', () => {
    const d = scaleDomain([0.05, 0.061], 'ratio')
    expect(d.lo).toBe(0)
    expect(d.hi).toBeCloseTo(0.0671, 10)
  })

  it('rounds whole-number inputs up to a whole number', () => {
    expect(scaleDomain([5, 4])).toEqual({ lo: 0, hi: 6 })
  })

  it('starts below zero when a number is negative', () => {
    expect(scaleDomain([-4, 6])).toEqual({ lo: -4, hi: 7 })
  })

  it('widens an empty span', () => {
    expect(scaleDomain([0, 0])).toEqual({ lo: 0, hi: 1 })
  })
})

describe('scalePosition', () => {
  it('maps into 0-100 and clamps outside the domain', () => {
    const d = { lo: 0, hi: 200 }
    expect(scalePosition(50, d)).toBe(25)
    expect(scalePosition(-10, d)).toBe(0)
    expect(scalePosition(500, d)).toBe(100)
  })
})

describe('formatScaleNumber', () => {
  it('prints integers as they are and others to 3 significant digits', () => {
    expect(formatScaleNumber(100)).toBe('100')
    expect(formatScaleNumber(0.067100000001)).toBe('0.0671')
    expect(formatScaleNumber(453.2)).toBe('453')
  })
})
