import type { Api as ApiWire, ApiInstance as ApiInstanceWire } from '@/api/gen/types.gen'

/**
 * APIs mockups
 *
 * IDs referenced by:
 *   - Components in components.ts (consumes/provides arrays)
 *
 * system field references Systems from systems.ts:
 *   Application:      7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d
 *   Kong:             8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e
 *   Grafana:          9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f
 *   Prometheus:       a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a
 *   DNS Service:      c6f7a8b9-1d2e-4f3a-4b5c-6d7e8f9a1b2c
 *   Database Service: d7a8b9c1-2e3f-4a4b-5c6d-7e8f9a1b2c3d
 */
export const apis = [
  {
    apiId: 'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
    displayName: 'Command API',
    description:
      'REST API for write operations. Triggers builds, deployments and pipeline actions.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    type: 'OpenAPI',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    annotations: [{ key: 'emeland.io/owner-identities', value: 'platform-team' }],
  },
  {
    apiId: 'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e',
    displayName: 'Query API',
    description: 'REST API for read operations. Pipeline status, build history, artifact metadata.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    type: 'OpenAPI',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    annotations: [{ key: 'emeland.io/owner-identities', value: 'platform-team' }],
  },
  {
    apiId: 'ac3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f',
    displayName: 'Event Bus',
    description: 'Async event interface for build and deployment lifecycle events. Kafka-based.',
    version: { version: '1.8.3', availableFrom: '2026-04-01T00:00:00Z' },
    type: 'Other',
    system: '7a1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Application
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'platform-team' },
      { key: 'protocol', value: 'kafka' },
    ],
  },
  {
    apiId: 'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a',
    displayName: 'Public Gateway',
    description: 'Public-facing API gateway endpoint with rate limiting and auth.',
    version: { version: '3.6.1', availableFrom: '2026-03-15T00:00:00Z' },
    type: 'OpenAPI',
    system: '8b2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Kong
    annotations: [{ key: 'emeland.io/owner-identities', value: 'infra-team' }],
  },
  {
    apiId: 'ae5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b',
    displayName: 'PromQL API',
    description: 'Prometheus query API for metrics querying and alerting evaluation.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    type: 'OpenAPI',
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    annotations: [{ key: 'emeland.io/owner-identities', value: 'obs-team' }],
  },
  {
    apiId: 'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c',
    displayName: 'Metrics Scrape Endpoint',
    description: 'Prometheus scrape target. Exposes /metrics in OpenMetrics format.',
    version: { version: '2.53.0', availableFrom: '2026-03-01T00:00:00Z' },
    type: 'Other',
    system: 'a4d5e6f7-8b9c-4d1e-2f3a-4b5c6d7e8f9a', // Prometheus
    annotations: [
      { key: 'emeland.io/owner-identities', value: 'obs-team' },
      { key: 'protocol', value: 'openmetrics' },
    ],
  },
  {
    apiId: 'ba7b8c9d-1e2f-4a3b-4c5d-6e7f8a9b1c2d',
    displayName: 'Datasource API',
    description: 'Grafana datasource provisioning and query API.',
    version: { version: '11.1.0', availableFrom: '2026-02-20T00:00:00Z' },
    type: 'OpenAPI',
    system: '9c3d4e5f-6a7b-4c8d-1e2f-3a4b5c6d7e8f', // Grafana
    annotations: [{ key: 'emeland.io/owner-identities', value: 'obs-team' }],
  },
  {
    apiId: 'bb8c9d1e-2f3a-4b4c-5d6e-7f8a9b1c2d3e',
    displayName: 'DNS Resolve API',
    description: 'DNS name resolution. Provided by external infrastructure.',
    version: { version: '1.0.0' },
    type: 'Other',
    system: 'c6f7a8b9-1d2e-4f3a-4b5c-6d7e8f9a1b2c', // DNS Service
    annotations: [{ key: 'protocol', value: 'dns' }],
  },
  {
    apiId: 'bc9d1e2f-3a4b-4c5d-6e7f-8a9b1c2d3e4f',
    displayName: 'PostgreSQL Connection',
    description: 'PostgreSQL wire protocol. Provided by managed database service.',
    version: { version: '16.2.0' },
    type: 'Other',
    system: 'd7a8b9c1-2e3f-4a4b-5c6d-7e8f9a1b2c3d', // Database Service
    annotations: [{ key: 'protocol', value: 'postgres' }],
  },
] satisfies ApiWire[]

/**
 * ApiInstances mockups
 *
 * api field references APIs above.
 * systemInstance field references SystemInstances from systems.ts:
 *   Application (prod-eu):   e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e
 *   Application (staging):   e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02
 *   Kong (prod-eu):          f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f
 *   Kong (staging):          f9c1d2e3-0000-4c6d-8e8f-9a1b2c3d4e02
 *   Grafana (prod):          1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d
 *   Prometheus (prod):       2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e
 *
 * The `emeland.io/endpoint.*` annotations follow the registry in the EmELand
 * book (Phase 1: Structure — ApiInstance): protocol/host required, port and
 * path optional (defaults 443/80 and `/`).
 */
export const apiInstances = [
  {
    apiInstanceId: 'ea1b2c3d-0000-4d5e-8f00-000000000001',
    displayName: 'Command API (prod-eu)',
    api: 'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Command API
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'api.prod-eu.example.com' },
      { key: 'emeland.io/endpoint.port', value: '443' },
      { key: 'emeland.io/endpoint.path', value: '/api/v1/command' },
    ],
  },
  {
    apiInstanceId: 'ea1b2c3d-0000-4d5e-8f00-000000000002',
    displayName: 'Command API (staging)',
    api: 'aa1b2c3d-4e5f-4a6b-8c9d-1e2f3a4b5c6d', // Command API
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02', // Application (staging)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'app-backend.staging.internal' },
      { key: 'emeland.io/endpoint.port', value: '8080' },
      { key: 'emeland.io/endpoint.path', value: '/api/v1/command' },
    ],
  },
  {
    apiInstanceId: 'eb1b2c3d-0000-4d5e-8f00-000000000001',
    displayName: 'Query API (prod-eu)',
    api: 'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Query API
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'api.prod-eu.example.com' },
      { key: 'emeland.io/endpoint.path', value: '/api/v1/query' }, //port omitted -> 443
    ],
  },
  {
    apiInstanceId: 'eb1b2c3d-0000-4d5e-8f00-000000000002',
    displayName: 'Query API (staging)',
    api: 'ab2c3d4e-5f6a-4b7c-9d1e-2f3a4b5c6d7e', // Query API
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02', // Application (staging)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'app-backend.staging.internal' },
      { key: 'emeland.io/endpoint.port', value: '8080' },
      { key: 'emeland.io/endpoint.path', value: '/api/v1/query' },
    ],
  },
  {
    apiInstanceId: 'ed1b2c3d-0000-4d5e-8f00-000000000001',
    displayName: 'Public Gateway (prod-eu)',
    api: 'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a', // Public Gateway
    systemInstance: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f', // Kong (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'gateway.example.com' }, //port and path omitted -> 443 and /
    ],
  },
  {
    apiInstanceId: 'ed1b2c3d-0000-4d5e-8f00-000000000002',
    displayName: 'Public Gateway (staging)',
    api: 'ad4e5f6a-7b8c-4d9e-1f2a-3b4c5d6e7f8a', // Public Gateway
    systemInstance: 'f9c1d2e3-0000-4c6d-8e8f-9a1b2c3d4e02', // Kong (staging)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'kong.staging.internal' },
      { key: 'emeland.io/endpoint.port', value: '8000' }, //path omitted -> /
    ],
  },
  {
    apiInstanceId: 'ee1b2c3d-0000-4d5e-8f00-000000000001',
    displayName: 'PromQL API (prod)',
    api: 'ae5f6a7b-8c9d-4e1f-2a3b-4c5d6e7f8a9b', // PromQL API
    systemInstance: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e', // Prometheus (prod)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'prometheus.prod.internal' },
      { key: 'emeland.io/endpoint.port', value: '9090' },
      { key: 'emeland.io/endpoint.path', value: '/api/v1' },
    ],
  },
  {
    apiInstanceId: 'ef1b2c3d-0000-4d5e-8f00-000000000001',
    displayName: 'Metrics Scrape (prod-eu)',
    api: 'af6a7b8c-9d1e-4f2a-3b4c-5d6e7f8a9b1c', // Metrics Scrape Endpoint
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'app-backend.prod.internal' },
      { key: 'emeland.io/endpoint.port', value: '8080' },
      { key: 'emeland.io/endpoint.path', value: 'metrics' }, //leading slash added on display
    ],
  },
  {
    apiInstanceId: 'ea7b2c3d-0000-4d5e-8f00-000000000001',
    displayName: 'Datasource API (prod)',
    api: 'ba7b8c9d-1e2f-4a3b-4c5d-6e7f8a9b1c2d', // Datasource API
    systemInstance: '1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d', // Grafana (prod)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'grafana.prod.internal' },
      { key: 'emeland.io/endpoint.port', value: '3000' },
      { key: 'emeland.io/endpoint.path', value: '/api' },
    ],
  },
  {
    apiInstanceId: 'ebb1b2c3-0000-4d5e-8f00-000000000001',
    displayName: 'DNS Resolve (external)',
    api: 'bb8c9d1e-2f3a-4b4c-5d6e-7f8a9b1c2d3e', // DNS Resolve API
    // no systemInstance: external provider, not tracked in the landscape
    // no endpoint annotations: not a probe target
    annotations: [],
  },

  // Unmapped instances — grouped below by their broken API reference:
  //   ffffffff-0000-4211-8000-0000000000aa  legacy estate (3)
  //   ffffffff-0000-4211-8000-0000000000ab  sensor-discovered endpoints (6)
  //   (no API reference at all)             (4)
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000a1',
    displayName: 'Inventory Scrape',
    // no api: discovered by the k8s sensor, not yet mapped to an API resource
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'inventory.prod.internal' },
      { key: 'emeland.io/endpoint.port', value: '9100' },
      { key: 'emeland.io/endpoint.path', value: '/metrics' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000a2',
    displayName: 'Staging Listener',
    // no api
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02', // Application (staging)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'listener.staging.internal' },
      { key: 'emeland.io/endpoint.port', value: '8088' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000a3',
    displayName: 'Legacy Endpoint',
    api: 'ffffffff-0000-4211-8000-0000000000aa', // unresolvable API reference
    // no endpoint annotations
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000a4',
    displayName: 'Floating Endpoint',
    // no api, no systemInstance: fully detached
    annotations: [],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000a5',
    displayName: 'Legacy SOAP Endpoint',
    api: 'ffffffff-0000-4211-8000-0000000000aa',
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000a6',
    displayName: 'Legacy Poller',
    api: 'ffffffff-0000-4211-8000-0000000000aa',
    annotations: [{ key: 'p1-system-status', value: 'legacy' }],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000b1',
    displayName: 'Discovered REST Endpoint (orders)',
    api: 'ffffffff-0000-4211-8000-0000000000ab', // unresolvable API reference
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'orders.prod.internal' },
      { key: 'emeland.io/endpoint.path', value: '/api/v2/orders' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000b2',
    displayName: 'Discovered REST Endpoint (billing)',
    api: 'ffffffff-0000-4211-8000-0000000000ab',
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'billing.prod.internal' },
      { key: 'emeland.io/endpoint.path', value: '/api/v2/billing' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000b3',
    displayName: 'Discovered gRPC Endpoint (telemetry)',
    api: 'ffffffff-0000-4211-8000-0000000000ab',
    systemInstance: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e', // Prometheus (prod)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'grpc' },
      { key: 'emeland.io/endpoint.host', value: 'telemetry.prod.internal' },
      { key: 'emeland.io/endpoint.port', value: '9091' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000b4',
    displayName: 'Discovered REST Endpoint (shipping)',
    api: 'ffffffff-0000-4211-8000-0000000000ab',
    systemInstance: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f', // Kong (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'shipping.prod.internal' },
      { key: 'emeland.io/endpoint.path', value: '/api/v1/shipping' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000b5',
    displayName: 'Discovered Webhook (ci-callback)',
    api: 'ffffffff-0000-4211-8000-0000000000ab',
    systemInstance: 'e8b9c1d2-0000-4b5c-8d7e-8f9a1b2c3d02', // Application (staging)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'ci-callback.staging.internal' },
      { key: 'emeland.io/endpoint.port', value: '8088' },
      { key: 'emeland.io/endpoint.path', value: '/hooks/ci' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000b6',
    displayName: 'Discovered REST Endpoint (auth)',
    api: 'ffffffff-0000-4211-8000-0000000000ab',
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'https' },
      { key: 'emeland.io/endpoint.host', value: 'auth.prod.internal' },
      { key: 'emeland.io/endpoint.path', value: '/oauth2' },
    ],
  },
  {
    apiInstanceId: 'ec1b2c3d-0000-4d5e-8f00-0000000000c1',
    displayName: 'Metrics Listener (iot)',
    // no api
    systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
    annotations: [
      { key: 'emeland.io/endpoint.protocol', value: 'http' },
      { key: 'emeland.io/endpoint.host', value: 'iot-metrics.prod.internal' },
      { key: 'emeland.io/endpoint.port', value: '9100' },
    ],
  },
] satisfies ApiInstanceWire[]
