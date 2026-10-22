import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ValueScale from '@/components/metrics/ValueScale.vue'
import type { MetricValue, Threshold } from '@/types/metric'

function value(id: string, v: string, name = id): MetricValue {
  return { metricValueId: id, displayName: name, metricInstanceId: 'i1', value: v, annotations: {} }
}

function threshold(id: string, operator: string, limit: string): Threshold {
  return {
    thresholdId: id,
    displayName: `${id} name`,
    metricInstanceId: 'i1',
    annotations: { 'emeland.io/threshold.operator': operator, 'emeland.io/threshold.limit': limit },
  }
}

describe('ValueScale', () => {
  it('renders nothing without a numeric comparison threshold', () => {
    const w = mount(ValueScale, {
      props: { values: [value('v', '91')], thresholds: [threshold('t', 'eq', '5')] },
    })
    expect(w.find('[role="img"]').exists()).toBe(false)
  })

  it('renders nothing without a numeric reading', () => {
    const w = mount(ValueScale, {
      props: { values: [value('v', 'n/a')], thresholds: [threshold('t', 'gt', '5')] },
    })
    expect(w.find('[role="img"]').exists()).toBe(false)
  })

  it('places readings and a greater-than limit on a 0-100 percent scale', () => {
    const w = mount(ValueScale, {
      props: {
        values: [value('one', '91', '1 minute average'), value('fifteen', '78')],
        thresholds: [threshold('warn', 'ge', '85')],
        unit: '%',
      },
    })
    const markers = w.findAll('[data-reading-marker]')
    expect(markers).toHaveLength(2)
    expect(markers[0]!.attributes('style')).toContain('left: 91%')
    expect(markers[0]!.classes()).toContain('bg-warning')
    expect(markers[0]!.attributes('title')).toBe('1 minute average: 91 %')
    expect(markers[1]!.classes()).toContain('bg-text-2')
    const band = w.find('.bg-warning\\/15')
    expect(band.attributes('style')).toContain('left: 85%')
    expect(band.attributes('style')).toContain('right: 0')
    expect(band.attributes('title')).toBe('warn name: ≥ 85 %')
    const text = w.text()
    expect(text).toContain('0')
    expect(text).toContain('100')
    expect(w.find('[data-limit-label]').text()).toBe('≥ 85 %')
    expect(w.find('[data-limit-label]').attributes('title')).toBe('warn name')
  })

  it('puts the band on the low side for a less-than limit and pads the domain', () => {
    const w = mount(ValueScale, {
      props: {
        values: [value('days', '12')],
        thresholds: [threshold('expiry', 'lt', '30')],
        unit: 'days',
      },
    })
    // domain 0..33 (30 padded by 10 %), so the limit sits at ~91 %
    const band = w.find('.bg-warning\\/15')
    expect(band.attributes('style')).toContain('left: 0')
    expect(band.attributes('style')).toMatch(/right: 9\.0\d+%/)
    expect(w.text()).toContain('33')
  })

  it('keeps a whole-number scale for whole-number inputs', () => {
    const w = mount(ValueScale, {
      props: { values: [value('v', '4')], thresholds: [threshold('t', 'gt', '5')] },
    })
    expect(w.text()).toContain('6')
    expect(w.text()).not.toContain('5.5')
  })

  it('lets an edge limit label replace the axis number', () => {
    const w = mount(ValueScale, {
      props: {
        values: [value('v', '7')],
        thresholds: [threshold('present', 'gt', '0')],
        unit: 'events',
      },
    })
    const axis = w.findAll('.tabular-nums').map((n) => n.text())
    expect(axis).toEqual(['8'])
    expect(w.find('[data-limit-label]').text()).toBe('> 0 events')
  })

  it('stacks labels of limits that sit close together', () => {
    const w = mount(ValueScale, {
      props: {
        values: [value('v', '50')],
        thresholds: [threshold('a', 'ge', '85'), threshold('b', 'ge', '90')],
        unit: '%',
      },
    })
    const labels = w.findAll('[data-limit-label]')
    expect(labels[0]!.attributes('style')).toContain('top: 0')
    expect(labels[1]!.attributes('style')).toContain('top: 0.875rem')
  })
})
