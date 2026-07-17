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
}

const RESOURCES: Partial<Record<ResourceType, ResourceMeta>> = {
  Node: { label: 'Node', route: 'Nodes' },
  Finding: { label: 'Finding', route: 'Findings' },
  Context: { label: 'Context', route: 'Contexts' },
  System: { label: 'System', route: 'Systems' },
  Component: { label: 'Component', route: 'Components' },

  ContextType: { label: 'Context Type', route: null },
  NodeType: { label: 'Node Type', route: null },
  SystemInstance: { label: 'System Instance', route: null },
  API: { label: 'API', route: null },
  ApiInstance: { label: 'API Instance', route: null },
  ComponentInstance: { label: 'Component Instance', route: null },
  Identity: { label: 'Identity', route: null },
  OrgUnit: { label: 'Org Unit', route: null },
  Group: { label: 'Group', route: null },
  FindingType: { label: 'Finding Type', route: null },
  Artifact: { label: 'Artifact', route: null },
  ArtifactInstance: { label: 'Artifact Instance', route: null },
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
