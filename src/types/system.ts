/**
 * System types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Version, Annotations } from './common'

export interface System {
  systemId: UUID
  displayName: string
  description?: string
  version: Version
  abstract: boolean
  parent?: UUID
  annotations: Annotations
}

export interface SystemInstance {
  systemInstanceId: UUID
  displayName: string
  system: UUID
  context?: UUID
  annotations: Annotations
}
