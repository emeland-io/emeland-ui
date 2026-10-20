import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MetricDetail from '@/components/metrics/MetricDetail.vue'
import { useMetricsStore } from '@/stores/metrics'
import { useNodesStore } from '@/stores/nodes'
import { useSystemStore } from '@/stores/systems'
import { useFindingsStore } from '@/stores/findings'
import type { Metric, MetricInstance } from '@/types/metric'

const METRIC: Metric = {
  metricId: 'm1',
  displayName: 'p99 API latency',
  description: 'End-to-end request latency at the 99th percentile.',
  annotations: { 'emeland.io/unit': 'ms', 'emeland.io/dimension': 'latency' },
}

const INSTANCES: MetricInstance[] = [
  {
    metricInstanceId: 'i-orders',
    displayName: 'p99 latency for orders-api',
    metricId: 'm1',
    subject: { resourceId: 'n-orders', resourceType: 'Node' },
    annotations: {},
  },
  {
    metricInstanceId: 'i-payments',
    displayName: 'p99 latency for payments-api',
    metricId: 'm1',
    subject: { resourceId: 'si-app', resourceType: 'SystemInstance' },
    annotations: { 'emeland.io/unit': 's' },
  },
]

function seedStores() {
  const metrics = useMetricsStore()
  metrics.metrics = [METRIC]
  metrics.metricInstances = INSTANCES
  metrics.thresholds = [
    {
      thresholdId: 't-orders',
      displayName: 'orders-api p99 warning',
      metricInstanceId: 'i-orders',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '300' },
    },
    {
      thresholdId: 't-orders-critical',
      displayName: 'orders-api p99 critical',
      metricInstanceId: 'i-orders',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '500' },
    },
    {
      thresholdId: 't-payments',
      displayName: 'payments-api p99 warning',
      metricInstanceId: 'i-payments',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '0.3' },
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
    {
      metricValueId: 'v-orders-prev',
      displayName: 'Previous window p99',
      metricInstanceId: 'i-orders',
      value: '350',
      annotations: {},
    },
    {
      metricValueId: 'v-payments',
      displayName: 'Current p99 latency',
      metricInstanceId: 'i-payments',
      value: '0.188',
      annotations: {},
    },
  ]
  useFindingsStore().findings = [
    {
      findingId: 'f-orders',
      displayName: 'Latency objective missed',
      resources: [
        {
          resourceId: 'i-orders',
          displayName: 'p99 latency for orders-api',
          resourceType: 'MetricInstance',
        },
      ],
      annotations: {},
    },
  ]
  useNodesStore().nodes = [{ nodeId: 'n-orders', displayName: 'Sensor System A', annotations: {} }]
  useSystemStore().systemInstances = [
    {
      systemInstanceId: 'si-app',
      displayName: 'Application (ber-prod)',
      system: 's-app',
      annotations: {},
    },
  ]
}

function mountDetail(props: Record<string, unknown> = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  return mount(MetricDetail, {
    props: { metric: METRIC, instances: INSTANCES, ...props },
    global: { plugins: [router] },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  seedStores()
})

describe('MetricDetail', () => {
  it('shows the metric identity with dimension and unit tags', () => {
    const w = mountDetail()
    expect(w.text()).toContain('p99 API latency')
    expect(w.text()).toContain('End-to-end request latency')
    expect(w.text()).toContain('latency')
    expect(w.text()).toContain('ms')
    expect(w.text()).toContain('m1')
  })

  it('resolves subject names instead of ids', () => {
    const w = mountDetail()
    const text = w.text()
    expect(text).toContain('Sensor System A')
    expect(text).toContain('Application (ber-prod)')
    expect(w.find('tbody').text()).not.toContain('n-orders')
  })

  it('renders each reading with its effective unit, condition and status', () => {
    const w = mountDetail()
    const rows = w.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    const orders = rows.find((r) => r.text().includes('orders-api'))!
    const payments = rows.find((r) => r.text().includes('payments-api'))!
    expect(orders.text()).toContain('412')
    expect(orders.text()).toContain('> 300 ms')
    expect(orders.text()).toContain('over limit')
    // instance-level unit override wins over the metric unit
    expect(payments.text()).toContain('0.188')
    expect(payments.text()).toContain('> 0.3 s')
    expect(payments.text()).toContain('within limits')
  })

  it('lists every threshold with its name, breached first', () => {
    const w = mountDetail()
    const orders = w.findAll('tbody tr').find((r) => r.text().includes('orders-api'))!
    const text = orders.text()
    expect(text).toContain('> 300 ms')
    expect(text).toContain('> 500 ms')
    expect(text.indexOf('p99 warning')).toBeLessThan(text.indexOf('p99 critical'))
  })

  it('lists every value with its name', () => {
    const w = mountDetail()
    const orders = w.findAll('tbody tr').find((r) => r.text().includes('orders-api'))!
    expect(orders.text()).toContain('412')
    expect(orders.text()).toContain('350')
    expect(orders.text()).toContain('Previous window p99')
    expect(orders.text()).not.toContain('+1')
  })

  it('marks an instance-level unit override and shows findings per row', () => {
    const w = mountDetail()
    const rows = w.findAll('tbody tr')
    const orders = rows.find((r) => r.text().includes('orders-api'))!
    const payments = rows.find((r) => r.text().includes('payments-api'))!
    expect(payments.find('[title^="Unit set on the instance"]').exists()).toBe(true)
    expect(orders.find('[title^="Unit set on the instance"]').exists()).toBe(false)
    expect(orders.find('[title="1 finding"]').exists()).toBe(true)
    expect(payments.find('[title="1 finding"]').exists()).toBe(false)
  })

  it('puts breached readings first and tallies statuses in the readings header', () => {
    const w = mountDetail()
    expect(w.findAll('tbody tr')[0].text()).toContain('orders-api')
    expect(w.text()).toContain('1 over limit')
    expect(w.text()).toContain('1 within limits')
    // mixed units (ms vs s): no comparable range
    expect(w.text()).not.toContain('–')
  })

  it('shows the value range when all readings share one unit', () => {
    const w = mountDetail({
      instances: INSTANCES.map((i) => ({ ...i, annotations: {} })),
    })
    expect(w.text()).toContain('0.188 – 412 ms')
  })

  it('rolls findings on the instances up into the findings section', () => {
    useFindingsStore().findings.push({
      findingId: 'f-metric',
      displayName: 'Metric lacks an owner',
      resources: [{ resourceId: 'm1', displayName: 'p99 API latency', resourceType: 'Metric' }],
      annotations: {},
    })
    const w = mountDetail()
    const text = w.text()
    expect(text).toContain('Latency objective missed')
    expect(text).toContain('on p99 latency for orders-api')
    expect(text).toContain('Metric lacks an owner')
    expect(text).not.toContain('No findings.')
    expect(w.findAll('[title^="on "]')).toHaveLength(1)
  })

  it('shows subjects with the glyph of their type, instances in the instance shape', () => {
    const w = mountDetail()
    const rows = w.findAll('tbody tr')
    const orders = rows.find((r) => r.text().includes('orders-api'))!
    const payments = rows.find((r) => r.text().includes('payments-api'))!
    expect(orders.find('[title="Node"]').text()).toBe('N')
    const app = payments.find('[title="System instance"]')
    expect(app.text()).toBe('S')
    expect(app.classes()).toContain('type-chip-instance')
  })

  it('opens a row with the keyboard and moves focus between rows', async () => {
    const w = mountDetail()
    const rows = w.findAll('tbody tr')
    await rows[1].trigger('keydown', { key: 'Enter' })
    expect(w.emitted('open-instance')).toEqual([['i-payments']])
    expect(rows[0].attributes('tabindex')).toBe('0')
  })

  it('moves focus to the next row on ArrowDown', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
    })
    const w = mount(MetricDetail, {
      props: { metric: METRIC, instances: INSTANCES },
      global: { plugins: [router] },
      attachTo: document.body,
    })
    const rows = w.findAll('tbody tr')
    ;(rows[0].element as HTMLElement).focus()
    await rows[0].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(rows[1].element)
    await rows[1].trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(rows[0].element)
    w.unmount()
  })

  it('emits open-instance when a reading row is clicked', async () => {
    const w = mountDetail()
    const payments = w.findAll('tbody tr').find((r) => r.text().includes('payments'))!
    await payments.trigger('click')
    expect(w.emitted('open-instance')).toEqual([['i-payments']])
  })

  it('explains an instance-less metric in the section idiom', () => {
    const w = mountDetail({ instances: [] })
    expect(w.text()).toContain('Metric instances')
    expect(w.text()).toContain('No metric instances reference this metric.')
    expect(w.find('table').exists()).toBe(false)
  })

  it('shows the empty state without a metric', () => {
    const w = mountDetail({ metric: undefined, instances: [] })
    expect(w.text()).toContain('Select a metric to inspect')
  })
})
