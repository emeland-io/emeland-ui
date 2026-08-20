import type { System, SystemInstance } from '@/types/system'
import type { GraphModel, GraphEdge } from '@/types/graph'
import {
  layoutFramedColumns,
  type LayoutAnchor,
  type LayoutMember,
  type LayoutFrame,
} from './layout'
import { UNMAPPED_FRAME_ID } from './ids'
import { containsEdges, findingData, hierarchyDepth, orderParentsFirst } from './helpers'

export interface InstanceGraphInput {
  systems: System[]
  instancesOf: (systemId: string) => SystemInstance[]
  contextName: (contextId: string | undefined) => string | undefined
  findingCountOf?: (systemId: string) => number
  findingKindsOf?: (systemId: string) => string[]
  unmappedInstances?: SystemInstance[]
}

const NO_CONTEXT = 'no-context'
const UNMAPPED_ROW = 'unmapped'
const UNMAPPED_FRAME = UNMAPPED_FRAME_ID

export function buildInstanceGraph({
  systems,
  instancesOf,
  contextName,
  findingCountOf,
  findingKindsOf,
  unmappedInstances,
}: InstanceGraphInput): GraphModel {
  const allSystems = systems ?? []
  const unmapped = unmappedInstances ?? []
  const withInstances = allSystems
    .map((system) => ({ system, instances: instancesOf(system.systemId) }))
    .filter((g) => g.instances.length > 0)

  const ctxLabel = (inst: SystemInstance) =>
    inst.context ? (contextName(inst.context) ?? inst.context) : 'No context'
  const frameOf = (inst: SystemInstance) => inst.context ?? NO_CONTEXT

  const byId = new Map(allSystems.map((s) => [s.systemId, s]))
  const isParent = new Set(
    allSystems.filter((s) => s.parent && byId.has(s.parent)).map((s) => s.parent as string),
  )

  // leaf systems share one column (depth 1) so anchors line up with parents
  const baseDepth = hierarchyDepth(
    allSystems,
    (s) => s.systemId,
    (s) => s.parent,
  )
  const depthOf = (system: System): number => {
    const depth = baseDepth(system)
    if (depth === 0 && !isParent.has(system.systemId)) return 1
    return depth
  }

  const ordered = orderParentsFirst(
    allSystems,
    (s) => s.systemId,
    (s) => s.parent,
  )

  const anchors: LayoutAnchor[] = ordered.map((system) => ({
    id: system.systemId,
    kind: 'system',
    rowKey: system.systemId,
    depth: depthOf(system),
    selectable: false,
    data: {
      label: system.displayName,
      abstract: system.abstract,
      description: system.description || undefined,
      version: system.version?.version || undefined,
      ...findingData(system.systemId, findingCountOf, findingKindsOf),
    },
  }))

  const frameLabels = new Map<string, string>()
  for (const { instances } of withInstances) {
    for (const inst of instances) {
      const id = frameOf(inst)
      if (!frameLabels.has(id)) frameLabels.set(id, ctxLabel(inst))
    }
  }

  const frames: LayoutFrame[] = [...frameLabels]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, label], order) => ({ id, kind: 'context', order, data: { label } }))

  // group unmapped instances by their (unresolved) system reference; the
  // reference does not resolve (that is why the instances are unmapped), so
  // the truncated id is all there is to show. No-reference instances last.
  const unmappedOrdered = [...unmapped].sort(
    (a, b) =>
      Number(!a.system) - Number(!b.system) ||
      (a.system || '').localeCompare(b.system || '') ||
      a.displayName.localeCompare(b.displayName),
  )
  const unmappedGroupOf = (key: string) => `${UNMAPPED_FRAME}:${key || 'none'}`

  // unmapped instances get their own dashed frame BEFORE the whole graph
  // (like the unmapped lanes in the API/component graphs), with one nested
  // frame per system reference group
  if (unmapped.length > 0) {
    frames.push({
      id: UNMAPPED_FRAME,
      kind: 'context',
      order: -1,
      before: true,
      data: {
        label: 'Unmapped',
        variant: 'unmapped',
        count: unmapped.length,
        title: 'Unmapped instances with no resolvable parent — click to focus and inspect',
      },
    })
    const groupKeys = [...new Set(unmappedOrdered.map((i) => i.system || ''))]
    groupKeys.forEach((key, order) => {
      frames.push({
        id: unmappedGroupOf(key),
        kind: 'context',
        order,
        parentId: UNMAPPED_FRAME,
        data: {
          label: key ? `${key.slice(0, 8)}…` : 'No system reference',
          variant: 'group',
          title: key ? `References missing system ${key}` : 'No system reference',
        },
      })
    })
  }

  const members: LayoutMember[] = []
  const edges: GraphEdge[] = containsEdges(
    allSystems,
    (s) => s.systemId,
    (s) => s.parent,
  )

  for (const { system, instances } of withInstances) {
    const ordered = [...instances].sort(
      (a, b) =>
        ctxLabel(a).localeCompare(ctxLabel(b)) || a.displayName.localeCompare(b.displayName),
    )
    for (const inst of ordered) {
      members.push({
        id: inst.systemInstanceId,
        kind: 'instance',
        frameId: frameOf(inst),
        rowKey: system.systemId,
        data: {
          label: inst.displayName,
          parent: system.systemId,
          system: system.displayName,
          context: ctxLabel(inst),
          type: 'SystemInstance',
        },
      })
      edges.push({
        id: `${system.systemId}->${inst.systemInstanceId}`,
        source: system.systemId,
        target: inst.systemInstanceId,
        kind: 'contains',
      })
    }
  }

  for (const inst of unmappedOrdered) {
    members.push({
      id: inst.systemInstanceId,
      kind: 'instance',
      frameId: unmappedGroupOf(inst.system || ''),
      rowKey: UNMAPPED_ROW,
      // unmapped instances have no system anchor; float them from the top of
      // their group frame, flowing into columns of at most floatMaxRows
      floatTop: true,
      data: {
        label: inst.displayName,
        context: ctxLabel(inst),
        type: 'SystemInstance',
        unmapped: true,
        unresolved: inst.system ? true : undefined,
      },
    })
  }

  return layoutFramedColumns({ anchors, frames, members, edges })
}
