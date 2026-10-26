import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Metric, MetricInstance, MetricValue, Threshold } from '@/types/metric'

vi.mock('@/api/metrics', () => ({
  fetchMetrics: vi.fn(async () => []),
  fetchMetricById: vi.fn(),
  fetchMetricInstances: vi.fn(async () => []),
  fetchMetricInstanceById: vi.fn(),
  fetchThresholds: vi.fn(async () => []),
  fetchThresholdById: vi.fn(),
  fetchMetricValues: vi.fn(async () => []),
  fetchMetricValueById: vi.fn(),
}))

import {
  fetchMetrics,
  fetchMetricInstances,
  fetchMetricInstanceById,
  fetchThresholds,
  fetchThresholdById,
  fetchMetricValues,
  fetchMetricValueById,
} from '@/api/metrics'
import { useMetricsStore } from '@/stores/metrics'
import { useToasts } from '@/composables/useToasts'

function metric(metricId: string, dimension?: string): Metric {
  return {
    metricId,
    displayName: metricId,
    annotations: dimension ? { 'emeland.io/dimension': dimension } : {},
  }
}

function instance(
  metricInstanceId: string,
  metricId?: string,
  subjectType?: 'Node' | 'SystemInstance',
  displayName = metricInstanceId,
): MetricInstance {
  return {
    metricInstanceId,
    displayName,
    metricId,
    subject: subjectType
      ? { resourceId: `subj-${metricInstanceId}`, resourceType: subjectType }
      : undefined,
    annotations: {},
  }
}

function threshold(
  thresholdId: string,
  metricInstanceId: string,
  op: string,
  limit: string,
): Threshold {
  return {
    thresholdId,
    displayName: thresholdId,
    metricInstanceId,
    annotations: { 'emeland.io/threshold.operator': op, 'emeland.io/threshold.limit': limit },
  }
}

function value(
  metricValueId: string,
  metricInstanceId: string,
  v: string,
  displayName = metricValueId,
): MetricValue {
  return { metricValueId, displayName, metricInstanceId, value: v, annotations: {} }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  // the list endpoints are stubs; hydration refetches each item by id
  vi.mocked(fetchMetricInstanceById).mockImplementation(async (id) => instance(id))
  vi.mocked(fetchThresholdById).mockImplementation(async (id) => threshold(id, 'i1', 'gt', '1'))
  vi.mocked(fetchMetricValueById).mockImplementation(async (id) => value(id, 'i1', '0'))
})

describe('useMetricsStore', () => {
  it('treats instances with an absent or unresolvable metric reference as unmapped', async () => {
    vi.mocked(fetchMetrics).mockResolvedValue([metric('m1')])
    const list = [instance('i1', 'm1'), instance('i2'), instance('i3', 'm-missing')]
    vi.mocked(fetchMetricInstances).mockResolvedValue(list)
    vi.mocked(fetchMetricInstanceById).mockImplementation(async (id) =>
      list.find((i) => i.metricInstanceId === id)!,
    )

    const store = useMetricsStore()
    await store.load()
    await store.loadRelated()

    expect(store.getInstancesForMetric('m1').map((i) => i.metricInstanceId)).toEqual(['i1'])
    expect(store.unmappedInstances.map((i) => i.metricInstanceId).sort()).toEqual(['i2', 'i3'])
  })

  it('groups thresholds and values per instance, sorted by name', async () => {
    const thresholds = [
      threshold('t-b', 'i1', 'gt', '300'),
      threshold('t-a', 'i1', 'lt', '50'),
      threshold('t-c', 'i2', 'gt', '1'),
    ]
    const values = [
      value('v-z', 'i1', '412', 'Zulu'),
      value('v-a', 'i1', '410', 'Alpha'),
      value('v-x', 'i2', '0.5'),
    ]
    vi.mocked(fetchThresholds).mockResolvedValue(thresholds)
    vi.mocked(fetchThresholdById).mockImplementation(async (id) =>
      thresholds.find((t) => t.thresholdId === id)!,
    )
    vi.mocked(fetchMetricValues).mockResolvedValue(values)
    vi.mocked(fetchMetricValueById).mockImplementation(async (id) =>
      values.find((v) => v.metricValueId === id)!,
    )

    const store = useMetricsStore()
    await store.load()
    await store.loadRelated()

    expect(store.getThresholdsFor('i1').map((t) => t.thresholdId)).toEqual(['t-a', 't-b'])
    expect(store.getValuesFor('i1').map((v) => v.metricValueId)).toEqual(['v-a', 'v-z'])
    expect(store.getThresholdsFor('i-none')).toEqual([])
    expect(store.getValuesFor('i-none')).toEqual([])
  })

  it('derives per-instance status and the breached count', async () => {
    vi.mocked(fetchMetrics).mockResolvedValue([metric('m1')])
    const list = [instance('i1', 'm1'), instance('i2', 'm1'), instance('i3', 'm1')]
    vi.mocked(fetchMetricInstances).mockResolvedValue(list)
    vi.mocked(fetchMetricInstanceById).mockImplementation(async (id) =>
      list.find((i) => i.metricInstanceId === id)!,
    )
    const thresholds = [threshold('t1', 'i1', 'gt', '300'), threshold('t2', 'i2', 'gt', '300')]
    vi.mocked(fetchThresholds).mockResolvedValue(thresholds)
    vi.mocked(fetchThresholdById).mockImplementation(async (id) =>
      thresholds.find((t) => t.thresholdId === id)!,
    )
    const values = [value('v1', 'i1', '412'), value('v2', 'i2', '188')]
    vi.mocked(fetchMetricValues).mockResolvedValue(values)
    vi.mocked(fetchMetricValueById).mockImplementation(async (id) =>
      values.find((v) => v.metricValueId === id)!,
    )

    const store = useMetricsStore()
    await store.load()
    await store.loadRelated()

    expect(store.statusFor('i1')).toBe('breached')
    expect(store.statusFor('i2')).toBe('ok')
    expect(store.statusFor('i3')).toBe('no-reading')
    expect(store.statusByInstance.get('i1')).toBe('breached')
    expect(store.breachedCount).toBe(1)
  })

  it('exposes sorted distinct dimensions and subject types', async () => {
    vi.mocked(fetchMetrics).mockResolvedValue([
      metric('m1', 'saturation'),
      metric('m2', 'latency'),
      metric('m3', 'latency'),
      metric('m4'),
    ])
    const list = [
      instance('i1', 'm1', 'SystemInstance'),
      instance('i2', 'm2', 'Node'),
      instance('i3', 'm2'),
    ]
    vi.mocked(fetchMetricInstances).mockResolvedValue(list)
    vi.mocked(fetchMetricInstanceById).mockImplementation(async (id) =>
      list.find((i) => i.metricInstanceId === id)!,
    )

    const store = useMetricsStore()
    await store.load()
    await store.loadRelated()

    expect(store.dimensions).toEqual(['latency', 'saturation'])
    expect(store.subjectTypes).toEqual(['Node', 'SystemInstance'])
  })

  it('keeps the list stub and warns once when related details fail to hydrate', async () => {
    const list = [value('v1', 'i1', '1'), value('v2', 'i1', '2')]
    vi.mocked(fetchMetricValues).mockResolvedValue(list)
    vi.mocked(fetchMetricValueById).mockImplementation(async (id) => {
      if (id === 'v2') throw new Error('boom')
      return value(id, 'i1', '1', 'hydrated')
    })

    const store = useMetricsStore()
    await store.loadMetricValues()

    expect(store.metricValues.map((v) => v.displayName)).toEqual(['hydrated', 'v2'])
    const { toasts } = useToasts()
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({
      message: '1 of 2 related details failed to load',
      tone: 'warning',
    })
  })
})
