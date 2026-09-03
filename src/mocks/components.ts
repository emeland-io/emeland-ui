import type {
  Component as ComponentWire,
  ComponentInstance as ComponentInstanceWire,
} from '@/api/gen/types.gen'

/**
 * Components mockups
 *
 * system field from systems.ts
 * consumes/provides API IDs from apis.ts:
 *   command-api:      aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d
 *   query-api:        ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e
 *   event-bus:        ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f
 *   public-gateway:   ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a
 *   promql-api:       ae5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b
 *   metrics-scrape:   af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c
 *   datasource-api:   ba7b8c9d-1e2f-4a3b-4c5d-6e7f8a9b1c2d
 *   dns-resolve:      bb8c9d1e-2f3a-4b4c-5d6e-7f8a9b1c2d3e
 *   postgres-conn:    bc9d1e2f-3a4b-4c5d-6e7f-8a9b1c2d3e4f
 */
export const components = [
  {
    componentId: 'ca1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    displayName: 'App Frontend',
    description: 'Web frontend served via Nginx. Calls Command and Query APIs.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    consumes: [
      'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // command-api
      'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // query-api
    ],
    provides: [],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'platform-team' },
      { key: 'runtime', value: 'nginx' },
    ],
  },
  {
    componentId: 'cb2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    displayName: 'App Backend',
    description:
      'Core business logic. Provides Command/Query APIs, produces events, consumes database.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    consumes: [
      'bc9d1e2f-3a4b-4c5d-6e7f-8a9b1c2d3e4f', // postgres-connection
      'bb8c9d1e-2f3a-4b4c-5d6e-7f8a9b1c2d3e', // dns-resolve
    ],
    provides: [
      'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // command-api
      'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // query-api
      'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // event-bus
      'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c', // metrics-scrape
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'platform-team' },
      { key: 'runtime', value: 'go' },
    ],
  },
  {
    componentId: 'cc3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    displayName: 'Kong Gateway',
    description: 'API gateway proxy. Routes public traffic with rate limiting and JWT auth.',
    version: { version: '3.6.1', availableFrom: '2026-03-15T00:00:00Z' },
    system: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Kong
    consumes: [
      'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // command-api
      'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // query-api
    ],
    provides: [
      'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a', // public-gateway
      'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c', // metrics-scrape
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'infra-team' },
      { key: 'runtime', value: 'nginx/openresty' },
    ],
  },
  {
    componentId: 'cd4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a',
    displayName: 'Grafana Server',
    description: 'Dashboard and alerting server. Queries Prometheus via PromQL.',
    version: { version: '11.1.0', availableFrom: '2026-02-20T00:00:00Z' },
    system: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // Grafana
    consumes: [
      'ae5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b', // promql-api
    ],
    provides: [
      'ba7b8c9d-1e2f-4a3b-4c5d-6e7f8a9b1c2d', // datasource-api
      'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c', // metrics-scrape
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
      { key: 'runtime', value: 'go' },
    ],
  },
  {
    componentId: 'ce5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b',
    displayName: 'Prometheus Server',
    description: 'Time-series database. Scrapes metrics targets and serves PromQL queries.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    consumes: [
      'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c', // metrics-scrape (from targets)
    ],
    provides: [
      'ae5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b', // promql-api
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
      { key: 'runtime', value: 'go' },
    ],
  },
  {
    componentId: 'cf6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c',
    displayName: 'Prometheus Operator',
    description: 'Kubernetes operator managing Prometheus instances and ServiceMonitor CRDs.',
    version: { version: '0.75.0', availableFrom: '2026-03-01T00:00:00Z' },
    system: 'b5e6f7a8-9c1d-4e2f-3a4b-5c6d7e8f9a1b', // Prometheus Operator
    consumes: [],
    provides: [
      'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c', // metrics-scrape
    ],
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
      { key: 'runtime', value: 'go' },
    ],
  },
] satisfies ComponentWire[]

// dangling references for unmapped-instance demos (the spec requires the fields)
const MISSING_COMPONENT = 'ffffffff-0000-4c2d-9c00-0000000000cc'
const MISSING_SYSINST = 'ffffffff-0000-4c2d-9c00-0000000000dd'

export const componentInstances = [
  {
    componentInstanceId: 'd1a1b2c3-0000-4d5e-8f00-000000000001',
    displayName: 'App Frontend (prod-eu)',
    component: 'ca1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:11Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'app' },
    ],
  },
  {
    componentInstanceId: 'd2a1b2c3-0000-4d5e-8f00-000000000002',
    displayName: 'App Frontend (staging)',
    component: 'ca1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:20:44Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'app' },
    ],
  },
  {
    componentInstanceId: 'd3a1b2c3-0000-4d5e-8f00-000000000003',
    displayName: 'App Backend (prod-eu)',
    component: 'cb2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:11Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'app' },
    ],
  },
  {
    componentInstanceId: 'd4a1b2c3-0000-4d5e-8f00-000000000004',
    displayName: 'App Backend (staging)',
    component: 'cb2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:20:44Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'app' },
    ],
  },
  {
    componentInstanceId: 'd5a1b2c3-0000-4d5e-8f00-000000000005',
    displayName: 'Kong Gateway (prod-eu)',
    component: 'cc3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    systemInstance: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:08Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'kong' },
    ],
  },
  {
    componentInstanceId: 'd6a1b2c3-0000-4d5e-8f00-000000000006',
    displayName: 'Kong Gateway (staging)',
    component: 'cc3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    systemInstance: 'f9c1d2e3-0000-4c6d-8e8f-9a1b2c3d4e02',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:21:02Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'kong' },
    ],
  },
  {
    componentInstanceId: 'd7a1b2c3-0000-4d5e-8f00-000000000007',
    displayName: 'Grafana Server (prod)',
    component: 'cd4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a',
    systemInstance: '1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:23:55Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    componentInstanceId: 'd8a1b2c3-0000-4d5e-8f00-000000000008',
    displayName: 'Grafana Server (staging)',
    component: 'cd4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a',
    systemInstance: '1a2b3c4d-0000-4a8c-8d1e-2f3a4b5c6d02',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:22:19Z' },
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    componentInstanceId: 'd9a1b2c3-0000-4d5e-8f00-000000000009',
    displayName: 'Prometheus Server (prod)',
    component: 'ce5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b',
    systemInstance: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:01Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    componentInstanceId: 'd10a1b2c3-0000-4d5e-8f00-00000000000a',
    displayName: 'Prometheus Operator (prod)',
    component: 'cf6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c',
    systemInstance: '3c4d5e6f-7a8b-4c9d-1e2f-3a4b5c6d7e8f',
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:24:03Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },

  // Unmapped instances — grouped below by their broken component reference:
  //   ffffffff-0000-4211-8000-0000000000cc  legacy estate (5)
  //   ffffffff-0000-4211-8000-0000000000cd  sensor-discovered workloads (4)
  //   (no component reference at all)       (3)
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000a1',
    displayName: 'Mystery Container',
    component: MISSING_COMPONENT, // dangling reference (unmapped demo)
    systemInstance: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f', // Kong (prod-eu)
    consumes: [],
    provides: [],
    annotations: [
      { key: 'eximpl.emeland.io/last-update', value: '2026-05-28T09:25:02Z' },
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'kong' },
    ],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000a2',
    displayName: 'Legacy Worker',
    component: 'ffffffff-0000-4211-8000-0000000000cc', // unresolvable component reference
    systemInstance: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e', // Prometheus (prod)
    consumes: [],
    provides: [],
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000a3',
    displayName: 'Legacy Batch Worker',
    component: 'ffffffff-0000-4211-8000-0000000000cc',
    systemInstance: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e', // Prometheus (prod)
    consumes: [],
    provides: [],
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000a4',
    displayName: 'Legacy Scheduler',
    component: 'ffffffff-0000-4211-8000-0000000000cc',
    systemInstance: MISSING_SYSINST, // dangling reference (unmapped demo)
    consumes: [],
    provides: [],
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000a5',
    displayName: 'Legacy File Importer',
    component: 'ffffffff-0000-4211-8000-0000000000cc',
    systemInstance: MISSING_SYSINST, // dangling reference (unmapped demo)
    consumes: [],
    provides: [],
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000a6',
    displayName: 'Legacy Mail Relay',
    component: 'ffffffff-0000-4211-8000-0000000000cc',
    systemInstance: MISSING_SYSINST, // dangling reference (unmapped demo)
    consumes: [],
    provides: [],
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000b1',
    displayName: 'Discovered Container (redis)',
    component: 'ffffffff-0000-4211-8000-0000000000cd', // unresolvable component reference
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    consumes: [],
    provides: [],
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'data' },
    ],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000b2',
    displayName: 'Discovered Container (nginx)',
    component: 'ffffffff-0000-4211-8000-0000000000cd',
    systemInstance: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f', // Kong (prod-eu)
    consumes: [],
    provides: [],
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'kong' },
    ],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000b3',
    displayName: 'Discovered Sidecar (log-shipper)',
    component: 'ffffffff-0000-4211-8000-0000000000cd',
    systemInstance: '1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d', // Grafana (prod)
    consumes: [],
    provides: [],
    annotations: [
      { key: 'cluster', value: 'ber-prod' },
      { key: 'namespace', value: 'monitoring' },
    ],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000b4',
    displayName: 'Discovered Job (backup)',
    component: 'ffffffff-0000-4211-8000-0000000000cd',
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02', // Application (staging)
    consumes: [],
    provides: [],
    annotations: [
      { key: 'cluster', value: 'ber-staging' },
      { key: 'namespace', value: 'batch' },
    ],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000c1',
    displayName: 'Unknown Daemon',
    component: MISSING_COMPONENT, // dangling reference (unmapped demo)
    systemInstance: MISSING_SYSINST, // dangling reference (unmapped demo)
    consumes: [],
    provides: [],
    annotations: [],
  },
  {
    componentInstanceId: 'd11a1b2c-0000-4d5e-8f00-0000000000c2',
    displayName: 'Orphan Pod',
    component: MISSING_COMPONENT, // dangling reference (unmapped demo)
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02', // Application (staging)
    consumes: [],
    provides: [],
    annotations: [{ key: 'cluster', value: 'ber-staging' }],
  },
] satisfies ComponentInstanceWire[]
