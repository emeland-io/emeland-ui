import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { System } from '@/types/system'

vi.mock('@/api/systems', () => ({
  fetchSystems: vi.fn(),
  fetchSystemById: vi.fn(),
  fetchSystemInstances: vi.fn(async () => []),
  fetchSystemInstanceById: vi.fn(),
}))

import { fetchSystems } from '@/api/systems'
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
})
