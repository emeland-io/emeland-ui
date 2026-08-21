import { API } from '@/constants/api'
import type { Node, NodeType, NodeTypeRef } from '@/types/node'
import { decodeAnnotations, type AnnotationsResponse } from './decode'
import { decodeTypeEntity, makeResourceApi } from './resource'

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

// the node list endpoint returns full nodes, not minimal list items
const nodes = makeResourceApi<Node, NodeResponse, NodeResponse>({
  name: 'Node',
  namePlural: 'nodes',
  listPath: API.NODES.list,
  byIdPath: API.NODES.byId,
  mocks: async () => (await import('@/mocks/nodes')).nodes,
  idOf: (n) => n.nodeId,
  fromList: decodeNode,
  decode: decodeNode,
})

export const fetchNodes = nodes.fetchAll
export const fetchNodeById = nodes.fetchById

const nodeTypes = makeResourceApi<NodeType, Record<string, unknown>>({
  name: 'Node type',
  namePlural: 'node types',
  listPath: API.NODE_TYPES.list,
  byIdPath: API.NODE_TYPES.byId,
  mocks: async () => (await import('@/mocks/nodes')).nodeTypes,
  idOf: (t) => t.nodeTypeId,
  decode: (res) => decodeTypeEntity('nodeTypeId', res),
})

export const fetchNodeTypes = nodeTypes.fetchAll
export const fetchNodeTypeById = nodeTypes.fetchById
