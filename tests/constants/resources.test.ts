import { describe, it, expect } from 'vitest'
import {
  chipLetterFor,
  instanceParentType,
  isKnownResourceType,
  isResourceNavigable,
  resourceLabel,
  resourceQueryKey,
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

  it('routes the resources with a list view to a selected row', () => {
    const listed: ResourceType[] = [
      'Node',
      'Finding',
      'Context',
      'System',
      'Component',
      'API',
      'Capability',
      'Order',
      'Metric',
    ]
    for (const type of listed) {
      expect(routeForResource(type)).not.toBeNull()
      expect(isResourceNavigable(type)).toBe(true)
      expect(resourceQueryKey(type)).toBe('select')
    }
  })

  it('routes instances to the drawer of their parent view', () => {
    expect(routeForResource('SystemInstance')).toBe('Systems')
    expect(routeForResource('ApiInstance')).toBe('APIs')
    expect(routeForResource('ComponentInstance')).toBe('Components')
    expect(routeForResource('MetricInstance')).toBe('Metrics')
    for (const type of ['SystemInstance', 'ApiInstance', 'ComponentInstance', 'MetricInstance']) {
      expect(isResourceNavigable(type as ResourceType)).toBe(true)
      expect(resourceQueryKey(type as ResourceType)).toBe('instance')
    }
  })

  it('routes types to the types drawer of their view', () => {
    expect(routeForResource('NodeType')).toBe('Nodes')
    expect(routeForResource('ContextType')).toBe('Contexts')
    expect(routeForResource('FindingType')).toBe('Findings')
    for (const type of ['NodeType', 'ContextType', 'FindingType']) {
      expect(isResourceNavigable(type as ResourceType)).toBe(true)
      expect(resourceQueryKey(type as ResourceType)).toBe('type')
    }
  })

  it('has no routes yet for the types without a view', () => {
    const withoutView: ResourceType[] = [
      'Binding',
      'RoleSpec',
      'PermissionSpec',
      'Role',
      'Permission',
      'Parameter',
      'Product',
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
    expect(resourceQueryKey('Nope' as ResourceType)).toBe('select')
  })
})

describe('instanceParentType', () => {
  it('maps instance types to the resource they instantiate', () => {
    expect(instanceParentType('SystemInstance')).toBe('System')
    expect(instanceParentType('ApiInstance')).toBe('API')
    expect(instanceParentType('ComponentInstance')).toBe('Component')
  })

  it('is undefined for non-instance types', () => {
    expect(instanceParentType('Node')).toBeUndefined()
    expect(instanceParentType('Metric')).toBeUndefined()
  })
})
