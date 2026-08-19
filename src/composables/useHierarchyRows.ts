import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

export interface HierarchyRow<T> {
  item: T
  depth: number
  childCount: number
  ancestors: string[]
}

/**
 * Tree machinery of the hierarchical resource views (systems, contexts):
 * collapse state with a default "collapse grandparents" pass, visible-row
 * computation in display order, ancestor expansion on search matches and on
 * selection, and the active indent rail.
 */
export function useHierarchyRows<T>(options: {
  /** all loaded items (parent chains are walked over the full set) */
  items: () => T[]
  /** the visible, filtered rows */
  filtered: () => T[]
  idOf: (item: T) => string
  parentOf: (item: T) => string | undefined
  /** search matches whose ancestors get expanded automatically */
  expandOnMatch?: Ref<Set<string>> | ComputedRef<Set<string>>
  /** the current selection, for the active indent rail */
  selectedId?: Ref<string> | ComputedRef<string>
}) {
  const { items, filtered, idOf, parentOf, expandOnMatch, selectedId } = options

  const collapsed = ref<Set<string>>(new Set())

  function byId(id: string): T | undefined {
    return items().find((item) => idOf(item) === id)
  }

  function parentIdOf(id: string): string | undefined {
    const item = byId(id)
    return item ? parentOf(item) : undefined
  }

  function depthOf(id: string): number {
    let depth = 0
    let cursor = parentIdOf(id)
    const seen = new Set<string>([id])
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor)
      depth++
      cursor = parentIdOf(cursor)
    }
    return depth
  }

  // collapse parents at depth >= 1 once, when data first arrives
  let defaultCollapseApplied = false
  watch(
    () => items().length,
    (count) => {
      if (defaultCollapseApplied || count === 0) return
      defaultCollapseApplied = true
      const shut = new Set<string>()
      for (const item of items()) {
        const parent = parentOf(item)
        if (parent && depthOf(parent) >= 1) shut.add(parent)
      }
      collapsed.value = shut
    },
    { immediate: true },
  )

  function toggleCollapse(id: string) {
    const s = new Set(collapsed.value)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    collapsed.value = s
  }

  const parentIds = computed(() => {
    const present = new Set(filtered().map(idOf))
    const ids = new Set<string>()
    for (const item of filtered()) {
      const parent = parentOf(item)
      if (parent && present.has(parent)) ids.add(parent)
    }
    return ids
  })

  const allCollapsed = computed(
    () => parentIds.value.size > 0 && [...parentIds.value].every((id) => collapsed.value.has(id)),
  )

  function toggleAll() {
    collapsed.value = allCollapsed.value ? new Set() : new Set(parentIds.value)
  }

  const rows = computed<HierarchyRow<T>[]>(() => {
    const present = new Set(filtered().map(idOf))
    const childrenOf = new Map<string, T[]>()
    const roots: T[] = []
    for (const item of filtered()) {
      const parent = parentOf(item)
      if (parent && present.has(parent)) {
        childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), item])
      } else {
        roots.push(item)
      }
    }
    const result: HierarchyRow<T>[] = []
    const walk = (item: T, depth: number, ancestors: string[]) => {
      const id = idOf(item)
      const kids = childrenOf.get(id) ?? []
      result.push({ item, depth, childCount: kids.length, ancestors })
      if (collapsed.value.has(id)) return
      for (const child of kids) walk(child, depth + 1, [...ancestors, id])
    }
    for (const r of roots) walk(r, 0, [])
    return result
  })

  /** reveal the ancestors of an item (e.g. on selection or search match) */
  function expandAncestors(id: string) {
    const next = new Set(collapsed.value)
    let cursor: string | undefined = id
    const seen = new Set<string>()
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor)
      next.delete(cursor)
      cursor = parentIdOf(cursor)
    }
    collapsed.value = next
  }

  if (expandOnMatch) {
    watch(expandOnMatch, (ids) => {
      if (ids.size === 0) return
      const next = new Set(collapsed.value)
      for (const id of ids) {
        let cursor = parentIdOf(id)
        const seen = new Set<string>()
        while (cursor && !seen.has(cursor)) {
          seen.add(cursor)
          next.delete(cursor)
          cursor = parentIdOf(cursor)
        }
      }
      collapsed.value = next
    })
  }

  const activeRail = computed(() => {
    const id = selectedId?.value
    return (id && parentIdOf(id)) || ''
  })

  return {
    collapsed,
    toggleCollapse,
    parentIds,
    allCollapsed,
    toggleAll,
    rows,
    expandAncestors,
    activeRail,
  }
}
