import type { Api, ApiInstance } from '@/types/api'
import type { Component } from '@/types/component'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, frameUnmappedNodes, type DagNode as DagNodeSpec } from './layoutDag'
import { prefixedId } from './ids'
import { findingData, instanceNameRefs } from './helpers'

export interface ApiGraphInput {
  apis: Api[]
  components: Component[]
  systemName?: (id: string) => string | undefined
  findingCountOf?: (resourceId: string) => number
  findingKindsOf?: (resourceId: string) => string[]
  crossesOf?: (apiId: string) => boolean
  crossCountOf?: (apiId: string) => number
  instancesOf?: (apiId: string) => ApiInstance[]
  unmappedInstances?: ApiInstance[]
  instanceContext?: (instance: ApiInstance) => string | undefined
  instanceUnresolved?: (instance: ApiInstance) => boolean
  systemInstanceName?: (systemInstanceId: string) => string | undefined
  showComponents?: boolean
  showInstances?: boolean
}

export function buildApiGraph({
  apis,
  components,
  systemName,
  findingCountOf,
  findingKindsOf,
  crossesOf,
  crossCountOf,
  instancesOf,
  unmappedInstances,
  instanceContext,
  instanceUnresolved,
  systemInstanceName,
  showComponents = true,
  showInstances = false,
}: ApiGraphInput): GraphModel {
  const presentApis = new Set(apis.map((a) => a.apiId))
  const nodes: DagNodeSpec[] = apis.map((a) => ({
    id: prefixedId('api', a.apiId),
    kind: 'api' as const,
    data: {
      label: a.displayName,
      description: a.description || undefined,
      version: a.version?.version || undefined,
      crosses: crossesOf?.(a.apiId) || undefined,
      crossCount: crossCountOf?.(a.apiId) || undefined,
      ...findingData(a.apiId, findingCountOf, findingKindsOf),
      instanceNames: instanceNameRefs(instancesOf?.(a.apiId) ?? [], instanceUnresolved),
    },
  }))
  const edges: GraphEdge[] = []
  // unmapped instances are kept out of the dagre pass and placed in their own lane
  const unmappedNodes: DagNodeSpec[] = []

  // instances that realize a shown API attach to it; unmapped ones go in the lane
  if (showInstances) {
    for (const a of apis) {
      for (const inst of instancesOf?.(a.apiId) ?? []) {
        nodes.push({
          id: prefixedId('instance', inst.apiInstanceId),
          kind: 'instance',
          data: {
            label: inst.displayName,
            parent: prefixedId('api', a.apiId),
            context: instanceContext?.(inst),
            systemInstance: inst.systemInstance
              ? systemInstanceName?.(inst.systemInstance)
              : undefined,
            type: 'ApiInstance',
          },
        })
        edges.push({
          id: `has:${a.apiId}:${inst.apiInstanceId}`,
          source: prefixedId('api', a.apiId),
          target: prefixedId('instance', inst.apiInstanceId),
          kind: 'contains',
        })
      }
    }
    for (const inst of unmappedInstances ?? []) {
      unmappedNodes.push({
        id: prefixedId('instance', inst.apiInstanceId),
        kind: 'instance',
        data: {
          label: inst.displayName,
          context: instanceContext?.(inst),
          systemInstance: inst.systemInstance
            ? systemInstanceName?.(inst.systemInstance)
            : undefined,
          type: 'ApiInstance',
          unmapped: true,
          unresolved: inst.api ? true : undefined,
        },
      })
    }
  }

  // components that provide or consume any of the shown APIs
  const relevant = components.filter(
    (c) =>
      c.provides.some((id) => presentApis.has(id)) || c.consumes.some((id) => presentApis.has(id)),
  )

  if (showComponents) {
    for (const c of relevant) {
      nodes.push({
        id: prefixedId('component', c.componentId),
        kind: 'component',
        data: {
          label: c.displayName,
          description: c.description || undefined,
          system: systemName?.(c.system),
          ...findingData(c.componentId, findingCountOf, findingKindsOf),
        },
      })
      for (const apiId of c.provides) {
        if (!presentApis.has(apiId)) continue
        edges.push({
          id: `prov:${c.componentId}:${apiId}`,
          source: prefixedId('component', c.componentId),
          target: prefixedId('api', apiId),
          kind: 'provides',
        })
      }
      for (const apiId of c.consumes) {
        if (!presentApis.has(apiId)) continue
        edges.push({
          id: `cons:${apiId}:${c.componentId}`,
          source: prefixedId('api', apiId),
          target: prefixedId('component', c.componentId),
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
            source: prefixedId('api', from),
            target: prefixedId('api', to),
            kind: 'communicates',
          })
        }
      }
    }
  }

  return frameUnmappedNodes(layoutDag({ nodes, edges, direction: 'LR' }), unmappedNodes)
}
