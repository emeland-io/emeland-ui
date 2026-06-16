import { apiFetch } from './fetch'
import type { Node, NodeType } from '@/types/node'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

export async function fetchNodes(): Promise<Node[]> {
  if (USE_MOCKS) {
    const { nodes } = await import('@/mocks/nodes')
    return nodes
  }
  const resp = await apiFetch('/landscape/nodes')
  if (!resp.ok) throw new Error(`Failed to load nodes: ${resp.status}`)
  return resp.json()
}

export async function fetchNodeTypes(): Promise<NodeType[]> {
  if (USE_MOCKS) {
    const { nodeTypes } = await import('@/mocks/nodes')
    return nodeTypes
  }
  const resp = await apiFetch('/landscape/nodeTypes')
  if (!resp.ok) throw new Error(`Failed to load node types: ${resp.status}`)
  return resp.json()
}
