/**
 * Identity type matching the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0-oapi-3.0.3).
 */

import type { UUID, Annotations } from './common'

export interface Identity {
  identityId: UUID
  displayName: string
  description?: string
  annotations: Annotations
}
