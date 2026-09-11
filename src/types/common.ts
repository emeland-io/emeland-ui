/**
 * Common types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 *
 * Note: Annotations are Record<string, string> in the frontend for ergonomics.
 * The API sends them as Array<{key, value}> - the API client layer transforms.
 */

export type UUID = string

/**
 * Resource types of the EmELand model phases 0-8
 * (https://emeland.io/docs/model/) that the API validation can pass to the UI.
 */
export type ResourceType =
  | 'Unknown'
  | 'Node'
  | 'NodeType'
  | 'Annotations'
  // Phase 0
  | 'Context'
  | 'ContextType'
  // Phase 1
  | 'System'
  | 'SystemInstance'
  | 'API'
  | 'ApiInstance'
  | 'Component'
  | 'ComponentInstance'
  // Phase 2
  | 'OrgUnit'
  | 'Group'
  | 'Identity'
  | 'Binding'
  | 'RoleSpec'
  | 'PermissionSpec'
  | 'Role'
  | 'Permission'
  // Phase 3
  | 'Capability'
  | 'Parameter'
  // Phase 4 defines no resources yet
  // Phase 5
  | 'Finding'
  | 'FindingType'
  | 'Product'
  // Phase 6
  | 'Metric'
  | 'Threshold'
  | 'MetricValue'
  // Phase 7
  | 'Capacity'
  | 'CapacityResourceType'
  // Phase 8
  | 'Artifact'
  | 'ArtifactInstance'

export interface ResourceReference {
  resourceId: UUID
  resourceType: ResourceType
  reference?: string
}

export interface Version {
  version: string
  availableFrom?: string
  deprecatedFrom?: string
  terminatedFrom?: string
}

export type Annotations = Record<string, string>

export type EntityRef<K extends string> = { displayName: string } & Record<K, UUID>

export type TypeEntity<K extends string> = EntityRef<K> & {
  description?: string
  annotations: Annotations
}
