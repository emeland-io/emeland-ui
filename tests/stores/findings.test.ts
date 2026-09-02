import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Finding } from '@/types/finding'

vi.mock('@/api/findings', () => ({
  fetchFindings: vi.fn(),
  fetchFindingById: vi.fn(),
  fetchFindingTypes: vi.fn(async () => []),
  fetchFindingTypeById: vi.fn(),
}))

import { fetchFindings } from '@/api/findings'
import { useFindingsStore } from '@/stores/findings'

function finding(findingId: string, typeName?: string, ...resourceIds: string[]): Finding {
  return {
    findingId,
    displayName: findingId,
    findingType: typeName ? { findingTypeId: 't-x', displayName: typeName } : undefined,
    resources: resourceIds.map((resourceId) => ({
      resourceId,
      displayName: resourceId,
      resourceType: 'Context' as const,
    })),
    annotations: {},
    reference: undefined,
  }
}

const findingItems: Finding[] = [
  {
    findingId: 'f-x',
    displayName: 'x',
    findingType: { findingTypeId: 't-1', displayName: 'Explicit name' },
    resources: [],
    annotations: {},
  },
  { findingId: 'f-y', displayName: 'y', resources: [], annotations: {} },
]

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useFindingsStore per-resource aggregation', () => {
  it('counts findings per resource id', async () => {
    vi.mocked(fetchFindings).mockResolvedValue([
      finding('f1', 't-missing', 'ctx-1', 'ctx-2'),
      finding('f2', 't-missing', 'ctx-1'),
      finding('f3', undefined, 'sys-1'),
    ])
    const store = useFindingsStore()
    await store.load()

    expect(store.findingCountFor('ctx-1')).toBe(2)
    expect(store.findingCountFor('ctx-2')).toBe(1)
    expect(store.findingCountFor('sys-1')).toBe(1)
    expect(store.findingCountFor('ctx-3')).toBe(0)
  })

  it('collects sorted distinct kinds per resource', async () => {
    vi.mocked(fetchFindings).mockResolvedValue([
      finding('f1', 'ConsumerLagExceeded', 'ctx-1'),
      finding('f2', 'ContextTypeMissing', 'ctx-1'),
      finding('f3', 'ConsumerLagExceeded', 'ctx-1'),
    ])
    const store = useFindingsStore()
    await store.load()

    expect(store.findingKindsFor('ctx-1')).toEqual(['ConsumerLagExceeded', 'ContextTypeMissing'])
  })

  it('labels findings with an explicit displayName over Unknown', () => {
    const store = useFindingsStore()
    expect(store.getKindForFinding(findingItems[0])).toBe('Explicit name')
    expect(store.getKindForFinding(findingItems[1])).toBe('Unknown')
  })
})
