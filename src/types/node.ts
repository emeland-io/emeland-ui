/**
 * Node types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Annotations } from './common'

export interface NodeType {
  nodeTypeId: UUID
  displayName: string
  description?: string
  annotations: Annotations
}

export interface Node {
  nodeId: UUID
  displayName: string
  nodeType: UUID
  annotations: Annotations
}
