import { API } from '@/constants/api'
import type { Node, NodeType, NodeTypeRef } from '@/types/node'
import { decodeAnnotations } from './decode'
import { MINIMAL_LIST_FIELDS, decodeTypeEntity, makeResourceApi } from './resource'
import type {
  NodeView as NodeWire,
  NodeSummaryView as NodeSummaryWire,
  NodeType as NodeTypeWire,
} from './gen/types.gen'
import { zNodeSummaryView, zNodeType, zNodeView, zInstanceListItem } from './gen/zod.gen'

type NodeTypeViewWire = NodeWire['nodeType']

function decodeNodeTypeRef(raw: NodeTypeViewWire): NodeTypeRef | undefined {
  if (!raw) return undefined
  return { nodeTypeId: raw.nodeTypeId, displayName: raw.displayName ?? '' }
}

function decodeNode(res: NodeWire | NodeSummaryWire): Node {
  return {
    nodeId: res.nodeId,
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    nodeType: decodeNodeTypeRef(res.nodeType),
    annotations: decodeAnnotations(res.annotations),
  }
}

// the node list endpoint returns node summaries, not minimal list items
const nodes = makeResourceApi<Node, NodeWire, NodeSummaryWire>({
  name: 'Node',
  namePlural: 'nodes',
  listPath: API.NODES.list,
  byIdPath: API.NODES.byId,
  mocks: async () => (await import('@/mocks/nodes')).nodes,
  idKey: 'nodeId',
  idOf: (n) => n.nodeId,
  listSchema: zNodeSummaryView,
  fromList: decodeNode,
  responseSchema: zNodeView,
  decode: decodeNode,
})

export const fetchNodes = nodes.fetchAll
export const fetchNodeById = nodes.fetchById

const nodeTypes = makeResourceApi<NodeType, NodeTypeWire>({
  name: 'Node type',
  namePlural: 'node types',
  listPath: API.NODE_TYPES.list,
  byIdPath: API.NODE_TYPES.byId,
  mocks: async () => (await import('@/mocks/nodes')).nodeTypes,
  idKey: 'nodeTypeId',
  idOf: (t) => t.nodeTypeId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zNodeType,
  decode: (res) => decodeTypeEntity('nodeTypeId', res),
})

export const fetchNodeTypes = nodeTypes.fetchAll
export const fetchNodeTypeById = nodeTypes.fetchById
