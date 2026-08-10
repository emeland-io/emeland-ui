import type { ResourceType } from '@/types/common'

export interface PaletteSourceItem {
  id: string
  type: ResourceType
  label: string
  description?: string
  annotations?: Record<string, string>
}

export interface PaletteItem {
  id: string
  type: ResourceType
  label: string
  description?: string
}

export interface PaletteGroup {
  type: ResourceType
  label: string
  items: PaletteItem[]
  total: number
}

export const PALETTE_GROUP_CAP = 7

const GROUP_ORDER: ResourceType[] = ['Finding', 'System', 'Component', 'API', 'Context', 'Node']

const GROUP_LABELS: Partial<Record<ResourceType, string>> = {
  Finding: 'Findings',
  System: 'Systems',
  Component: 'Components',
  API: 'APIs',
  Context: 'Contexts',
  Node: 'Nodes',
}

function matches(item: PaletteSourceItem, q: string): boolean {
  return (
    item.label.toLowerCase().includes(q) ||
    item.id.toLowerCase().includes(q) ||
    (item.description ?? '').toLowerCase().includes(q) ||
    Object.entries(item.annotations ?? {}).some(
      ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q),
    )
  )
}

export function buildPaletteResults(
  query: string,
  source: PaletteSourceItem[],
  cap = PALETTE_GROUP_CAP,
): PaletteGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const byType = new Map<ResourceType, PaletteSourceItem[]>()
  for (const item of source) {
    if (!matches(item, q)) continue
    byType.set(item.type, [...(byType.get(item.type) ?? []), item])
  }

  return GROUP_ORDER.filter((t) => byType.has(t)).map((type) => {
    const items = byType
      .get(type)!
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label))
    return {
      type,
      label: GROUP_LABELS[type] ?? type,
      total: items.length,
      items: items.slice(0, cap).map(({ id, label, description }) => ({
        id,
        type,
        label,
        description,
      })),
    }
  })
}
