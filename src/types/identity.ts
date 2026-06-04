import type { Annotations, UUID } from './common'
import type { OrgUnitReference } from './orgunit'

export interface Identity {
  identityId: UUID
  resourceId: UUID
  resourceName: string
  displayName: string
  description: string
  orgUnitReference: OrgUnitReference
  annotations: Annotations
}

export interface IdentityReference {
  idendity?: Identity
  idendityId: UUID
}
