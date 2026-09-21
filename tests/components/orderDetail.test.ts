import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import OrderDetail from '@/components/orders/OrderDetail.vue'
import type { Order } from '@/types/order'
import { capabilities } from '@/mocks/capabilities'
import { parameters } from '@/mocks/parameters'
import { systems, systemInstances } from '@/mocks/systems'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useParametersStore } from '@/stores/parameters'
import { useSystemStore } from '@/stores/systems'

const ORDER: Order = {
  orderId: 'o1',
  displayName: 'Payments DE mail capacity',
  orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a1',
  orderedAt: '2026-05-04T10:12:00Z',
  items: [
    {
      orderItemId: 'i1',
      capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000001',
      capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101',
      boundValues: [
        { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p101', value: '10 users' },
        { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p102', value: 'Germany' },
      ],
      systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
      annotations: [],
    },
  ],
  annotations: [],
}

function mountDetail(order: Order | undefined) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  return mount(OrderDetail, {
    props: { order },
    global: { plugins: [router] },
  })
}

beforeEach(async () => {
  setActivePinia(createPinia())
  // seed the related stores directly (mock content is wire format; the
  // stores expect decoded domain objects, so assign decoded equivalents)
  useCapabilitiesStore().capabilities = capabilities.map((c) => ({
    capabilityId: c.capabilityId,
    displayName: c.displayName,
    versions: c.versions?.map((v) => ({
      capabilityVersionId: v.capabilityVersionId,
      version: v.version,
    })),
    annotations: {},
  }))
  useParametersStore().parameters = parameters.map((p) => ({
    parameterId: p.parameterId,
    displayName: p.displayName,
    values: p.values,
    annotations: {},
  }))
  const systemStore = useSystemStore()
  systemStore.systems = systems.map((s) => ({
    systemId: s.systemId,
    displayName: s.displayName,
    annotations: {},
  }))
  systemStore.systemInstances = systemInstances.map((i) => ({
    systemInstanceId: i.systemInstanceId,
    displayName: i.displayName,
    system: i.system,
    annotations: {},
  }))
})

describe('OrderDetail', () => {
  it('renders order items with resolved capability names', () => {
    const w = mountDetail(ORDER)
    expect(w.text()).toContain('Order items')
    expect(w.text()).toContain('Managed mail server')
  })

  it('renders bound parameter values with resolved parameter names', () => {
    const w = mountDetail(ORDER)
    expect(w.text()).toContain('Max concurrent users')
    expect(w.text()).toContain('10 users')
    expect(w.text()).toContain('Data residency')
    expect(w.text()).toContain('Germany')
  })

  it('links the fulfilling system when the order item became real', () => {
    const w = mountDetail(ORDER)
    expect(w.text()).toContain('Fulfilled')
    expect(w.text()).toContain('Application')
  })

  it('shows the ordered capability version', () => {
    const w = mountDetail(ORDER)
    expect(w.text()).toContain('v1.2.0')
  })

  it('renders the ordering org unit exactly once', () => {
    const w = mountDetail(ORDER)
    expect(w.text().match(/Ordered by/g)).toHaveLength(1)
  })

  it('marks unfulfilled items', () => {
    const w = mountDetail({
      ...ORDER,
      items: [{ ...ORDER.items[0], systemInstance: undefined }],
    })
    expect(w.text()).toContain('Open')
    expect(w.text()).toContain('Waiting for a system instance')
  })

  it('tags fulfilled items', () => {
    const w = mountDetail(ORDER)
    expect(w.text()).toContain('Fulfilled')
  })

  it('flags bound values outside the parameter valid values', () => {
    const w = mountDetail({
      ...ORDER,
      items: [
        {
          ...ORDER.items[0],
          boundValues: [
            { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p101', value: '500 users' },
          ],
        },
      ],
    })
    expect(w.text()).toContain('invalid value')
  })

  it('shows the empty state without a selection', () => {
    const w = mountDetail(undefined)
    expect(w.text()).toContain('Select an order to inspect')
  })
})
