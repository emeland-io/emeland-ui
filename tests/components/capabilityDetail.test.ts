import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CapabilityDetail from '@/components/capabilities/CapabilityDetail.vue'
import { useOrdersStore } from '@/stores/orders'
import { useCapabilitiesStore } from '@/stores/capabilities'
import { useParametersStore } from '@/stores/parameters'
import type { Capability } from '@/types/capability'

const CAPABILITY: Capability = {
  capabilityId: 'c1',
  displayName: 'Managed mail server',
  description: 'Hosted mailboxes with SMTP and IMAP access',
  versions: [
    {
      capabilityVersionId: 'v1',
      version: { version: '1.2.0', availableFrom: '2026-01-15T00:00:00Z' },
      variants: [
        {
          inputParameters: [
            { parameter: 'p1', values: ['10 users'] },
            { parameter: 'p2', values: ['Germany'] },
          ],
          dependencies: [
            { capability: 'c2', outputParameters: [{ parameter: 'p3', values: ['50 GB'] }] },
          ],
        },
        {
          inputParameters: [{ parameter: 'p1', values: ['1000 users'] }],
        },
      ],
    },
    {
      capabilityVersionId: 'v0',
      version: {
        version: '1.1.0',
        availableFrom: '2025-06-01T00:00:00Z',
        deprecatedFrom: '2026-03-01T00:00:00Z',
      },
    },
  ],
  annotations: {},
}

function seedParameters() {
  useParametersStore().parameters = [
    {
      parameterId: 'p1',
      displayName: 'Max concurrent users',
      values: ['10 users', '100 users', '1000 users'],
      annotations: {},
    },
    {
      parameterId: 'p2',
      displayName: 'Data residency',
      values: ['Germany'],
      annotations: {},
    },
    {
      parameterId: 'p3',
      displayName: 'Storage capacity',
      values: ['50 GB', '250 GB'],
      annotations: {},
    },
  ]
}

function mountDetail(capability: Capability | undefined) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  return mount(CapabilityDetail, {
    props: { capability },
    global: { plugins: [router] },
  })
}

beforeEach(() => setActivePinia(createPinia()))

describe('CapabilityDetail', () => {
  it('leads with the description as the header subtitle', () => {
    const w = mountDetail(CAPABILITY)
    expect(w.text()).toContain('Hosted mailboxes with SMTP and IMAP access')
  })

  it('renders versions with their lifecycle windows', async () => {
    const w = mountDetail(CAPABILITY)
    const text = w.text()
    expect(text).toContain('Versions')
    expect(text).toContain('v1.2.0')
    expect(text).toContain('v1.1.0')
    expect(text).toContain('Available from')

    // older versions start collapsed; expand to read lifecycle dates
    const older = w
      .findAll('button')
      .find((btn) => btn.text().includes('v1.1.0'))
    expect(older).toBeDefined()
    await older!.trigger('click')
    expect(w.text()).toContain('Deprecated from')
    expect(w.text()).toContain('2025-06-01')
  })

  it('tags each version with its lifecycle status', () => {
    const w = mountDetail(CAPABILITY)
    const text = w.text()
    expect(text).toContain('Available')
    expect(text).toContain('Deprecated')
  })

  it('shows variants with parameter rows and dependency lines', () => {
    seedParameters()
    const w = mountDetail(CAPABILITY)
    const text = w.text()
    expect(text).toContain('Variants')
    expect(text).toContain('Variant 1')
    expect(text).toContain('Variant 2')
    expect(text).toContain('Max concurrent users')
    expect(text).toContain('10 users')
    expect(text).toContain('Data residency')
    expect(text).toContain('Germany')
    expect(text).toContain('1000 users')
  })

  it('notes when there are no versions yet', () => {
    const w = mountDetail({ ...CAPABILITY, versions: undefined })
    expect(w.text()).toContain('No versions offered yet.')
  })

  it('lists orders that reference the capability', () => {
    useOrdersStore().orders = [
      {
        orderId: 'o1',
        displayName: 'Payments DE mail capacity',
        orderedAt: '2026-05-04T10:12:00Z',
        items: [{ orderItemId: 'i1', capability: 'c1', annotations: {} }],
        annotations: {},
      },
      {
        orderId: 'o2',
        displayName: 'Unrelated order',
        items: [{ orderItemId: 'i2', capability: 'other', annotations: {} }],
        annotations: {},
      },
    ]
    const w = mountDetail(CAPABILITY)
    expect(w.text()).toContain('Ordered in')
    expect(w.text()).toContain('Payments DE mail capacity')
    expect(w.text()).not.toContain('Unrelated order')
  })

  it('notes when no order references the capability', () => {
    const w = mountDetail(CAPABILITY)
    expect(w.text()).toContain('Not referenced by any order yet.')
  })

  it('shows the empty state without a selection', () => {
    const w = mountDetail(undefined)
    expect(w.text()).toContain('Select a capability to inspect')
  })

  it('shows per-variant dependencies and depends-on link cards', () => {
    seedParameters()
    useCapabilitiesStore().capabilities = [
      CAPABILITY,
      {
        capabilityId: 'c2',
        displayName: 'Storage budget',
        description: 'Quota slice of the shared storage pool',
        annotations: {},
      },
    ]
    const w = mountDetail(CAPABILITY)
    const text = w.text()
    expect(text).toContain('Depends on')
    expect(text).toContain('Requires')
    expect(text).toContain('Storage budget')
    expect(text).toContain('Requires: Storage capacity 50 GB')
    expect(text).toContain('Storage capacity 50 GB')
    expect(text).toContain('Quota slice of the shared storage pool')
    expect(text).not.toContain('c2')
  })

  it('shows offered parameter values on variants, not a separate parameters section', () => {
    seedParameters()
    const w = mountDetail(CAPABILITY)
    const text = w.text()
    expect(text).not.toContain('Parameters')
    expect(text).toContain('Max concurrent users')
    expect(text).toContain('10 users')
    expect(text).toContain('Data residency')
    expect(text).toContain('1000 users')
    expect(text).not.toContain('100 users')
  })
})
