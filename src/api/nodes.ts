import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Node, NodeType, NodeTypeRef } from '@/types/node'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface NodeResponse {
  id?: string
  nodeId?: string
  displayName: string
  description?: string
  nodeType?: { id: string; displayName: string; type?: string } | string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

interface NodeTypeResponse {
  id?: string
  nodeTypeId?: string
  displayName: string
  description?: string
  type?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

function decodeAnnotations(
  raw: { key: string; value: string }[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
}

function decodeNodeTypeRef(
  raw: { id: string; displayName: string; type?: string } | string | undefined,
): NodeTypeRef | undefined {
  if (!raw) return undefined
  if (typeof raw === 'string') {
    return { nodeTypeId: raw, displayName: '', type: '' }
  }
  return { nodeTypeId: raw.id, displayName: raw.displayName ?? '', type: raw.type ?? '' }
}

function decodeNode(res: NodeResponse): Node {
  return {
    nodeId: res.id ?? res.nodeId ?? '',
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    nodeType: decodeNodeTypeRef(res.nodeType),
    annotations: decodeAnnotations(res.annotations),
  }
}

function decodeNodeType(res: NodeTypeResponse): NodeType {
  return {
    nodeTypeId: res.id ?? res.nodeTypeId ?? '',
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    type: res.type ?? '',
    annotations: decodeAnnotations(res.annotations),
  }
}

export async function fetchNodes(): Promise<Node[]> {
  if (USE_MOCKS) {
    const { nodes } = await import('@/mocks/nodes')
    return nodes
  }
  const resp = await apiFetch(API.NODES.list)
  if (!resp.ok) throw new Error(`Failed to load nodes: ${resp.status}`)
  const data: NodeResponse[] = await resp.json()
  return data.map(decodeNode)
}

export async function fetchNodeById(id: string): Promise<Node> {
  if (USE_MOCKS) {
    const { nodes } = await import('@/mocks/nodes')
    const found = nodes.find((n) => n.nodeId === id)
    if (!found) throw new Error(`Node ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.NODES.byId(id))
  if (!resp.ok) throw new Error(`Failed to load node ${id}: ${resp.status}`)
  return decodeNode(await resp.json())
}

export async function fetchNodeTypes(): Promise<NodeType[]> {
  if (USE_MOCKS) {
    const { nodeTypes } = await import('@/mocks/nodes')
    return nodeTypes
  }
  const resp = await apiFetch(API.NODE_TYPES.list)
  if (!resp.ok) throw new Error(`Failed to load node types: ${resp.status}`)
  const data: NodeTypeResponse[] = await resp.json()
  return data.map(decodeNodeType)
}

export async function fetchNodeTypeById(id: string): Promise<NodeType> {
  if (USE_MOCKS) {
    const { nodeTypes } = await import('@/mocks/nodes')
    const found = nodeTypes.find((t) => t.nodeTypeId === id)
    if (!found) throw new Error(`Node type ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.NODE_TYPES.byId(id))
  if (!resp.ok) throw new Error(`Failed to load node type ${id}: ${resp.status}`)
  return decodeNodeType(await resp.json())
}
