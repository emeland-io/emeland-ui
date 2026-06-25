import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNodes, fetchNodeById, fetchNodeTypes, fetchNodeTypeById } from '@/api/nodes'
import type { Node, NodeType } from '@/types/node'

export const useNodesStore = defineStore('nodes', () => {
  const nodes = ref<Node[]>([])
  const nodeTypes = ref<NodeType[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const typesLoading = ref(false)
  const typesLoaded = ref(false)

  const typeMap = computed(() => new Map(nodeTypes.value.map((nt) => [nt.nodeTypeId, nt])))

  function getTypeForNode(n: Node): NodeType | undefined {
    return n.nodeType ? typeMap.value.get(n.nodeType.nodeTypeId) : undefined
  }

  function getTypeName(n: Node): string {
    return n.nodeType?.displayName || getTypeForNode(n)?.displayName || 'Unknown'
  }

  function getTypeCategory(n: Node): string {
    return n.nodeType?.type || n.nodeType?.displayName || getTypeForNode(n)?.type || ''
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
    try {
      const full = await fetchNodeById(id)
      const idx = nodes.value.findIndex((n) => n.nodeId === id)
      if (idx !== -1) {
        nodes.value[idx] = full
      }
    } catch (e) {
      error.value = (e as Error).message
    }
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
    try {
      const full = await fetchNodeTypeById(id)
      const idx = nodeTypes.value.findIndex((t) => t.nodeTypeId === id)
      if (idx !== -1) {
        nodeTypes.value[idx] = full
      }
    } catch (e) {
      error.value = (e as Error).message
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
    typeMap,
    getTypeForNode,
    getTypeName,
    getTypeCategory,
    load,
    loadNodeDetail,
    loadNodeTypes,
    loadNodeTypeDetail,
  }
})
