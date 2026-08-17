import { API } from '@/constants/api'
import type { Node, NodeType, NodeTypeRef } from '@/types/node'
import { USE_MOCKS, getJson } from './fetch'
import { decodeAnnotations, type InstanceListItem, type AnnotationsResponse } from './decode'

interface NodeResponse {
  nodeId: string
  displayName: string
  description?: string
  nodeType?: { nodeTypeId: string; displayName: string; resource?: string }
  annotations?: AnnotationsResponse
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
    annotations: decodeAnnotations(res.annotations as AnnotationsResponse | undefined),
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
  const data = await getJson<NodeResponse[]>(API.NODES.list, 'nodes')
  return data.map(decodeNode)
}

export async function fetchNodeById(id: string): Promise<Node> {
  if (USE_MOCKS) {
    const { nodes } = await import('@/mocks/nodes')
    const found = nodes.find((n) => n.nodeId === id)
    if (!found) throw new Error(`Node ${id} not found in mocks`)
    return found
  }
  return decodeNode(await getJson<NodeResponse>(API.NODES.byId(id), `node ${id}`))
}

export async function fetchNodeTypes(): Promise<NodeType[]> {
  if (USE_MOCKS) {
    const { nodeTypes } = await import('@/mocks/nodes')
    return nodeTypes
  }
  const data = await getJson<InstanceListItem[]>(API.NODE_TYPES.list, 'node types')
  return data.map(nodeTypeFromList)
}

export async function fetchNodeTypeById(id: string): Promise<NodeType> {
  if (USE_MOCKS) {
    const { nodeTypes } = await import('@/mocks/nodes')
    const found = nodeTypes.find((t) => t.nodeTypeId === id)
    if (!found) throw new Error(`Node type ${id} not found in mocks`)
    return found
  }
  return decodeNodeType(
    await getJson<Record<string, unknown>>(API.NODE_TYPES.byId(id), `node type ${id}`),
  )
}
