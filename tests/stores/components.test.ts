import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Component } from '@/types/component'

vi.mock('@/api/components', () => ({
  fetchComponents: vi.fn(),
  fetchComponentById: vi.fn(),
  fetchComponentInstances: vi.fn(async () => []),
  fetchComponentInstanceById: vi.fn(),
}))

import { fetchComponents } from '@/api/components'
import { useComponentStore } from '@/stores/components'

function comp(componentId: string, system = ''): Component {
  return { componentId, displayName: componentId, system, consumes: [], provides: [], annotations: {} }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useComponentStore', () => {
  it('groups components by system, empty bucket for unassigned and unknown', async () => {
    vi.mocked(fetchComponents).mockResolvedValue([
      comp('c1', 'sys-a'),
      comp('c2', 'sys-a'),
      comp('c3', 'sys-b'),
    ])
    const store = useComponentStore()
    await store.load()

    expect(store.componentsBySystem.get('sys-a')?.map((c) => c.componentId)).toEqual(['c1', 'c2'])
    expect(store.getComponentsForSystem('sys-a')).toHaveLength(2)
    expect(store.getComponentsForSystem('sys-b')).toHaveLength(1)
    expect(store.getComponentsForSystem('sys-missing')).toEqual([])
  })
})
