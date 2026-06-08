import type { Component } from '@/types/component'

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
export const components: Component[] = [
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
    annotations: { 'emeland.io/owner': 'platform-team', 'emeland.io/runtime': 'nginx' },
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
    annotations: { 'emeland.io/owner': 'platform-team', 'emeland.io/runtime': 'go' },
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
    annotations: { 'emeland.io/owner': 'infra-team', 'emeland.io/runtime': 'nginx/openresty' },
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
    annotations: { 'emeland.io/owner': 'obs-team', 'emeland.io/runtime': 'go' },
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
    annotations: { 'emeland.io/owner': 'obs-team', 'emeland.io/runtime': 'go' },
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
    annotations: { 'emeland.io/owner': 'obs-team', 'emeland.io/runtime': 'go' },
  },
]
