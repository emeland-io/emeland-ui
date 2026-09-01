import { defineStore } from 'pinia'
import { fetchNodes, fetchNodeById, fetchNodeTypes, fetchNodeTypeById } from '@/api/nodes'
import type { Node, NodeType } from '@/types/node'
import { createResourceCollection } from './resourceCollection'

export const useNodesStore = defineStore('nodes', () => {
  const res = createResourceCollection<Node, unknown, NodeType>({
    idOf: (n) => n.nodeId,
    fetchAll: fetchNodes,
    fetchById: fetchNodeById,
    types: {
      idOf: (t) => t.nodeTypeId,
      fetchAll: fetchNodeTypes,
      fetchById: fetchNodeTypeById,
    },
  })

  function getTypeForNode(n: Node): NodeType | undefined {
    return n.nodeType ? res.types.map.value.get(n.nodeType.nodeTypeId) : undefined
  }

  function getTypeName(n: Node): string {
    return n.nodeType?.displayName || getTypeForNode(n)?.displayName || 'Unknown'
  }

  function getTypeCategory(n: Node): string {
    return n.nodeType?.displayName || getTypeForNode(n)?.displayName || ''
  }

  return {
    nodes: res.items,
    nodeTypes: res.types.items,
    loading: res.loading,
    loaded: res.loaded,
    error: res.error,
    typesLoading: res.types.loading,
    typesLoaded: res.types.loaded,
    selectedTypeDetail: res.types.selectedDetail,
    typeMap: res.types.map,
    getTypeForNode,
    getTypeName,
    getTypeCategory,
    hasDetailError: res.hasDetailError,
    detailErrorMessage: res.detailErrorMessage,
    load: res.load,
    reload: res.reload,
    loadNodeDetail: res.loadDetail,
    loadNodeTypes: res.types.load,
    loadNodeTypeDetail: res.types.loadDetail,
  }
})
