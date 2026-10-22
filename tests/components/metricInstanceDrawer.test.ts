import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MetricInstanceDrawer from '@/components/metrics/MetricInstanceDrawer.vue'
import { useMetricsStore } from '@/stores/metrics'
import { useNodesStore } from '@/stores/nodes'

function seedStores() {
  const metrics = useMetricsStore()
  metrics.metrics = [
    { metricId: 'm1', displayName: 'p99 API latency', annotations: { 'emeland.io/unit': 'ms' } },
  ]
  metrics.metricInstances = [
    {
      metricInstanceId: 'i-orders',
      displayName: 'p99 latency for orders-api',
      metricId: 'm1',
      subject: { resourceId: 'n-orders', resourceType: 'Node' },
      annotations: {},
    },
    {
      metricInstanceId: 'i-silent',
      displayName: 'p99 latency for silent-api',
      metricId: 'm1',
      annotations: {},
    },
  ]
  // the critical one is seeded first, the drawer must still lead with the breached one
  metrics.thresholds = [
    {
      thresholdId: 't-critical',
      displayName: 'orders-api p99 critical',
      metricInstanceId: 'i-orders',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '500' },
    },
    {
      thresholdId: 't-warning',
      displayName: 'orders-api p99 warning',
      metricInstanceId: 'i-orders',
      annotations: { 'emeland.io/threshold.operator': 'gt', 'emeland.io/threshold.limit': '300' },
    },
  ]
  metrics.metricValues = [
    {
      metricValueId: 'v-now',
      displayName: 'Current p99 latency',
      metricInstanceId: 'i-orders',
      value: '412',
      annotations: {},
    },
    {
      metricValueId: 'v-prev',
      displayName: 'Previous window p99',
      metricInstanceId: 'i-orders',
      value: '250',
      annotations: {},
    },
  ]
  useNodesStore().nodes = [{ nodeId: 'n-orders', displayName: 'Sensor System A', annotations: {} }]
}

function mountDrawer(selectedInstanceId = 'i-orders') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  return mount(MetricInstanceDrawer, {
    props: { open: true, selectedInstanceId },
    global: { plugins: [router] },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  seedStores()
})

describe('MetricInstanceDrawer', () => {
  it('states the derived status in the header', () => {
    const w = mountDrawer()
    const tag = w.find('[title^="A current value breaches"]')
    expect(tag.exists()).toBe(true)
    expect(tag.text()).toBe('over limit')
  })

  it('shows no reading as the status for an instance without values', () => {
    const w = mountDrawer('i-silent')
    expect(w.find('[title="No current value reported"]').text()).toBe('no reading')
  })

  it('tints only the reading that breaches a threshold', () => {
    const w = mountDrawer()
    const numbers = w.findAll('.text-display')
    expect(numbers.map((n) => n.text())).toEqual(['412', '250'])
    expect(numbers[0]!.classes()).toContain('text-warning')
    expect(numbers[1]!.classes()).toContain('text-text-1')
  })

  it('lists the breached threshold first and keeps its id in the tooltip only', () => {
    const w = mountDrawer()
    const names = w.findAll('[title="t-warning"], [title="t-critical"]')
    expect(names.map((n) => n.attributes('title'))).toEqual(['t-warning', 't-critical'])
    expect(w.text()).not.toContain('t-warning')
    expect(names[0]!.text()).toContain('over limit')
    expect(names[1]!.text()).not.toContain('over limit')
  })

  it('draws the value scale with both limits', () => {
    const w = mountDrawer()
    expect(w.findAll('[data-reading-marker]')).toHaveLength(2)
    expect(w.findAll('[data-limit-label]').map((l) => l.text())).toEqual(['> 300 ms', '> 500 ms'])
    expect(mountDrawer('i-silent').find('[role="img"]').exists()).toBe(false)
  })
})
