import type { OrderResponse } from '@/api/orders'

/**
 * Orders mockups (Phase 3 reification) — not in the modelsrv OpenAPI spec
 * yet, so these are frontend-shaped until the backend ships them.
 *
 * References resolve to the capabilities mocks (mocks/capabilities.ts), the
 * parameters mocks (mocks/parameters.ts) and the systems mocks. Together the
 * orders cover every fulfillment state: fully fulfilled (a1, a6), partially
 * fulfilled (a5, a7), open (a2, a3, a4, a8), a deprecated pinned version (a3)
 * and a bound value outside the parameter's valid values (a4).
 *
 * Org units (no OrgUnit resource in the UI yet, IDs only):
 *   9f8e7d6c-...a1  Payments
 *   9f8e7d6c-...a2  Operations
 *   9f8e7d6c-...a3  Webshop
 *   9f8e7d6c-...a4  Data & AI
 */
export const orders = [
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a1',
    displayName: 'Payments DE mail capacity',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a1',
    orderedAt: '2026-05-04T10:12:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1a1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000001', // Managed mail server
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v101', // v1.2.0
        boundValues: [
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p101', value: '10 users' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p102', value: 'Germany' },
        ],
        systemInstance: 'e8b9c1d2-3f4a-4b5c-6d7e-8f9a1b2c3d4e', // Application (prod-eu)
        annotations: [],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'platform-team' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a2',
    displayName: 'Analytics sandbox environment',
    orderedAt: '2026-05-20T14:30:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1b1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000002', // Managed Kubernetes namespace
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v200', // v2.0.0
        boundValues: [{ parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p103', value: 'small' }],
        annotations: [],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1b2',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000005', // Object storage bucket
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v500', // v1.0.0
        boundValues: [
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', value: '1 TB' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p109', value: 'archive' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p102', value: 'Germany' },
        ],
        annotations: [],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1b3',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000003', // Dedicated firewall rule
        boundValues: [
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p104', value: 'port 443 only' },
        ],
        annotations: [{ key: 'env', value: 'staging' }],
      },
    ],
    annotations: [],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a3',
    displayName: 'Legacy mail relay renewal',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a2',
    orderedAt: '2026-02-11T09:00:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1c1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000001', // Managed mail server
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v100', // v1.1.0 — deprecated
        boundValues: [{ parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p101', value: '100 users' }],
        annotations: [],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-identities', value: 'ops-lead' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a4',
    displayName: 'Scratch evaluation order',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1d1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000003', // Dedicated firewall rule
        boundValues: [
          // not among the parameter's valid values — renders the invalid-value hint
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p104', value: 'port 8080-8090' },
        ],
        annotations: [],
      },
    ],
    annotations: [],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a5',
    displayName: 'Webshop production backend',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a3',
    orderedAt: '2026-06-02T08:45:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1e1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000004', // Managed PostgreSQL database
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v401', // v2.0.0
        boundValues: [
          {
            parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p106',
            value: 'medium (4 vCPU, 16 GB RAM)',
          },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', value: '250 GB' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', value: 'multi-zone' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p102', value: 'Germany' },
        ],
        annotations: [],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1e2',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000007', // Managed API gateway route
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v700', // v1.3.0
        systemInstance: 'f9c1d2e3-4a5b-4c6d-7e8f-9a1b2c3d4e5f', // Kong (prod-eu)
        annotations: [{ key: 'route', value: 'shop.example.com/api' }],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'webshop-team' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a6',
    displayName: 'Payments squad observability',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a1',
    orderedAt: '2026-04-14T11:20:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1f1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000006', // Observability workspace
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v600', // v2.1.0
        boundValues: [{ parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p108', value: '30 days' }],
        systemInstance: '1a2b3c4d-5e6f-4a7b-8c9d-1e2f3a4b5c6d', // Grafana (prod)
        annotations: [],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1f2',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000006', // Observability workspace
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v600', // v2.1.0
        boundValues: [{ parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p108', value: '90 days' }],
        systemInstance: '2b3c4d5e-6f7a-4b8c-9d1e-2f3a4b5c6d7e', // Prometheus (prod)
        annotations: [{ key: 'scope', value: 'long-term metrics' }],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'payments-squad' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a7',
    displayName: 'ML training cluster (Data & AI)',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a4',
    orderedAt: '2026-07-08T09:30:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1g1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000c', // Managed Kubernetes cluster (dedicated)
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000v901', // v4.2.0
        boundValues: [
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p110', value: '1.33' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p111', value: '12 nodes' },
          {
            parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
            value: 'gpu (8 vCPU, 64 GB RAM, 1x L40S)',
          },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p107', value: 'multi-zone' },
        ],
        annotations: [{ key: 'use-case', value: 'model training' }],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1g2',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000d', // kube-prometheus-stack
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000va01', // v0.75.0
        boundValues: [
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p108', value: '30 days' },
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p109', value: 'standard' },
        ],
        systemInstance: '3c4d5e6f-7a8b-4c9d-1e2f-3a4b5c6d7e8f', // Prometheus Operator (prod)
        annotations: [],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'data-ai-team' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a8',
    displayName: 'Platform CI modernization',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a2',
    orderedAt: '2026-08-20T13:05:00Z',
    items: [
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1h1',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-000000000010', // CI runner pool (Kubernetes)
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000vd01', // v3.0.0
        boundValues: [
          { parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p113', value: '20 jobs' },
          {
            parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p112',
            value: 'compute (16 vCPU, 64 GB RAM)',
          },
        ],
        annotations: [],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1h2',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000f', // Container registry project (Harbor)
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000vc01', // v1.2.0
        boundValues: [{ parameterId: '5b6c7d8e-0001-4e5f-9a1b-00000000p105', value: '250 GB' }],
        annotations: [],
      },
      {
        orderItemId: '0a1b2c3d-0001-4d5e-8f00-00000000i1h3',
        capability: 'c1a2b3c4-0001-4a3b-8c1d-00000000000e', // GitOps delivery (Argo CD)
        capabilityVersion: 'c1a2b3c4-0001-4a3b-8c1d-00000000vb01', // v2.11.0
        annotations: [{ key: 'repository', value: 'git.internal/platform/deployments' }],
      },
    ],
    annotations: [{ key: 'emeland.io/owner-groups', value: 'ops-team' }],
  },
] satisfies OrderResponse[]
