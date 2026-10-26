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
    annotations: [{ key: 'built-in', value: 'true' }],
  },
  {
    findingTypeId: 'b2c3d4e5-f6a7-4b8c-9d1e-2f3a4b5c6d7e',
    displayName: 'ContextParentNotFound',
    description:
      'A Context references a parent Context by UUID but that parent does not exist in the model.',
    annotations: [{ key: 'built-in', value: 'true' }],
  },
  {
    findingTypeId: 'c3d4e5f6-a7b8-4c9d-1e2f-3a4b5c6d7e8f',
    displayName: 'NodeTypeMissing',
    description: 'A Node references a NodeType that does not exist in the model.',
    annotations: [{ key: 'built-in', value: 'true' }],
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
  {
    findingTypeId: 'f6a7b8c9-d1e2-4f3a-4b5c-6d7e8f9a1b2c',
    displayName: 'RoleNotFound',
    description: 'A Binding references a Role that does not exist in the model.',
    annotations: [{ key: 'built-in', value: 'true' }],
  },
  {
    findingTypeId: 'a7b8c9d1-e2f3-4a4b-8c6d-7e8f9a1b2c3d',
    displayName: 'ThresholdBreached',
    description: 'The current value of a metric instance breaches one of its thresholds.',
    annotations: [],
  },
  {
    findingTypeId: 'b8c9d1e2-f3a4-4b5c-8d7e-8f9a1b2c3d4e',
    displayName: 'MetricNotFound',
    description: 'A MetricInstance references a Metric that does not exist in the model.',
    annotations: [{ key: 'built-in', value: 'true' }],
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
 *     Application (ber-prod): e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e (SystemInstance)
 *     Application:           7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d (System)
 *     Prometheus (prod):     2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e (SystemInstance)
 *   From nodes.ts:
 *     orphan-git-sensor:  aaaa0001-0000-4000-8000-000000000001 (Node, missing type)
 *     (missing NodeType): bbbb0001-0000-4000-8000-000000000001
 *   RBAC (no roles/bindings mocks yet):
 *     deployer-binding:   cccc0001-0000-4000-8000-000000000001 (Binding)
 *     (missing Role):     dddd0001-0000-4000-8000-000000000001
 *   From metrics.ts (MetricInstance):
 *     CPU utilization for App Backend (ber-prod):              a1a1a1a1-0003-4000-8000-000000000003
 *     Consumer lag of deploy-notifier on deployment.lifecycle: a1a1a1a1-0006-4000-8000-000000000006
 *     Error rate of Public Gateway (ber-prod):                 a1a1a1a1-0015-4000-8000-000000000015
 *     Dead-letter events of topic deployment.lifecycle:        a1a1a1a1-0016-4000-8000-000000000016
 *     Container restarts of Kong Gateway (ber-prod):           a1a1a1a1-0018-4000-8000-000000000018
 *     Gateway saturation:                                      99999999-9999-4999-8999-999999999999
 *     (missing Metric):                                        00000000-dead-4000-8000-000000000000
 *   From components.ts:
 *     App Backend (ber-prod):  d3a1b2c3-0000-4d5e-8f00-000000000003 (ComponentInstance)
 *     Kong Gateway (ber-prod): d5a1b2c3-0000-4d5e-8f00-000000000005 (ComponentInstance)
 *   From api.ts:
 *     Event Bus:                 ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f (API)
 *     Public Gateway (ber-prod): ed1b2c3d-0000-4d5e-8f00-000000000001 (ApiInstance)
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
        displayName: 'Application (ber-prod)',
        resourceType: 'SystemInstance',
      },
      {
        id: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
        displayName: 'Application',
        resourceType: 'System',
      },
    ],
    annotations: [
      { key: 'instance-version', value: 'v1.7.9' },
      { key: 'system-version', value: 'v1.8.3' },
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
      { key: 'threshold', value: '500' },
      { key: 'current-value', value: '2841' },
      { key: 'topic', value: 'system-b.events' },
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
  {
    findingId: '17a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b62',

    reference: 'emeland://findingId/17a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b62',
    displayName: 'Bound role not found',
    description: 'Binding "deployer-binding" grants a role that does not exist in the model.',
    findingType: {
      findingTypeId: 'f6a7b8c9-d1e2-4f3a-4b5c-6d7e8f9a1b2c',
      displayName: 'RoleNotFound',
    },
    resources: [
      {
        id: 'cccc0001-0000-4000-8000-000000000001',
        displayName: 'deployer-binding',
        resourceType: 'Binding',
      },
      {
        id: 'dddd0001-0000-4000-8000-000000000001',
        displayName: '',
        resourceType: 'Role',
      },
    ],
    annotations: [{ key: 'eximpl.emeland.io/detected-at', value: '2026-05-28T11:12:00Z' }],
  },
  {
    findingId: '18a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b63',

    reference: 'emeland://findingId/18a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b63',
    displayName: 'CPU saturation on App Backend (ber-prod)',
    description: '1 minute average of 91 % is above the 85 % warning threshold.',
    findingType: {
      findingTypeId: 'a7b8c9d1-e2f3-4a4b-8c6d-7e8f9a1b2c3d',
      displayName: 'ThresholdBreached',
    },
    resources: [
      {
        id: 'a1a1a1a1-0003-4000-8000-000000000003',
        displayName: 'CPU utilization for App Backend (ber-prod)',
        resourceType: 'MetricInstance',
      },
      {
        id: 'd3a1b2c3-0000-4d5e-8f00-000000000003',
        displayName: 'App Backend (ber-prod)',
        resourceType: 'ComponentInstance',
      },
    ],
    annotations: [
      { key: 'threshold', value: 'backend CPU warning' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-06-02T07:41:10Z' },
    ],
  },
  {
    findingId: '19a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b64',

    reference: 'emeland://findingId/19a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b64',
    displayName: 'deploy-notifier consumer lag exceeds SLO',
    description:
      '18234 unprocessed deployment events on deployment.lifecycle; the notification SLO allows 10000.',
    findingType: {
      findingTypeId: 'd4e5f6a7-b8c9-4d1e-2f3a-4b5c6d7e8f9a',
      displayName: 'ConsumerLagExceeded',
    },
    resources: [
      {
        id: 'a1a1a1a1-0006-4000-8000-000000000006',
        displayName: 'Consumer lag of deploy-notifier on deployment.lifecycle',
        resourceType: 'MetricInstance',
      },
      {
        id: 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
        displayName: 'Event Bus',
        resourceType: 'API',
      },
    ],
    annotations: [
      { key: 'consumer-group', value: 'deploy-notifier' },
      { key: 'topic', value: 'deployment.lifecycle' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-06-02T07:55:03Z' },
    ],
  },
  {
    findingId: '20a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b65',

    reference: 'emeland://findingId/20a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b65',
    displayName: 'Metric reference not found',
    description:
      'Metric instance "Gateway saturation" references a metric that does not exist in the model.',
    findingType: {
      findingTypeId: 'b8c9d1e2-f3a4-4b5c-8d7e-8f9a1b2c3d4e',
      displayName: 'MetricNotFound',
    },
    resources: [
      {
        id: '99999999-9999-4999-8999-999999999999',
        displayName: 'Gateway saturation',
        resourceType: 'MetricInstance',
      },
      {
        id: '00000000-dead-4000-8000-000000000000',
        displayName: '',
        resourceType: 'Metric',
      },
    ],
    annotations: [{ key: 'eximpl.emeland.io/detected-at', value: '2026-06-01T22:10:44Z' }],
  },
  {
    findingId: '21a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b66',

    reference: 'emeland://findingId/21a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b66',
    displayName: 'Public Gateway 5xx rate above SLO',
    description:
      '6.1 % of requests through the public gateway fail; the availability SLO allows 5 %.',
    findingType: {
      findingTypeId: 'a7b8c9d1-e2f3-4a4b-8c6d-7e8f9a1b2c3d',
      displayName: 'ThresholdBreached',
    },
    resources: [
      {
        id: 'a1a1a1a1-0015-4000-8000-000000000015',
        displayName: 'Error rate of Public Gateway (ber-prod)',
        resourceType: 'MetricInstance',
      },
      {
        id: 'ed1b2c3d-0000-4d5e-8f00-000000000001',
        displayName: 'Public Gateway (ber-prod)',
        resourceType: 'ApiInstance',
      },
    ],
    annotations: [
      { key: 'threshold', value: 'gateway error-rate warning' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-06-02T08:02:31Z' },
    ],
  },
  {
    findingId: '22a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b67',

    reference: 'emeland://findingId/22a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b67',
    displayName: 'Kong Gateway pods restarting',
    description:
      'The kong container restarted 4 times within the last hour; 3 restarts indicate a crash loop.',
    findingType: {
      findingTypeId: 'a7b8c9d1-e2f3-4a4b-8c6d-7e8f9a1b2c3d',
      displayName: 'ThresholdBreached',
    },
    resources: [
      {
        id: 'a1a1a1a1-0018-4000-8000-000000000018',
        displayName: 'Container restarts of Kong Gateway (ber-prod)',
        resourceType: 'MetricInstance',
      },
      {
        id: 'd5a1b2c3-0000-4d5e-8f00-000000000005',
        displayName: 'Kong Gateway (ber-prod)',
        resourceType: 'ComponentInstance',
      },
    ],
    annotations: [
      { key: 'threshold', value: 'gateway restart loop' },
      { key: 'namespace', value: 'kong' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-06-02T07:58:16Z' },
    ],
  },
  {
    findingId: '23a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b68',

    reference: 'emeland://findingId/23a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b68',
    displayName: 'Dead-letter events on deployment.lifecycle',
    description:
      '7 deployment events were parked on the dead-letter topic after three failed deliveries.',
    findingType: {
      findingTypeId: 'a7b8c9d1-e2f3-4a4b-8c6d-7e8f9a1b2c3d',
      displayName: 'ThresholdBreached',
    },
    resources: [
      {
        id: 'a1a1a1a1-0016-4000-8000-000000000016',
        displayName: 'Dead-letter events of topic deployment.lifecycle',
        resourceType: 'MetricInstance',
      },
      {
        id: 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
        displayName: 'Event Bus',
        resourceType: 'API',
      },
    ],
    annotations: [
      { key: 'threshold', value: 'dead-letter events present' },
      { key: 'topic', value: 'deployment.lifecycle.dlq' },
      { key: 'eximpl.emeland.io/detected-at', value: '2026-06-02T08:04:50Z' },
    ],
  },
] satisfies FindingViewWire[]
