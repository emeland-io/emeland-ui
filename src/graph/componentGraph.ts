import type { Component } from '@/types/component'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, type DagNode as DagNodeSpec } from './layoutDag'

export interface ComponentGraphInput {
  components: Component[]
  apiName: (id: string) => string | undefined
  apiVersion?: (id: string) => string | undefined
  systemName?: (id: string) => string | undefined
}

export function buildComponentGraph({
  components,
  apiName,
  apiVersion,
  systemName,
}: ComponentGraphInput): GraphModel {
  const nodes: DagNodeSpec[] = []
  const edges: GraphEdge[] = []
  const apiNodeIds = new Set<string>()

  const ensureApiNode = (id: string) => {
    if (apiNodeIds.has(id)) return
    apiNodeIds.add(id)
    nodes.push({
      id: `api:${id}`,
      kind: 'api',
      data: { label: apiName(id) ?? id, version: apiVersion?.(id) },
    })
  }

  for (const c of components) {
    nodes.push({
      id: `comp:${c.componentId}`,
      kind: 'component',
      data: { label: c.displayName, system: systemName?.(c.system) },
    })
    for (const apiId of c.provides) {
      ensureApiNode(apiId)
      edges.push({
        id: `prov:${c.componentId}:${apiId}`,
        source: `comp:${c.componentId}`,
        target: `api:${apiId}`,
        kind: 'provides',
      })
    }
    for (const apiId of c.consumes) {
      ensureApiNode(apiId)
      edges.push({
        id: `cons:${apiId}:${c.componentId}`,
        source: `api:${apiId}`,
        target: `comp:${c.componentId}`,
        kind: 'consumes',
      })
    }
  }

  return layoutDag({ nodes, edges, direction: 'LR', stagger: 56 })
}
