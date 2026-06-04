import type { Annotations, UUID } from './common'

export interface OrgUnit {
  orgUnitId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  annotations: Annotations
}

export interface OrgUnitReference {
  orgUnit?: OrgUnit
  orgUnitId: UUID
}
