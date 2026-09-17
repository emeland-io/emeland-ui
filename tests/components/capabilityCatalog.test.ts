import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CapabilityCardGrid from '@/components/capabilities/CapabilityCardGrid.vue'
import CapabilityTable from '@/components/capabilities/CapabilityTable.vue'
import { useFavorites, resetFavoritesRegistry } from '@/composables/useFavorites'
import type { Capability } from '@/types/capability'

vi.mock('@/api/capabilities', () => ({
  fetchCapabilities: vi.fn(async () => []),
  fetchCapabilityById: vi.fn(),
}))
vi.mock('@/api/orders', () => ({
  fetchOrders: vi.fn(async () => []),
  fetchOrderById: vi.fn(),
}))

function capability(name: string, version?: string, past = false): Capability {
  return {
    capabilityId: `id-${name}`,
    displayName: name,
    versions: version
      ? [
          {
            capabilityVersionId: `v-${name}`,
            version: {
              version,
              availableFrom: past ? '2000-01-01' : '2999-01-01',
            },
          },
        ]
      : [],
    annotations: {},
  }
}

const AVAILABLE = capability('Zeta', '2.0', true)
const AVAILABLE2 = capability('Alpha', '1.0', true)
const UPCOMING = capability('Beta', '0.9', false)
const NO_VERSIONS = capability('Gamma')

beforeEach(() => {
  setActivePinia(createPinia())
  resetFavoritesRegistry()
  useFavorites().clearFavorites()
})

describe('CapabilityCardGrid', () => {
  it('groups by lifecycle in display order, alphabetical within', () => {
    const w = mount(CapabilityCardGrid, {
      props: { capabilities: [NO_VERSIONS, UPCOMING, AVAILABLE, AVAILABLE2], selectedId: '' },
    })
    const sections = w.findAll('section')
    expect(sections).toHaveLength(3)
    expect(sections[0].text()).toContain('Available')
    expect(sections[1].text()).toContain('Upcoming')
    expect(sections[2].text()).toContain('No versions')

    const cards = sections[0].findAll('[data-row-id]')
    expect(cards.map((c) => c.attributes('data-row-id'))).toEqual(['id-Alpha', 'id-Zeta'])
  })

  it('marks the selected card and emits select on click', async () => {
    const w = mount(CapabilityCardGrid, {
      props: { capabilities: [AVAILABLE, AVAILABLE2], selectedId: 'id-Zeta' },
    })
    const zeta = w.find('[data-row-id="id-Zeta"]')
    expect(zeta.classes().join(' ')).toContain('border-accent')

    await w.find('[data-row-id="id-Alpha"]').trigger('click')
    expect(w.emitted('select')).toEqual([['id-Alpha']])
  })
})

describe('CapabilityTable', () => {
  it('sorts by name ascending by default and reports the order', () => {
    const w = mount(CapabilityTable, {
      props: { capabilities: [AVAILABLE, AVAILABLE2, UPCOMING], selectedId: '' },
    })
    const order = w.emitted('order')!.at(-1)![0] as string[]
    expect(order).toEqual(['id-Alpha', 'id-Beta', 'id-Zeta'])
  })

  it('re-sorts on header click and flips direction on repeat', async () => {
    const w = mount(CapabilityTable, {
      props: { capabilities: [AVAILABLE, AVAILABLE2], selectedId: '' },
    })
    const nameHeader = w.findAll('th').find((th) => th.text() === 'Capability')!
    await nameHeader.trigger('click')
    let order = w.emitted('order')!.at(-1)![0] as string[]
    expect(order).toEqual(['id-Zeta', 'id-Alpha'])

    await nameHeader.trigger('click')
    order = w.emitted('order')!.at(-1)![0] as string[]
    expect(order).toEqual(['id-Alpha', 'id-Zeta'])
  })

  it('emits select on row click', async () => {
    const w = mount(CapabilityTable, {
      props: { capabilities: [AVAILABLE], selectedId: '' },
    })
    await w.find('[data-row-id="id-Zeta"]').trigger('click')
    expect(w.emitted('select')).toEqual([['id-Zeta']])
  })
})

describe('favorites', () => {
  it('toggles a capability from the card grid without selecting it', async () => {
    const w = mount(CapabilityCardGrid, {
      props: { capabilities: [AVAILABLE, AVAILABLE2], selectedId: '' },
    })
    await w.find('[data-favorite-id="id-Zeta"]').trigger('click')

    expect(useFavorites().isFavorite('id-Zeta')).toBe(true)
    expect(w.emitted('select')).toBeUndefined()
  })

  it('pins favorites to the top of their lifecycle group in the card grid', async () => {
    useFavorites().toggleFavorite('id-Zeta')
    const w = mount(CapabilityCardGrid, {
      props: { capabilities: [AVAILABLE, AVAILABLE2], selectedId: '' },
    })

    const cards = w.findAll('[data-row-id]').map((c) => c.attributes('data-row-id'))
    expect(cards).toEqual(['id-Zeta', 'id-Alpha'])
  })

  it('toggles from a table row without selecting it, and sorts favorites first', async () => {
    const w = mount(CapabilityTable, {
      props: { capabilities: [AVAILABLE, AVAILABLE2], selectedId: '' },
    })
    await w.find('[data-favorite-id="id-Zeta"]').trigger('click')
    expect(w.emitted('select')).toBeUndefined()

    const starHeader = w.findAll('th')[0]
    await starHeader.trigger('click')
    const order = w.emitted('order')!.at(-1)![0] as string[]
    expect(order).toEqual(['id-Zeta', 'id-Alpha'])
  })
})
