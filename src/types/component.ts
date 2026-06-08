/**
 * Component types matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Version, Annotations } from './common'

export interface Component {
  componentId: UUID
  displayName: string
  description?: string
  version: Version
  system: UUID
  consumes: UUID[]
  provides: UUID[]
  annotations: Annotations
}

export interface ComponentInstance {
  componentInstanceId: UUID
  displayName: string
  component: UUID
  systemInstance: UUID
  consumes: UUID[]
  provides: UUID[]
  annotations: Annotations
}
