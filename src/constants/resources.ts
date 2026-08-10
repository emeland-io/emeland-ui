/**
 * This module adds UI-only knowledge on top: which route lists a
 * resource and how to label it. It is the single source of truth for
 * cross-resource navigation.
 *
 * When a new resource view is implemented, set its `route` here and the
 * resource becomes navigable everywhere, no per-view wiring needed.
 */
import type { ResourceType } from '@/types/common'

interface ResourceMeta {
  /** Human-readable label */
  label: string
  /**
   * Route name that lists this resource. When set, the resource is navigable:
   * clicking routes to `{ name: route, query: { select: <id> } }`.
   * `null` = no view yet (renders as plain text, not a link)
   */
  route: string | null
  chip: string
}

const RESOURCES: Partial<Record<ResourceType, ResourceMeta>> = {
  Node: { label: 'Node', route: 'Nodes', chip: 'N' },
  Finding: { label: 'Finding', route: 'Findings', chip: 'F' },
  Context: { label: 'Context', route: 'Contexts', chip: 'C' },
  System: { label: 'System', route: 'Systems', chip: 'S' },
  Component: { label: 'Component', route: 'Components', chip: 'Co' },
  API: { label: 'API', route: 'APIs', chip: 'A' },

  ContextType: { label: 'Context Type', route: null, chip: 'CT' },
  NodeType: { label: 'Node Type', route: null, chip: 'NT' },
  SystemInstance: { label: 'System Instance', route: null, chip: 'I' },
  ApiInstance: { label: 'API Instance', route: null, chip: 'I' },
  ComponentInstance: { label: 'Component Instance', route: null, chip: 'I' },
  Identity: { label: 'Identity', route: null, chip: 'Id' },
  OrgUnit: { label: 'Org Unit', route: null, chip: 'O' },
  Group: { label: 'Group', route: null, chip: 'G' },
  FindingType: { label: 'Finding Type', route: null, chip: 'FT' },
  Artifact: { label: 'Artifact', route: null, chip: 'Ar' },
  ArtifactInstance: { label: 'Artifact Instance', route: null, chip: 'AI' },
}

export function chipLetterFor(type: ResourceType): string {
  return RESOURCES[type]?.chip ?? '?'
}

export function routeForResource(type: ResourceType): string | null {
  return RESOURCES[type]?.route ?? null
}

export function isResourceNavigable(type: ResourceType): boolean {
  return routeForResource(type) !== null
}

export function resourceLabel(type: ResourceType): string {
  return RESOURCES[type]?.label ?? type
}
