import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { System, SystemInstance } from '@/types/system'

vi.mock('@/api/systems', () => ({
  fetchSystems: vi.fn(),
  fetchSystemById: vi.fn(),
  fetchSystemInstances: vi.fn(async () => []),
  fetchSystemInstanceById: vi.fn(),
}))

import {
  fetchSystems,
  fetchSystemById,
  fetchSystemInstances,
  fetchSystemInstanceById,
} from '@/api/systems'
import { useSystemStore } from '@/stores/systems'

const ROOT: System = { systemId: 'root', displayName: 'the root', abstract: false, annotations: {} }
const CHILD: System = {
  systemId: 'child',
  displayName: 'child',
  abstract: true,
  parent: 'root',
  annotations: {},
}
const DANGLING: System = {
  systemId: 'dangling',
  displayName: 'broken parent ref',
  parent: 'ghost',
  annotations: {},
}

async function setupStore(items: System[] = [ROOT, CHILD, DANGLING]) {
  vi.mocked(fetchSystems).mockResolvedValue(items)
  const store = useSystemStore()
  await store.load()
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useSystemStore', () => {
  it('aliases the collection state like any factory consumer would', async () => {
    const store = await setupStore()
    expect(store.systems.map((s) => s.systemId)).toEqual(
      [ROOT, CHILD, DANGLING].map((s) => s.systemId),
    )
    expect(store.loaded).toBe(true)
  })

  it('resolves parent display names and flags dangling parent refs', async () => {
    const store = await setupStore()
    expect(store.getParentName(CHILD)).toBe('the root')
    expect(store.getParentName(ROOT)).toBeUndefined()
    expect(store.isParentUnresolved(CHILD)).toBe(false)
    expect(store.isParentUnresolved(ROOT)).toBe(false)
    expect(store.isParentUnresolved(DANGLING)).toBe(true)
  })

  it('classifies abstract vs concrete kinds', async () => {
    const store = await setupStore()
    expect(store.getKindForSystem(CHILD)).toBe('Abstract')
    expect(store.getKindForSystem(ROOT)).toBe('Concrete')
  })

  it('routes detail hydration through the deduped factory path', async () => {
    vi.mocked(fetchSystemById).mockImplementation(async (id) => ({
      ...ROOT,
      systemId: id,
      description: 'full',
    }))
    const store = await setupStore()

    await Promise.all([store.loadSystemDetail('root'), store.loadSystemDetail('root')])
    await store.loadSystemDetail('root')
    expect(fetchSystemById).toHaveBeenCalledTimes(1)
    expect(store.systemMap.get('root')?.description).toBe('full')
  })

  it('exposes instances with parent grouping and unmapped detection', async () => {
    const instance = (id: string, system: string): SystemInstance => ({
      systemInstanceId: id,
      displayName: id,
      system,
      annotations: {},
    })
    vi.mocked(fetchSystemInstances).mockResolvedValue([instance('i1', 'root'), instance('i2', '')])
    // hydration must preserve each instance's parent (i2 stays parentless)
    vi.mocked(fetchSystemInstanceById).mockImplementation(async (id) =>
      instance(id, id === 'i1' ? 'root' : ''),
    )
    const store = await setupStore()
    await store.loadSystemInstances()

    expect(store.getInstancesForSystem('root').map((i) => i.systemInstanceId)).toEqual(['i1'])
    expect(store.unmappedInstances.map((i) => i.systemInstanceId)).toEqual(['i2'])
  })
})
