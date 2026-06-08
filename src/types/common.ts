/**
 * Common types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 *
 * Note: Annotations are Record<string, string> in the frontend for ergonomics.
 * The API sends them as Array<{key, value}> - the API client layer transforms.
 */

export type UUID = string

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
  // Phase 5
  | 'Finding'
  | 'FindingType'
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
