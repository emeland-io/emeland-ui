import type { Annotations, UUID } from './common'

/** Parameter type matching the EmELand OpenAPI spec */

export interface Parameter {
  parameterId: UUID
  displayName: string
  description?: string
  values?: string[]
  annotations: Annotations
}
