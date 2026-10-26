import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MetricsList from '@/components/metrics/MetricsList.vue'
import { useMetricsStore } from '@/stores/metrics'
import { useNodesStore } from '@/stores/nodes'
import { useFindingsStore } from '@/stores/findings'
import type { Metric, MetricInstance } from '@/types/metric'

const METRICS: Metric[] = [
  {
    metricId: 'm1',
    displayName: 'p99 API latency',
    annotations: { 'emeland.io/unit': 'ms', 'emeland.io/dimension': 'latency' },
  },
  { metricId: 'm2', displayName: 'Queue depth', annotations: {} },
]

const INSTANCES: MetricInstance[] = [
  {
    metricInstanceId: 'i-orders',
    displayName: 'p99 latency for orders-api',
    metricId: 'm1',
    subject: { resourceId: 'n-orders', resourceType: 'Node' },
    annotations: {},
  },
  {
    metricInstanceId: 'i-orphan',
    displayName: 'Legacy batch queue depth',
    annotations: {},
  },
  {
    metricInstanceId: 'i-ghost',
    displayName: 'Gateway saturation',
    metricId: 'm-missing',
    subject: { resourceId: 'n-orders', resourceType: 'Node' },
    annotations: {},
  },
]

function seedStores() {
  const metrics = useMetricsStore()
  metrics.metrics = METRICS
  metrics.metricInstances = INSTANCES
  metrics.instancesLoaded = true
  metrics.thresholds = [
    {
      thresholdId: 't-orders',
      displayName: 'orders-api p99 warning',
      metricInstanceId: 'i-orders',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '300' },
    },
  ]
  metrics.metricValues = [
    {
      metricValueId: 'v-orders',
      displayName: 'Current p99 latency',
      metricInstanceId: 'i-orders',
      value: '412',
      annotations: {},
    },
  ]
  useNodesStore().nodes = [{ nodeId: 'n-orders', displayName: 'Sensor System A', annotations: {} }]
}

function mountList(props: Record<string, unknown> = {}) {
  const store = useMetricsStore()
  return mount(MetricsList, {
    props: {
      metrics: METRICS,
      selectedId: '',
      unmapped: store.unmappedInstances,
      ...props,
    },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  seedStores()
})

describe('MetricsList', () => {
  it('lists metrics with dimension, unit and the derived over-limit badge', () => {
    const w = mountList()
    const rows = w.findAll('[data-row-id]')
    const latency = rows.find((r) => r.attributes('data-row-id') === 'm1')!
    expect(latency.text()).toContain('p99 API latency')
    expect(latency.text()).toContain('latency')
    expect(latency.text()).toContain('ms')
    const badge = latency.find('[title$="(derived from current values)"]')
    expect(badge.text()).toBe('1/1')
    expect(badge.attributes('title')).toBe(
      '1 metric instance, 1 over limit (derived from current values)',
    )
    const queue = rows.find((r) => r.attributes('data-row-id') === 'm2')!
    expect(queue.find('[title$="(derived from current values)"]').exists()).toBe(false)
  })

  it('counts findings on the metric and on its instances once each', () => {
    useFindingsStore().findings = [
      {
        findingId: 'f-instance',
        displayName: 'Latency objective missed',
        resources: [
          { resourceId: 'i-orders', displayName: 'p99 latency', resourceType: 'MetricInstance' },
        ],
        annotations: {},
      },
      {
        findingId: 'f-both',
        displayName: 'Metric and instance',
        resources: [
          { resourceId: 'm1', displayName: 'p99 API latency', resourceType: 'Metric' },
          { resourceId: 'i-orders', displayName: 'p99 latency', resourceType: 'MetricInstance' },
        ],
        annotations: {},
      },
    ]
    const w = mountList()
    const latency = w.find('[data-row-id="m1"]')
    expect(latency.find('[title="2 findings"]').text()).toBe('2')
    expect(w.find('[data-row-id="m2"]').find('[title$="finding"]').exists()).toBe(false)
  })

  it('emits select for a metric row', async () => {
    const w = mountList()
    await w.find('[data-row-id="m2"]').trigger('click')
    expect(w.emitted('select')).toEqual([['m2']])
  })

  it('groups unmapped instances by their broken metric reference', () => {
    const w = mountList()
    const text = w.text()
    expect(text).toContain('Unmapped instances')
    expect(text).toContain('No metric reference')
    expect(text).toContain('Legacy batch queue depth')
    expect(text).toContain('unmapped')
    expect(text).toContain('Gateway saturation')
    expect(text).toContain('unresolved')
    // the subject resolves to its node name
    expect(text).toContain('Sensor System A')
  })

  it('opens unmapped instances in the drawer', async () => {
    const w = mountList()
    await w.find('[data-row-id="i-orphan"]').trigger('click')
    expect(w.emitted('open-instance')).toEqual([['i-orphan']])
  })

  it('hides the metric rows when collapsed but keeps the unmapped section', () => {
    const w = mountList({ listCollapsed: true })
    expect(w.find('[data-row-id="m1"]').exists()).toBe(false)
    expect(w.text()).toContain('Unmapped instances')
  })
})
