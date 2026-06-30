/**
 * Central registry of API endpoint paths.
 *
 * Paths currently mirror the EmELand OpenAPI spec (EmergingEnterpriseLandscape-0.1.0),
 * where every resource lives under `/landscape`. The frontend talks to the
 * modelsrv-web-ui-server, which mounts the API under `/api`, so the effective
 * base is `/api/landscape`.
 *
 * Usage:
 *   apiFetch(API.FINDINGS.list)        // GET /api/landscape/findings
 *   apiFetch(API.FINDINGS.byId(id))    // GET /api/landscape/findings/{id}
 */

const BASE = '/api/landscape'

/** Builds a resource path group: a `list` path and a `byId` builder */
function resource(path: string) {
  return {
    list: `${BASE}${path}`,
    byId: (id: string) => `${BASE}${path}/${id}`,
  }
}

export const API = {
  // Phase 0 — Context
  CONTEXTS: resource('/contexts'),
  CONTEXT_TYPES: resource('/contextTypes'),

  // Phase 1 — Structure
  SYSTEMS: resource('/systems'),
  SYSTEM_INSTANCES: resource('/system-instances'),
  APIS: resource('/apis'),
  API_INSTANCES: resource('/api-instances'),
  COMPONENTS: resource('/components'),
  COMPONENT_INSTANCES: resource('/component-instances'),

  // Phase 2 — Identity & Access
  ORG_UNITS: resource('/orgUnits'),
  GROUPS: resource('/groups'),
  IDENTITIES: resource('/identities'),
  PERMISSION_SPECS: resource('/permissionSpecs'),
  ROLE_SPECS: resource('/roleSpecs'),
  PERMISSIONS: resource('/permissions'),
  ROLES: resource('/roles'),
  BINDINGS: resource('/bindings'),

  // Phase 3 — Capabilities
  PRODUCTS: resource('/products'),

  // Phase 5 — Risk (Findings)
  FINDINGS: resource('/findings'),
  FINDING_TYPES: resource('/findingTypes'),

  // Phase 8 — Artifacts
  ARTIFACTS: resource('/artifacts'),
  ARTIFACT_INSTANCES: resource('/artifactInstances'),

  // Nodes
  NODES: resource('/nodes'),
  NODE_TYPES: resource('/nodeTypes'),

  // Filter
  FILTER_RULES: resource('/filter-rules'),
  MERGE_RULES: resource('/merge-rules'),
} as const

/**
 * Event subscription endpoints. These live under `/api/events` (NOT
 * `/landscape`).
 */
export const EVENTS_API = {
  register: '/api/events/register',
  unregister: '/api/events/unregister',
  subscribers: '/api/events/subscribers',
  query: (sequenceId: string) => `/api/events/query/${sequenceId}`,
  push: '/api/events/push',
} as const
