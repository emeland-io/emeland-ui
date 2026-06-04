import type { Annotations, UUID } from './common'
import type { IdentityReference } from './identity'
import type { OrgUnitReference } from './orgunit'

export interface Group {
  groupdId: UUID
  resourceId: string
  resourceName: string
  displayName: string
  description: string
  members: IdentityReference[]
  orgUnit: OrgUnitReference
  annotations: Annotations
}

export interface GroupReference {
  group?: Group
  groupId: UUID
}
