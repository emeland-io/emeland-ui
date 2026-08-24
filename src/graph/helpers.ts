import type { GraphEdge, NodeInstanceRef } from '@/types/graph'

/** Display refs of a resource's instances for the node tooltip; undefined when none */
export function instanceNameRefs<T extends { displayName: string }>(
  instances: T[],
  unresolvedOf?: (item: T) => boolean,
): NodeInstanceRef[] | undefined {
  if (instances.length === 0) return undefined
  return instances.map((i) => ({
    name: i.displayName,
    unresolved: unresolvedOf?.(i) || undefined,
  }))
}

/** Finding badge data of a node; findings count omitted when zero */
export function findingData(
  id: string,
  countOf?: (id: string) => number,
  kindsOf?: (id: string) => string[],
): { findings?: number; findingKinds?: string[] } {
  return {
    findings: countOf?.(id) || undefined,
    findingKinds: kindsOf?.(id),
  }
}

/**
 * Display names of the components providing/consuming an API, sorted — the
 * tooltip relation sections of api nodes (emitted by the builders)
 */
export function apiRelationNames(
  components: { provides: string[]; consumes: string[]; displayName: string }[],
  apiId: string,
  dir: 'provides' | 'consumes',
): string[] {
  return components
    .filter((c) => c[dir].includes(apiId))
    .map((c) => c.displayName)
    .sort((a, b) => a.localeCompare(b))
}

/** `sub:` contains edges from each item to its parent, skipping missing parents */
export function containsEdges<T>(
  items: T[],
  idOf: (item: T) => string,
  parentOf: (item: T) => string | undefined,
): GraphEdge[] {
  const present = new Set(items.map(idOf))
  const edges: GraphEdge[] = []
  for (const item of items) {
    const parent = parentOf(item)
    if (!parent || !present.has(parent)) continue
    edges.push({
      id: `sub:${parent}:${idOf(item)}`,
      source: parent,
      target: idOf(item),
      kind: 'contains',
    })
  }
  return edges
}

/** Parents first, each followed by its children; items with missing parents count as roots */
export function orderParentsFirst<T>(
  items: T[],
  idOf: (item: T) => string,
  parentOf: (item: T) => string | undefined,
): T[] {
  const byId = new Map(items.map((item) => [idOf(item), item]))
  const childrenOf = new Map<string, T[]>()
  const roots: T[] = []
  for (const item of items) {
    const parent = parentOf(item)
    if (parent && byId.has(parent)) {
      childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), item])
    } else {
      roots.push(item)
    }
  }
  const ordered: T[] = []
  const visit = (item: T) => {
    if (ordered.includes(item)) return
    ordered.push(item)
    for (const child of childrenOf.get(idOf(item)) ?? []) visit(child)
  }
  for (const r of roots) visit(r)
  return ordered
}

/** Depth in the parent chain, guarding against cycles and missing parents */
export function hierarchyDepth<T>(
  items: T[],
  idOf: (item: T) => string,
  parentOf: (item: T) => string | undefined,
) {
  const byId = new Map(items.map((item) => [idOf(item), item]))
  return (item: T): number => {
    let depth = 0
    let current = parentOf(item)
    const seen = new Set<string>([idOf(item)])
    while (current && byId.has(current) && !seen.has(current)) {
      seen.add(current)
      depth++
      current = parentOf(byId.get(current)!)
    }
    return depth
  }
}
