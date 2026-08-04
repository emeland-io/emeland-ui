import type { Api } from '@/types/api'
import type { Component } from '@/types/component'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, type DagNode as DagNodeSpec } from './layoutDag'

export interface ApiGraphInput {
  apis: Api[]
  components: Component[]
  systemName?: (id: string) => string | undefined
  findingCountOf?: (resourceId: string) => number
  findingKindsOf?: (resourceId: string) => string[]
  crossesOf?: (apiId: string) => boolean
  crossCountOf?: (apiId: string) => number
  showComponents?: boolean
}

export function buildApiGraph({
  apis,
  components,
  systemName,
  findingCountOf,
  findingKindsOf,
  crossesOf,
  crossCountOf,
  showComponents = true,
}: ApiGraphInput): GraphModel {
  const presentApis = new Set(apis.map((a) => a.apiId))
  const nodes: DagNodeSpec[] = apis.map((a) => ({
    id: `api:${a.apiId}`,
    kind: 'api' as const,
    data: {
      label: a.displayName,
      description: a.description || undefined,
      version: a.version?.version || undefined,
      crosses: crossesOf?.(a.apiId) || undefined,
      crossCount: crossCountOf?.(a.apiId) || undefined,
      findings: findingCountOf?.(a.apiId) || undefined,
      findingKinds: findingKindsOf?.(a.apiId),
    },
  }))
  const edges: GraphEdge[] = []

  // components that provide or consume any of the shown APIs
  const relevant = components.filter(
    (c) =>
      c.provides.some((id) => presentApis.has(id)) || c.consumes.some((id) => presentApis.has(id)),
  )

  if (showComponents) {
    for (const c of relevant) {
      nodes.push({
        id: `comp:${c.componentId}`,
        kind: 'component',
        data: {
          label: c.displayName,
          description: c.description || undefined,
          system: systemName?.(c.system),
          findings: findingCountOf?.(c.componentId) || undefined,
          findingKinds: findingKindsOf?.(c.componentId),
        },
      })
      for (const apiId of c.provides) {
        if (!presentApis.has(apiId)) continue
        edges.push({
          id: `prov:${c.componentId}:${apiId}`,
          source: `comp:${c.componentId}`,
          target: `api:${apiId}`,
          kind: 'provides',
        })
      }
      for (const apiId of c.consumes) {
        if (!presentApis.has(apiId)) continue
        edges.push({
          id: `cons:${apiId}:${c.componentId}`,
          source: `api:${apiId}`,
          target: `comp:${c.componentId}`,
          kind: 'consumes',
        })
      }
    }
  } else {
    // collapse the components: link APIs directly when a component consumes
    // one API and provides the other
    const seen = new Set<string>()
    for (const c of relevant) {
      for (const from of c.consumes) {
        if (!presentApis.has(from)) continue
        for (const to of c.provides) {
          if (!presentApis.has(to) || to === from) continue
          const key = `${from}->${to}`
          if (seen.has(key)) continue
          seen.add(key)
          edges.push({
            id: `via:${key}`,
            source: `api:${from}`,
            target: `api:${to}`,
            kind: 'communicates',
          })
        }
      }
    }
  }

  return layoutDag({ nodes, edges, direction: 'LR' })
}
