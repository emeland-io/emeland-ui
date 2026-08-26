import type {
  FindingView as FindingViewWire,
  FindingType as FindingTypeWire,
} from '@/api/gen/types.gen'

export const findingTypes = [
  {
    findingTypeId: 'a1b2c3d4-e5f6-4a7b-8c9d-1e2f3a4b5c6d',
    displayName: 'ContextTypeMissing',
    description:
      'A Context references a ContextType that does not exist in the model, or has no type set at all.',
    annotations: [{ key: 'emeland.io/built-in', value: 'true' }],
  },
  {
    findingTypeId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'ContextParentNotFound',
    description:
      'A Context references a parent Context by UUID but that parent does not exist in the model.',
    annotations: [{ key: 'emeland.io/built-in', value: 'true' }],
  },
  {
    findingTypeId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'NodeTypeMissing',
    description: 'A Node references a NodeType that does not exist in the model.',
    annotations: [{ key: 'emeland.io/built-in', value: 'true' }],
  },
  {
    findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
    displayName: 'ConsumerLagExceeded',
    description: 'Consumer lag on a subscribed topic exceeds the configured threshold.',
    annotations: [],
  },
  {
    findingTypeId: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b',
    displayName: 'VersionMismatch',
    description: 'Instance version does not match the system template version.',
    annotations: [],
  },
] satisfies FindingTypeWire[]

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
export const findings = [
  {
    findingId: '11a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',

    reference: 'emeland://findingId/11a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    displayName: 'Context parent not found',
    description:
      'Context "Altsystem" references a parent context that does not exist in the model.',
    findingType: {
      findingTypeId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
      displayName: 'ContextParentNotFound',
    },
    resources: [
      {
        id: '0a000000-0000-4211-8000-000000000008',
        displayName: 'Altsystem',
        resourceType: 'Context',
      },
      {
        id: 'ffffffff-0000-4211-8000-0000000000ff',
        displayName: '',
        resourceType: 'Context',
      },
    ],
    annotations: [{ key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T07:00:00Z' }],
  },
  {
    findingId: '22b3c4d5-e6f7-4a8b-9c1d-1e2f3a4b5c6d',

    reference: 'emeland://findingId/22b3c4d5-e6f7-4a8b-9c1d-1e2f3a4b5c6d',
    displayName: 'Version mismatch with system template',
    description: 'instance v1.7.9 != system v1.8.3',
    findingType: {
      findingTypeId: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b',
      displayName: 'VersionMismatch',
    },
    resources: [
      {
        id: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
        displayName: 'Application (prod-eu)',
        resourceType: 'SystemInstance',
      },
      {
        id: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
        displayName: 'Application',
        resourceType: 'System',
      },
    ],
    annotations: [
      { key: 'emeland.io/instance-version', value: 'v1.7.9' },
      { key: 'emeland.io/system-version', value: 'v1.8.3' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T08:15:22Z' },
    ],
  },
  {
    findingId: '33c4d5e6-f7a8-4b9c-1d2e-2f3a4b5c6d7e',

    reference: 'emeland://findingId/33c4d5e6-f7a8-4b9c-1d2e-2f3a4b5c6d7e',
    displayName: 'Consumer lag exceeds threshold',
    description: 'max-consumer-lag <= 500 (current: 2841 on system-b.events)',
    findingType: {
      findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
      displayName: 'ConsumerLagExceeded',
    },
    resources: [
      {
        id: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e',
        displayName: 'Prometheus (prod)',
        resourceType: 'SystemInstance',
      },
    ],
    annotations: [
      { key: 'emeland.io/threshold', value: '500' },
      { key: 'emeland.io/current-value', value: '2841' },
      { key: 'emeland.io/topic', value: 'system-b.events' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T09:23:41Z' },
    ],
  },
  {
    findingId: '44d5e6f7-a8b9-4c1d-2e3f-3a4b5c6d7e8f',

    reference: 'emeland://findingId/44d5e6f7-a8b9-4c1d-2e3f-3a4b5c6d7e8f',
    displayName: 'Node type missing',
    description: 'NodeTypeMissing: node references a type which does not exist.',
    findingType: {
      findingTypeId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
      displayName: 'NodeTypeMissing',
    },
    resources: [
      {
        id: 'aaaa0001-0000-4000-8000-000000000001',
        displayName: 'orphan-git-sensor',
        resourceType: 'Node',
      },
      {
        id: 'bbbb0001-0000-4000-8000-000000000001',
        displayName: '',
        resourceType: 'NodeType',
      },
    ],
    annotations: [{ key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T10:05:00Z' }],
  },
  {
    findingId: '15a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b60',

    reference: 'emeland://findingId/15a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b60',
    displayName: 'Consumer lag exceeded on Event Bus',
    description:
      'App Backend consumes the Event Bus faster than it processes; lag has been above the threshold for 30 minutes.',
    findingType: {
      findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
      displayName: 'ConsumerLagExceeded',
    },
    resources: [
      {
        id: 'cb2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
        displayName: 'App Backend',
        resourceType: 'Component',
      },
      {
        id: 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
        displayName: 'Event Bus',
        resourceType: 'API',
      },
    ],
    annotations: [{ key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T08:15:00Z' }],
  },
  {
    findingId: '16a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b61',

    reference: 'emeland://findingId/16a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b61',
    displayName: 'Version mismatch with component template',
    description: 'Kong Gateway runs v3.6.1 while the component template pins v3.7.0.',
    findingType: {
      findingTypeId: 'e5f6a7b8-c9d1-4e2f-3a4b-5c6d7e8f9a1b',
      displayName: 'VersionMismatch',
    },
    resources: [
      {
        id: 'cc3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
        displayName: 'Kong Gateway',
        resourceType: 'Component',
      },
    ],
    annotations: [{ key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T06:42:00Z' }],
  },
] satisfies FindingViewWire[]
