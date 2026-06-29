import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Node, NodeType, NodeTypeRef } from '@/types/node'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface NodeResponse {
  nodeId: string
  displayName: string
  description?: string
  nodeType?: { nodeTypeId: string; displayName: string; resource?: string }
  annotations?: { key: string; value: string }[] | Record<string, string>
}

interface InstanceListItem {
  instanceId: string
  displayName: string
  reference: string
}

function decodeAnnotations(
  raw: { key: string; value: string }[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
}

function decodeNodeTypeRef(
  raw: { nodeTypeId: string; displayName: string } | undefined,
): NodeTypeRef | undefined {
  if (!raw) return undefined
  return { nodeTypeId: raw.nodeTypeId, displayName: raw.displayName ?? '' }
}

function decodeNode(res: NodeResponse): Node {
  return {
    nodeId: res.nodeId,
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    nodeType: decodeNodeTypeRef(res.nodeType),
    annotations: decodeAnnotations(res.annotations),
  }
}

function decodeNodeType(res: Record<string, unknown>): NodeType {
  return {
    nodeTypeId: (res.nodeTypeId as string) ?? (res.instanceId as string) ?? '',
    displayName: (res.displayName as string) ?? '',
    description: (res.description as string) ?? '',
    annotations: decodeAnnotations(res.annotations as { key: string; value: string }[] | undefined),
  }
}

function nodeTypeFromList(item: InstanceListItem): NodeType {
  return {
    nodeTypeId: item.instanceId,
    displayName: item.displayName,
    annotations: {},
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
  const data: InstanceListItem[] = await resp.json()
  return data.map(nodeTypeFromList)
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
