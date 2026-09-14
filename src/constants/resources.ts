/**
 * This module adds UI-only knowledge on top: which route lists a
 * resource and how to label it. It is the single source of truth for
 * cross-resource navigation.
 *
 * RESOURCES is exhaustive over ResourceType (the model phases 0-8, see
 * types/common.ts): adding a type to the union without its metadata is a
 * compile error. When a new resource view is implemented, set its `route`
 * here and the resource becomes navigable everywhere, no per-view wiring
 * needed.
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

const RESOURCES: Record<ResourceType, ResourceMeta> = {
  Unknown: { label: 'Unknown', route: null, chip: '?' },
  Annotations: { label: 'Annotations', route: null, chip: 'AN' },

  // Landscape (modelsrv execution environment)
  Node: { label: 'Node', route: 'Nodes', chip: 'N' },
  NodeType: { label: 'Node Type', route: null, chip: 'NT' },

  // Phase 0
  Context: { label: 'Context', route: 'Contexts', chip: 'C' },
  ContextType: { label: 'Context Type', route: null, chip: 'CT' },

  // Phase 1
  System: { label: 'System', route: 'Systems', chip: 'S' },
  SystemInstance: { label: 'System Instance', route: null, chip: 'I' },
  API: { label: 'API', route: 'APIs', chip: 'A' },
  ApiInstance: { label: 'API Instance', route: null, chip: 'I' },
  Component: { label: 'Component', route: 'Components', chip: 'CO' },
  ComponentInstance: { label: 'Component Instance', route: null, chip: 'I' },

  // Phase 2
  OrgUnit: { label: 'Org Unit', route: null, chip: 'O' },
  Group: { label: 'Group', route: null, chip: 'G' },
  Identity: { label: 'Identity', route: null, chip: 'ID' },
  Binding: { label: 'Binding', route: null, chip: 'B' },
  RoleSpec: { label: 'Role Spec', route: null, chip: 'RS' },
  PermissionSpec: { label: 'Permission Spec', route: null, chip: 'PS' },
  Role: { label: 'Role', route: null, chip: 'R' },
  Permission: { label: 'Permission', route: null, chip: 'PE' },

  // Phase 3
  Capability: { label: 'Capability', route: 'Capabilities', chip: 'CP' },
  Parameter: { label: 'Parameter', route: null, chip: 'PA' },
  Order: { label: 'Order', route: 'Orders', chip: 'OR' },

  // Phase 5
  Finding: { label: 'Finding', route: 'Findings', chip: 'F' },
  FindingType: { label: 'Finding Type', route: null, chip: 'FT' },
  Product: { label: 'Product', route: null, chip: 'PR' },

  // Phase 6
  Metric: { label: 'Metric', route: null, chip: 'ME' },
  Threshold: { label: 'Threshold', route: null, chip: 'TH' },
  MetricValue: { label: 'Metric Value', route: null, chip: 'MV' },

  // Phase 7
  Capacity: { label: 'Capacity', route: null, chip: 'CA' },
  CapacityResourceType: { label: 'Capacity Resource Type', route: null, chip: 'CR' },

  // Phase 8
  Artifact: { label: 'Artifact', route: null, chip: 'AR' },
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

export function isKnownResourceType(type: string): type is ResourceType {
  return type in RESOURCES
}
