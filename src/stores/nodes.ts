import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNodes, fetchNodeTypes } from '@/api/nodes'
import type { Node, NodeType } from '@/types/node'

export const useNodesStore = defineStore('nodes', () => {
  const nodes = ref<Node[]>([])
  const nodeTypes = ref<NodeType[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const typeMap = computed(() => new Map(nodeTypes.value.map((nt) => [nt.nodeTypeId, nt])))

  function getTypeForNode(n: Node): NodeType | undefined {
    return typeMap.value.get(n.nodeType)
  }

  function getTypeName(n: Node): string {
    return getTypeForNode(n)?.displayName ?? 'Unknown'
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    error.value = null
    try {
      const [n, nt] = await Promise.all([fetchNodes(), fetchNodeTypes()])
      nodes.value = n
      nodeTypes.value = nt
      loaded.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return {
    nodes,
    nodeTypes,
    loading,
    loaded,
    error,
    typeMap,
    getTypeForNode,
    getTypeName,
    load,
  }
})
