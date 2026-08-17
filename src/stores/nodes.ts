import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNodes, fetchNodeById, fetchNodeTypes, fetchNodeTypeById } from '@/api/nodes'
import type { Node, NodeType } from '@/types/node'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'
import { loadOnce, loadDetailRef } from './support'

export const useNodesStore = defineStore('nodes', () => {
  const nodes = ref<Node[]>([])
  const nodeTypes = ref<NodeType[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const typesLoading = ref(false)
  const typesLoaded = ref(false)

  const selectedTypeDetail = ref<NodeType | null>(null)

  const errs = useResourceErrors()

  const typeMap = computed(() => new Map(nodeTypes.value.map((nt) => [nt.nodeTypeId, nt])))

  function getTypeForNode(n: Node): NodeType | undefined {
    return n.nodeType ? typeMap.value.get(n.nodeType.nodeTypeId) : undefined
  }

  function getTypeName(n: Node): string {
    return n.nodeType?.displayName || getTypeForNode(n)?.displayName || 'Unknown'
  }

  function getTypeCategory(n: Node): string {
    return n.nodeType?.displayName || getTypeForNode(n)?.displayName || ''
  }

  async function load() {
    await loadOnce(
      { loading, loaded, error },
      async () => {
        nodes.value = await fetchNodes()
      },
      { resetError: true },
    )
  }

  async function loadNodeDetail(id: string): Promise<void> {
    await loadDetailInto(
      id,
      fetchNodeById,
      (full) => {
        nodes.value = nodes.value.map((n) => (n.nodeId === id ? full : n))
      },
      errs,
    )
  }

  async function loadNodeTypes(): Promise<void> {
    await loadOnce({ loading: typesLoading, loaded: typesLoaded, error }, async () => {
      nodeTypes.value = await fetchNodeTypes()
    })
  }

  async function loadNodeTypeDetail(id: string): Promise<void> {
    await loadDetailRef(selectedTypeDetail, () => fetchNodeTypeById(id))
  }

  return {
    nodes,
    nodeTypes,
    loading,
    loaded,
    error,
    typesLoading,
    typesLoaded,
    selectedTypeDetail,
    typeMap,
    getTypeForNode,
    getTypeName,
    getTypeCategory,
    hasDetailError: errs.hasDetailError,
    load,
    loadNodeDetail,
    loadNodeTypes,
    loadNodeTypeDetail,
  }
})
