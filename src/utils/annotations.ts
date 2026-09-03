import type { Annotations } from '@/types/common'

export function annBySuffix(annotations: Annotations, suffix: string): string | undefined {
  if (annotations[suffix] !== undefined) return annotations[suffix]
  const entry = Object.entries(annotations).find(([k]) => k === suffix || k.endsWith(`/${suffix}`))
  return entry?.[1]
}

export function formatTimestamp(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const s = iso.replace('T', ' ')
  return s.length >= 16 ? `${s.slice(0, 16)} UTC` : s
}

export interface WellKnownAnnotation {
  suffix: string
  label: string
  purpose: string
  example: string
  appliesTo: string
  category: string
  format?: (raw: string) => string | undefined
}

/**
 * Catalog of the annotations the backend and UI recognizes
 */
export const WELL_KNOWN_ANNOTATIONS: WellKnownAnnotation[] = [
  // general
  {
    suffix: 'last-update',
    label: 'Last update',
    purpose: 'Timestamp of the last change to the resource (UI-only)',
    example: '2026-05-28T09:24:11Z',
    appliesTo: 'any resource',
    category: 'General',
    format: formatTimestamp,
  },

  // endpoint probing (docs/endpoint-annotations.md)
  {
    suffix: 'endpoint.protocol',
    label: 'Endpoint protocol',
    purpose: 'URL scheme of the probe target',
    example: 'https',
    appliesTo: 'ApiInstance',
    category: 'Endpoint',
  },
  {
    suffix: 'endpoint.host',
    label: 'Endpoint host',
    purpose: 'Hostname or IP the instance is reachable at',
    example: 'payments.prod.eu.example.com',
    appliesTo: 'ApiInstance',
    category: 'Endpoint',
  },
  {
    suffix: 'endpoint.port',
    label: 'Endpoint port',
    purpose: 'TCP port (defaults to 443/80 by protocol)',
    example: '443',
    appliesTo: 'ApiInstance',
    category: 'Endpoint',
  },
  {
    suffix: 'endpoint.path',
    label: 'Endpoint path',
    purpose: 'HTTP path to probe (leading slash added if missing)',
    example: '/api/v1/health',
    appliesTo: 'ApiInstance',
    category: 'Endpoint',
  },

  // ownership visibility (pkg/authz)
  {
    suffix: 'owner-identities',
    label: 'Owner identities',
    purpose: 'Owner OIDC subjects; restricts read visibility',
    example: 'alice,bob',
    appliesTo: 'any resource',
    category: 'Ownership',
  },
  {
    suffix: 'owner-groups',
    label: 'Owner groups',
    purpose: 'Owner group ids; restricts read visibility',
    example: 'platform-team',
    appliesTo: 'any resource',
    category: 'Ownership',
  },

  // capacity (docs/capacity-annotations.md)
  {
    suffix: 'dimension',
    label: 'Dimension',
    purpose: 'UI / grouping family for capacity types and metrics',
    example: 'compute',
    appliesTo: 'CapacityResourceType, Metric',
    category: 'Capacity',
  },
  {
    suffix: 'value-kind',
    label: 'Value kind',
    purpose: 'Validation hint for amounts',
    example: 'decimal',
    appliesTo: 'CapacityResourceType',
    category: 'Capacity',
  },
  {
    suffix: 'granularity',
    label: 'Granularity',
    purpose: 'Smallest meaningful step for amounts',
    example: '0.001',
    appliesTo: 'CapacityResourceType',
    category: 'Capacity',
  },
  {
    suffix: 'source',
    label: 'Source',
    purpose: 'Provenance of the amount',
    example: 'measured',
    appliesTo: 'Capacity',
    category: 'Capacity',
  },
  {
    suffix: 'subject-kind',
    label: 'Subject kind',
    purpose: 'Landscape type of the related subject (PascalCase)',
    example: 'SystemInstance',
    appliesTo: 'Capacity',
    category: 'Capacity',
  },
  {
    suffix: 'subject-id',
    label: 'Subject id',
    purpose: 'UUID of the related subject resource',
    example: '550e8400-e29b-41d4-a716-446655440000',
    appliesTo: 'Capacity',
    category: 'Capacity',
  },
  {
    suffix: 'unit',
    label: 'Unit',
    purpose: 'Unit override when the entry differs from the type default',
    example: 'mcores',
    appliesTo: 'Capacity, Metric',
    category: 'Capacity',
  },
  {
    suffix: 'reserved-amount',
    label: 'Reserved amount',
    purpose: 'Allocated but not consumed amount',
    example: '8',
    appliesTo: 'Capacity',
    category: 'Capacity',
  },
  {
    suffix: 'soft-limit',
    label: 'Soft limit',
    purpose: 'Warning threshold for the amount',
    example: '0.8',
    appliesTo: 'Capacity',
    category: 'Capacity',
  },
  {
    suffix: 'hard-limit',
    label: 'Hard limit',
    purpose: 'Hard cap for the amount',
    example: '1.0',
    appliesTo: 'Capacity',
    category: 'Capacity',
  },

  // observability (docs/observability-annotations.md)
  {
    suffix: 'metric.expression',
    label: 'Metric expression',
    purpose: 'Composition formula of a compound metric',
    example: 'a + b',
    appliesTo: 'Metric',
    category: 'Observability',
  },
  {
    suffix: 'metric.language',
    label: 'Metric language',
    purpose: 'Language of the composition formula',
    example: 'promql',
    appliesTo: 'Metric',
    category: 'Observability',
  },
  {
    suffix: 'threshold.expression',
    label: 'Threshold expression',
    purpose: 'Condition of arbitrary complexity',
    example: 'histogram_quantile(0.99, ...) > 0.5',
    appliesTo: 'Threshold',
    category: 'Observability',
  },
  {
    suffix: 'threshold.language',
    label: 'Threshold language',
    purpose: 'Expression language of the threshold condition',
    example: 'promql',
    appliesTo: 'Threshold',
    category: 'Observability',
  },
  {
    suffix: 'thresholds',
    label: 'Linked thresholds',
    purpose: 'Comma/space-separated Threshold UUIDs',
    example: '550e8400-…,7c9e6679-…',
    appliesTo: 'any resource',
    category: 'Observability',
  },
  {
    suffix: 'metric-values',
    label: 'Linked metric values',
    purpose: 'Comma/space-separated MetricValue UUIDs',
    example: 'a1b2c3d4-…',
    appliesTo: 'any resource',
    category: 'Observability',
  },

  // sensors
  {
    suffix: 'k8s-sensor/context-parent',
    label: 'K8s context parent',
    purpose: 'Kubernetes parent reference for sensor-derived contexts',
    example: 'prod-eu-1/api/v1/namespaces/payments',
    appliesTo: 'Context',
    category: 'Sensors',
  },

  // artifacts (pkg/model/artifact)
  {
    suffix: 'p8-artifact-instance-location',
    label: 'Artifact locations',
    purpose: 'Where the artifact instance artifacts are stored',
    example: 's3://release-artifacts/payments-api/0.75.0',
    appliesTo: 'ArtifactInstance',
    category: 'Artifacts',
  },
  {
    suffix: 'p8-artifact-instance-credentials-ref',
    label: 'Artifact credentials ref',
    purpose: 'Reference to the credentials pack for artifact access',
    example: 'secrets-store:artifact-read',
    appliesTo: 'ArtifactInstance',
    category: 'Artifacts',
  },
]

export interface WellKnownAnnotationRow {
  key: string
  label: string
  value: string
}

export function wellKnownAnnotations(annotations: Annotations): WellKnownAnnotationRow[] {
  const rows: WellKnownAnnotationRow[] = []
  for (const def of WELL_KNOWN_ANNOTATIONS) {
    const raw = annBySuffix(annotations, def.suffix)
    if (raw === undefined) continue
    const value = def.format ? def.format(raw) : raw
    if (!value) continue
    rows.push({ key: def.suffix, label: def.label, value })
  }
  return rows
}

export function differingAnnotationKeys(items: Annotations[]): string[] {
  if (items.length < 2) return []
  const keys = new Set<string>()
  for (const annotations of items) {
    for (const key of Object.keys(annotations)) keys.add(key)
  }
  return [...keys]
    .filter((key) => {
      const first = items[0][key]
      return items.some((annotations) => annotations[key] !== first)
    })
    .sort()
}
