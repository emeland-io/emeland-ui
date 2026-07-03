import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNodes, fetchNodeById, fetchNodeTypes, fetchNodeTypeById } from '@/api/nodes'
import type { Node, NodeType } from '@/types/node'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'

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
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      nodes.value = await fetchNodes()
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
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
    if (typesLoaded.value || typesLoading.value) return
    typesLoading.value = true
    try {
      nodeTypes.value = await fetchNodeTypes()
      typesLoaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      typesLoading.value = false
    }
  }

  async function loadNodeTypeDetail(id: string): Promise<void> {
    selectedTypeDetail.value = null
    try {
      selectedTypeDetail.value = await fetchNodeTypeById(id)
    } catch {
      selectedTypeDetail.value = null
    }
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
