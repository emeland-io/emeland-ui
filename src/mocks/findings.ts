import type { FindingType, Finding } from '@/types/finding'

export const findingTypes: FindingType[] = [
  {
    findingTypeId: 'a1b2c3d4-e5f6-4a7b-8c9d-1e2f3a4b5c6d',
    displayName: 'ContextTypeMissing',
    description:
      'A Context references a ContextType that does not exist in the model, or has no type set at all.',
    annotations: { 'emeland.io/built-in': 'true' },
  },
  {
    findingTypeId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'ContextParentNotFound',
    description:
      'A Context references a parent Context by UUID but that parent does not exist in the model.',
    annotations: { 'emeland.io/built-in': 'true' },
  },
  {
    findingTypeId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'NodeTypeMissing',
    description: 'A Node references a NodeType that does not exist in the model.',
    annotations: { 'emeland.io/built-in': 'true' },
  },
  {
    findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
    displayName: 'ConsumerLagExceeded',
    description: 'Consumer lag on a subscribed topic exceeds the configured threshold.',
    annotations: {},
  },
  {
    findingTypeId: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b',
    displayName: 'VersionMismatch',
    description: 'Instance version does not match the system template version.',
    annotations: {},
  },
]

/**
 * Findings mockups
 *
 * Cross-references (all resolve to real entities in the other mocks):
 *   From contexts.ts:
 *     Altsystem:        0a000000-0000-4211-8000-000000000008 (parent is missing)
 *     (missing parent): ffffffff-0000-4211-8000-0000000000ff
 *   From systems.ts:
 *     Application (prod-eu): e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e (SystemInstance)
 *     Application:           7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d (System)
 *     Prometheus (prod):     2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e (SystemInstance)
 *   From nodes.ts:
 *     orphan-git-sensor:  aaaa0001-0000-4000-8000-000000000001 (Node, missing type)
 *     (missing NodeType): bbbb0001-0000-4000-8000-000000000001
 */
export const findings: Finding[] = [
  {
    findingId: '11a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    displayName: 'Context parent not found',
    description:
      'Context "Altsystem" references a parent context that does not exist in the model.',
    findingType: {
      findingTypeId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
      displayName: 'ContextParentNotFound',
    },
    resources: [
      {
        resourceId: '0a000000-0000-4211-8000-000000000008',
        displayName: 'Altsystem',
        resourceType: 'Context',
      },
      {
        resourceId: 'ffffffff-0000-4211-8000-0000000000ff',
        displayName: '',
        resourceType: 'Context',
      },
    ],
    annotations: { 'eximpl.emeland.io/detected-at': '2026-05-28T07:00:00Z' },
  },
  {
    findingId: '22b3c4d5-e6f7-4a8b-9c1d-1e2f3a4b5c6d',
    displayName: 'Version mismatch with system template',
    description: 'instance v1.7.9 != system v1.8.3',
    findingType: {
      findingTypeId: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b',
      displayName: 'VersionMismatch',
    },
    resources: [
      {
        resourceId: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
        displayName: 'Application (prod-eu)',
        resourceType: 'SystemInstance',
      },
      {
        resourceId: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
        displayName: 'Application',
        resourceType: 'System',
      },
    ],
    annotations: {
      'emeland.io/instance-version': 'v1.7.9',
      'emeland.io/system-version': 'v1.8.3',
      'eximpl.emeland.io/detected-at': '2026-05-28T08:15:22Z',
    },
  },
  {
    findingId: '33c4d5e6-f7a8-4b9c-1d2e-2f3a4b5c6d7e',
    displayName: 'Consumer lag exceeds threshold',
    description: 'max-consumer-lag <= 500 (current: 2841 on system-b.events)',
    findingType: {
      findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
      displayName: 'ConsumerLagExceeded',
    },
    resources: [
      {
        resourceId: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e',
        displayName: 'Prometheus (prod)',
        resourceType: 'SystemInstance',
      },
    ],
    annotations: {
      'emeland.io/threshold': '500',
      'emeland.io/current-value': '2841',
      'emeland.io/topic': 'system-b.events',
      'eximpl.emeland.io/detected-at': '2026-05-28T09:23:41Z',
    },
  },
  {
    findingId: '44d5e6f7-a8b9-4c1d-2e3f-3a4b5c6d7e8f',
    displayName: 'Node type missing',
    description: 'NodeTypeMissing: node references a type which does not exist.',
    findingType: {
      findingTypeId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
      displayName: 'NodeTypeMissing',
    },
    resources: [
      {
        resourceId: 'aaaa0001-0000-4000-8000-000000000001',
        displayName: 'orphan-git-sensor',
        resourceType: 'Node',
      },
      {
        resourceId: 'bbbb0001-0000-4000-8000-000000000001',
        displayName: '',
        resourceType: 'NodeType',
      },
    ],
    annotations: { 'eximpl.emeland.io/detected-at': '2026-05-28T10:05:00Z' },
  },
]
