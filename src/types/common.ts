export type UUID = string

export type ResourceType =
  | 'Unknown'
  | 'Node'
  | 'NodeType'
  // Phase 0
  | 'Context'
  | 'ContextType'
  // Phase 1
  | 'System'
  | 'SystemInstance'
  | 'API'
  | 'APIInstance'
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
  // other
  | 'Annotations'

export interface ResourceReference {
  resourceId: UUID
  resourceType: ResourceType
}

export interface Version {
  version: string
  availableFrom?: string
  deprecatedFrom?: string
  terminatedFrom?: string
}

export interface EntityVersion {
  name: string
  version: string
}

export type Annotations = Record<string, string>
