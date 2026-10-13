import type { OrderWire } from '@/api/orders'

/**
 * Order mockups (wire format, flat). Items live in orderItems.ts, their bound
 * values in boundValues.ts; the api layer nests them on load. `orderedAt` is
 * frontend-first, not in the modelsrv spec yet.
 *
 * Together the orders cover every fulfillment state: fully fulfilled (a1, a6),
 * partially fulfilled (a5, a7), open (a2, a3, a4, a8), a deprecated pinned
 * version (a3) and a bound value outside the parameter's valid values (a4).
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
    annotations: [{ key: 'emeland.io/owner-groups', value: 'platform-team' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a2',
    displayName: 'Analytics sandbox environment',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a4',
    orderedAt: '2026-05-20T14:30:00Z',
    annotations: [],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a3',
    displayName: 'Legacy mail relay renewal',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a2',
    orderedAt: '2026-02-11T09:00:00Z',
    annotations: [{ key: 'emeland.io/owner-identities', value: 'ops-lead' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a4',
    displayName: 'Scratch evaluation order',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a2',
    annotations: [],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a5',
    displayName: 'Webshop production backend',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a3',
    orderedAt: '2026-06-02T08:45:00Z',
    annotations: [{ key: 'emeland.io/owner-groups', value: 'webshop-team' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a6',
    displayName: 'Payments squad observability',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a1',
    orderedAt: '2026-04-14T11:20:00Z',
    annotations: [{ key: 'emeland.io/owner-groups', value: 'payments-squad' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a7',
    displayName: 'ML training cluster (Data & AI)',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a4',
    orderedAt: '2026-07-08T09:30:00Z',
    annotations: [{ key: 'emeland.io/owner-groups', value: 'data-ai-team' }],
  },
  {
    orderId: '0a1b2c3d-0001-4d5e-8f00-0000000000a8',
    displayName: 'Platform CI modernization',
    orgUnit: '9f8e7d6c-0001-4c2d-9e0f-0000000000a2',
    orderedAt: '2026-08-20T13:05:00Z',
    annotations: [{ key: 'emeland.io/owner-groups', value: 'ops-team' }],
  },
] satisfies OrderWire[]
