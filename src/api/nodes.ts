import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Node, NodeType } from '@/types'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

export async function fetchNodes(): Promise<Node[]> {
  if (USE_MOCKS) {
    const { nodes } = await import('@/mocks/nodes')
    return nodes
  }
  const resp = await apiFetch(API.NODES.list)
  if (!resp.ok) throw new Error(`Failed to load nodes: ${resp.status}`)
  return resp.json()
}

export async function fetchNodeTypes(): Promise<NodeType[]> {
  if (USE_MOCKS) {
    const { nodeTypes } = await import('@/mocks/nodes')
    return nodeTypes
  }
  const resp = await apiFetch(API.NODE_TYPES.list)
  if (!resp.ok) throw new Error(`Failed to load node types: ${resp.status}`)
  return resp.json()
}
