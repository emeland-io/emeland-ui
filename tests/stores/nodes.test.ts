import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Node, NodeType } from '@/types/node'

vi.mock('@/api/nodes', () => ({
  fetchNodes: vi.fn(async () => [] as Node[]),
  fetchNodeById: vi.fn(),
  fetchNodeTypes: vi.fn(async () => [] as NodeType[]),
  fetchNodeTypeById: vi.fn(async () => ({}) as NodeType),
}))

import { fetchNodeTypes } from '@/api/nodes'
import { useNodesStore } from '@/stores/nodes'

const SENSOR: NodeType = { nodeTypeId: 't-sensor', displayName: 'Sensor', annotations: {} }

function node(nodeId: string, nodeTypeId?: string, nodeTypeName?: string): Node {
  return {
    nodeId,
    displayName: nodeId,
    nodeType: nodeTypeId ? { nodeTypeId, displayName: nodeTypeName ?? '' } : undefined,
    annotations: {},
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useNodesStore type resolution', () => {
  it('resolves type name via the embedded ref first, else the types map, else Unknown', async () => {
    const withoutEmbedded = node('n1', 't-sensor')
    const withEmbedded = node('n2', 'type-lorem', 'Embedded name')
    const withoutAny = node('n3')
    vi.mocked(fetchNodeTypes).mockResolvedValue([SENSOR])
    const store = useNodesStore()
    await store.loadNodeTypes()

    expect(store.getTypeName(withEmbedded)).toBe('Embedded name')
    expect(store.getTypeName(withoutEmbedded)).toBe('Sensor')
    expect(store.getTypeName(withoutAny)).toBe('Unknown')
  })

  it('gets the category the same way but falls back to an empty string', async () => {
    vi.mocked(fetchNodeTypes).mockResolvedValue([SENSOR])
    const store = useNodesStore()
    await store.loadNodeTypes()

    expect(store.getTypeCategory(node('n1', 't-sensor'))).toBe('Sensor')
    expect(store.getTypeCategory(node('n2'))).toBe('')
  })
})
