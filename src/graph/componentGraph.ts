import type { Component, ComponentInstance } from '@/types/component'
import type { GraphModel, GraphEdge } from '@/types/graph'
import { layoutDag, frameGhostNodes, type DagNode as DagNodeSpec } from './layoutDag'

export interface ComponentGraphInput {
  components: Component[]
  apiName: (id: string) => string | undefined
  apiVersion?: (id: string) => string | undefined
  apiDescription?: (id: string) => string | undefined
  systemName?: (id: string) => string | undefined
  findingCountOf?: (componentId: string) => number
  findingKindsOf?: (componentId: string) => string[]
  instancesOf?: (componentId: string) => ComponentInstance[]
  instanceContext?: (instance: ComponentInstance) => string | undefined
  systemInstanceName?: (systemInstanceId: string) => string | undefined
  unmappedInstances?: ComponentInstance[]
  showInstances?: boolean
  showApis?: boolean
}

export function buildComponentGraph({
  components,
  apiName,
  apiVersion,
  apiDescription,
  systemName,
  findingCountOf,
  findingKindsOf,
  instancesOf,
  instanceContext,
  systemInstanceName,
  unmappedInstances,
  showInstances = true,
  showApis = true,
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
      data: {
        label: apiName(id) ?? id,
        description: apiDescription?.(id),
        version: apiVersion?.(id),
      },
    })
  }

  for (const c of components) {
    const instances = instancesOf?.(c.componentId) ?? []
    nodes.push({
      id: `comp:${c.componentId}`,
      kind: 'component',
      data: {
        label: c.displayName,
        description: c.description || undefined,
        system: systemName?.(c.system),
        findings: findingCountOf?.(c.componentId) || undefined,
        findingKinds: findingKindsOf?.(c.componentId),
        instanceNames: instances.length ? instances.map((inst) => inst.displayName) : undefined,
      },
    })
    if (showInstances) {
      for (const inst of instances) {
        nodes.push({
          id: `inst:${inst.componentInstanceId}`,
          kind: 'instance',
          data: {
            label: inst.displayName,
            parent: `comp:${c.componentId}`,
            component: c.displayName,
            context: instanceContext?.(inst),
            systemInstance: systemInstanceName?.(inst.systemInstance),
            type: 'ComponentInstance',
          },
        })
        edges.push({
          id: `has:${c.componentId}:${inst.componentInstanceId}`,
          source: `comp:${c.componentId}`,
          target: `inst:${inst.componentInstanceId}`,
          kind: 'contains',
        })
      }
      // unmapped instances: ghost nodes without a parent edge
      for (const inst of unmappedInstances ?? []) {
        nodes.push({
          id: `inst:${inst.componentInstanceId}`,
          kind: 'instance',
          data: {
            label: inst.displayName,
            context: instanceContext?.(inst),
            systemInstance: systemInstanceName?.(inst.systemInstance),
            type: 'ComponentInstance',
            unmapped: true,
            unresolved: inst.component ? true : undefined,
          },
        })
      }
    }
    if (!showApis) continue
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

  if (!showApis) {
    const providersOf = new Map<string, string[]>()
    for (const c of components) {
      for (const apiId of c.provides) {
        providersOf.set(apiId, [...(providersOf.get(apiId) ?? []), c.componentId])
      }
    }
    const seen = new Set<string>()
    for (const c of components) {
      for (const apiId of c.consumes) {
        for (const providerId of providersOf.get(apiId) ?? []) {
          if (providerId === c.componentId) continue
          const key = `${providerId}->${c.componentId}`
          if (seen.has(key)) continue
          seen.add(key)
          edges.push({
            id: `via:${key}`,
            source: `comp:${providerId}`,
            target: `comp:${c.componentId}`,
            kind: 'communicates',
          })
        }
      }
    }
  }

  return frameGhostNodes(layoutDag({ nodes, edges, direction: 'LR' }))
}
