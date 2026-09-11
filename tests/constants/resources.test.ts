import { describe, it, expect } from 'vitest'
import {
  chipLetterFor,
  isKnownResourceType,
  isResourceNavigable,
  resourceLabel,
  routeForResource,
} from '@/constants/resources'
import type { ResourceType } from '@/types/common'

/**
 * Every resource type of the model phases 0-8 that the API validation can
 * send (the resourceType enums of ResourceView/ResourceRef in the modelsrv
 * OpenAPI spec) must be known to the UI.
 */
const API_RESOURCE_TYPES: ResourceType[] = [
  // Phase 0
  'Context',
  'ContextType',
  // Phase 1
  'System',
  'SystemInstance',
  'API',
  'ApiInstance',
  'Component',
  'ComponentInstance',
  // Phase 2
  'OrgUnit',
  'Group',
  'Identity',
  'Binding',
  'RoleSpec',
  'PermissionSpec',
  'Role',
  'Permission',
  // Phase 3
  'Capability',
  'Parameter',
  // Phase 5
  'Finding',
  'FindingType',
  'Product',
  // Phase 6
  'Metric',
  'Threshold',
  'MetricValue',
  // Phase 7
  'Capacity',
  'CapacityResourceType',
  // Phase 8
  'Artifact',
  'ArtifactInstance',
  // landscape execution environment
  'Node',
  'NodeType',
]

describe('resources constants', () => {
  it('knows every resource type the API validation can send', () => {
    for (const type of API_RESOURCE_TYPES) {
      expect(isKnownResourceType(type)).toBe(true)
      expect(resourceLabel(type)).toBeTruthy()
      expect(chipLetterFor(type)).not.toBe('?')
    }
  })

  it('does not know modelsrv-internal types the UI cannot handle yet', () => {
    expect(isKnownResourceType('FilterRule')).toBe(false)
    expect(isKnownResourceType('MergeRule')).toBe(false)
    expect(isKnownResourceType('NoSuchThing')).toBe(false)
  })

  it('routes only the resources with a list view', () => {
    const navigable: ResourceType[] = ['Node', 'Finding', 'Context', 'System', 'Component', 'API']
    for (const type of navigable) {
      expect(routeForResource(type)).not.toBeNull()
      expect(isResourceNavigable(type)).toBe(true)
    }
  })

  it('has no routes yet for the types without a view', () => {
    const withoutView: ResourceType[] = [
      'Binding',
      'RoleSpec',
      'PermissionSpec',
      'Role',
      'Permission',
      'Capability',
      'Parameter',
      'Product',
      'Metric',
      'Threshold',
      'MetricValue',
      'Capacity',
      'CapacityResourceType',
    ]
    for (const type of withoutView) {
      expect(routeForResource(type)).toBeNull()
      expect(isResourceNavigable(type)).toBe(false)
    }
  })

  it('falls back gracefully for unknown types', () => {
    expect(chipLetterFor('Nope' as ResourceType)).toBe('?')
    expect(resourceLabel('Nope' as ResourceType)).toBe('Nope')
    expect(routeForResource('Nope' as ResourceType)).toBeNull()
  })
})
