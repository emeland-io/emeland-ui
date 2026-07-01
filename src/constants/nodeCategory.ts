import type { Node } from '@/types/node'

/**
 * Resolves a node's type/category and its badge colour
 *
 * TODO: A property in the backend that will later add an explicit `category`
 * field to the node. Once it's available, the color mapping logic will be updated.
 *
 * Until then we only pattern-match the display name
 */

export type NodeCategory = 'Sensor' | 'Filter' | 'Injector' | 'External'

const CATEGORY_PATTERNS: [RegExp, NodeCategory][] = [
  [/sensor/i, 'Sensor'],
  [/filter/i, 'Filter'],
  [/injector/i, 'Injector'],
  [/external/i, 'External'],
]

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  Sensor: 'bg-node-sensor/10 text-node-sensor',
  Filter: 'bg-node-filter/10 text-node-filter',
  Injector: 'bg-node-injector/10 text-node-injector',
  External: 'bg-node-external/10 text-node-external',
}

export const DEFAULT_CATEGORY_COLOR = 'bg-bg-2 text-text-3'

export function categoryFromName(name?: string | null): NodeCategory | null {
  if (!name) return null
  for (const [re, cat] of CATEGORY_PATTERNS) if (re.test(name)) return cat
  return null
}

export function resolveNodeCategory(node: Node): NodeCategory | null {
  // HINT: derive from the type's display name via regex for now
  //
  // TODO: prefer an explicit node.category (or similiar) once the backend
  // provides it, the regex then becomes a fallback only
  return categoryFromName(node.nodeType?.displayName)
}

export function categoryColor(category: NodeCategory | null): string {
  return category ? CATEGORY_COLORS[category] : DEFAULT_CATEGORY_COLOR
}

export function categoryColorForNode(node: Node): string {
  return categoryColor(resolveNodeCategory(node))
}

export function categoryColorForName(name?: string | null): string {
  return categoryColor(categoryFromName(name))
}
