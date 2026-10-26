import { describe, it, expect } from 'vitest'
import {
  INSTANCE_STATUSES,
  INSTANCE_STATUS_TONE,
  compareByName,
  evaluateThreshold,
  formatThreshold,
  instanceStatus,
  instanceUnit,
  orderedThresholds,
  parseMetricNumber,
  thresholdCondition,
  thresholdLimits,
} from '@/types/metric'
import type { Metric, MetricInstance, MetricValue, Threshold } from '@/types/metric'

function threshold(annotations: Record<string, string>): Threshold {
  return { thresholdId: 't', displayName: 't', metricInstanceId: 'i', annotations }
}

function value(v: string): MetricValue {
  return { metricValueId: `v-${v}`, displayName: 'current', metricInstanceId: 'i', value: v }
}

const gt300 = threshold({
  'emeland.io/threshold.operator': 'gt',
  'emeland.io/threshold.limit': '300',
})
const lt50 = threshold({
  'emeland.io/threshold.operator': 'lt',
  'emeland.io/threshold.limit': '50',
})
const expr = threshold({
  'emeland.io/threshold.expression': 'value > 500',
  'emeland.io/threshold.language': 'cel',
})

describe('instanceUnit', () => {
  const metric: Metric = {
    metricId: 'm',
    displayName: 'm',
    annotations: { 'emeland.io/unit': 'ms' },
  }
  const inst: MetricInstance = { metricInstanceId: 'i', displayName: 'i', annotations: {} }

  it('falls back to the metric unit', () => {
    expect(instanceUnit(inst, metric)).toBe('ms')
  })

  it('prefers the instance override', () => {
    expect(instanceUnit({ ...inst, annotations: { 'emeland.io/unit': '%' } }, metric)).toBe('%')
  })

  it('is undefined without either', () => {
    expect(instanceUnit(inst)).toBeUndefined()
  })
})

describe('thresholdCondition / formatThreshold', () => {
  it('renders operator codes as symbols with the unit', () => {
    const cases: [string, string][] = [
      ['gt', '> 300 ms'],
      ['ge', '≥ 300 ms'],
      ['lt', '< 300 ms'],
      ['le', '≤ 300 ms'],
      ['eq', '= 300 ms'],
      ['ne', '≠ 300 ms'],
    ]
    for (const [op, expected] of cases) {
      const t = threshold({
        'emeland.io/threshold.operator': op,
        'emeland.io/threshold.limit': '300',
      })
      expect(formatThreshold(t, 'ms')).toBe(expected)
    }
  })

  it('omits the unit when none is known', () => {
    expect(formatThreshold(gt300)).toBe('> 300')
  })

  it('keeps unknown operator codes verbatim', () => {
    const t = threshold({
      'emeland.io/threshold.operator': 'within',
      'emeland.io/threshold.limit': '10',
    })
    expect(formatThreshold(t, 'ms')).toBe('within 10 ms')
  })

  it('returns the expression for expression thresholds', () => {
    expect(thresholdCondition(expr)).toEqual({
      kind: 'expression',
      expression: 'value > 500',
      language: 'cel',
    })
    expect(formatThreshold(expr, 'ms')).toBe('value > 500')
  })

  it('is undefined for a threshold without a condition', () => {
    expect(thresholdCondition(threshold({}))).toBeUndefined()
    expect(formatThreshold(threshold({}))).toBeUndefined()
  })
})

describe('parseMetricNumber', () => {
  it('parses finite numbers and rejects the rest', () => {
    expect(parseMetricNumber('412')).toBe(412)
    expect(parseMetricNumber(' 0.012 ')).toBe(0.012)
    expect(parseMetricNumber('-3')).toBe(-3)
    expect(parseMetricNumber('')).toBeUndefined()
    expect(parseMetricNumber('degraded')).toBeUndefined()
    expect(parseMetricNumber('Infinity')).toBeUndefined()
  })
})

describe('evaluateThreshold', () => {
  it('compares numeric values against operator thresholds', () => {
    expect(evaluateThreshold(gt300, '412')).toBe('breached')
    expect(evaluateThreshold(gt300, '300')).toBe('ok')
    expect(evaluateThreshold(gt300, '188')).toBe('ok')
    expect(evaluateThreshold(lt50, '188')).toBe('ok')
    expect(evaluateThreshold(lt50, '12')).toBe('breached')
  })

  it('is unknown for expression thresholds, non-numeric sides and missing limits', () => {
    expect(evaluateThreshold(expr, '999')).toBe('unknown')
    expect(evaluateThreshold(gt300, 'degraded')).toBe('unknown')
    expect(evaluateThreshold(threshold({ 'emeland.io/threshold.operator': 'gt' }), '412')).toBe(
      'unknown',
    )
    expect(
      evaluateThreshold(
        threshold({
          'emeland.io/threshold.operator': 'within',
          'emeland.io/threshold.limit': '10',
        }),
        '5',
      ),
    ).toBe('unknown')
  })
})

describe('instanceStatus', () => {
  it('reports no-reading without values', () => {
    expect(instanceStatus([gt300], [])).toBe('no-reading')
  })

  it('reports breached when any pair breaches', () => {
    expect(instanceStatus([lt50, gt300], [value('412')])).toBe('breached')
  })

  it('reports ok when something evaluated and nothing breached', () => {
    expect(instanceStatus([gt300, expr], [value('188')])).toBe('ok')
  })

  it('reports unknown when nothing could be evaluated', () => {
    expect(instanceStatus([], [value('188')])).toBe('unknown')
    expect(instanceStatus([expr], [value('188')])).toBe('unknown')
    expect(instanceStatus([gt300], [value('degraded')])).toBe('unknown')
  })
})

describe('orderedThresholds', () => {
  it('lists breached thresholds first, then operators, then expressions', () => {
    const gt500: Threshold = {
      thresholdId: 't-crit',
      displayName: 'critical',
      metricInstanceId: 'i',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '500' },
    }
    const ordered = orderedThresholds([expr, gt500, gt300], [value('412')])
    expect(ordered).toEqual([gt300, gt500, expr])
  })

  it('orders unbreached operator thresholds by ascending limit', () => {
    const gt500: Threshold = {
      thresholdId: 't-crit',
      displayName: 'critical',
      metricInstanceId: 'i',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '500' },
    }
    expect(orderedThresholds([gt500, gt300], [value('100')])).toEqual([gt300, gt500])
  })
})

describe('compareByName', () => {
  it('orders by display name, then id', () => {
    const items = [
      { id: 'b', displayName: 'Zeta' },
      { id: 'c', displayName: 'Alpha' },
      { id: 'a', displayName: 'Alpha' },
    ]
    expect(items.sort((x, y) => compareByName(x, y, (i) => i.id)).map((i) => i.id)).toEqual([
      'a',
      'c',
      'b',
    ])
  })
})

describe('INSTANCE_STATUS_TONE', () => {
  it('draws attention to a breach only', () => {
    for (const status of INSTANCE_STATUSES) {
      expect(INSTANCE_STATUS_TONE[status]).toBe(status === 'breached' ? 'warning' : 'muted')
    }
  })
})

describe('thresholdLimits', () => {
  const op = (operator: string, limit: string) =>
    threshold({ 'emeland.io/threshold.operator': operator, 'emeland.io/threshold.limit': limit })

  it('keeps comparison thresholds with numeric limits, sorted by limit', () => {
    const limits = thresholdLimits([op('ge', '95'), op('lt', '5'), op('gt', '85')], '%')
    expect(limits.map((l) => [l.limit, l.side, l.label])).toEqual([
      [5, 'below', '< 5 %'],
      [85, 'above', '> 85 %'],
      [95, 'above', '≥ 95 %'],
    ])
  })

  it('drops equality, expression and non-numeric thresholds', () => {
    const limits = thresholdLimits([
      op('eq', '5'),
      op('ne', '5'),
      op('gt', 'high'),
      threshold({ 'emeland.io/threshold.expression': 'rate > 1' }),
    ])
    expect(limits).toEqual([])
  })
})
