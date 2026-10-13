import type { CapabilityWireWithDescription } from '@/api/capabilities'

/**
 * Capability mockups (wire format). Versions live in capabilityVersions.ts and
 * are joined onto each capability by the capabilities API module, same shape
 * as live GET /landscape/capabilityVersions.
 */
export const capabilities = [
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000001',
    displayName: 'Managed mail server',
    description: 'Hosted mailboxes with SMTP and IMAP access',
    annotations: [
      {
        key: 'emeland.io/owner-groups',
        value: 'platform-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000002',
    displayName: 'Managed Kubernetes namespace',
    description: 'A namespace on the shared platform cluster',
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000003',
    displayName: 'Dedicated firewall rule',
    description: 'One rule on the perimeter firewall',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'netsec-lead',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000004',
    displayName: 'Managed PostgreSQL database',
    description: 'PostgreSQL instance with backups and patching',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'infra-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000005',
    displayName: 'Object storage bucket (S3-compatible)',
    description: 'S3-compatible bucket on the storage grid',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'infra-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000006',
    displayName: 'Observability workspace',
    description: 'Metrics, logs and tracing stack per team',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'obs-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000007',
    displayName: 'Managed API gateway route',
    description: 'Routed and rate-limited endpoint on the gateway',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'infra-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000008',
    displayName: 'Legacy VM hosting',
    description: 'Single VM on the legacy hypervisor estate',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'ops-lead',
      },
      {
        key: 'p3-successor',
        value: 'Managed Kubernetes namespace',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000009',
    displayName: 'DNS entry',
    description: 'One record in the corporate DNS zones',
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000a',
    displayName: 'Storage budget',
    description: 'Quota slice of the shared storage pool',
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000b',
    displayName: 'Load balancer',
    description: 'Anycast VIP with TLS termination',
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000c',
    displayName: 'Managed Kubernetes cluster (dedicated)',
    description: 'Dedicated cluster with managed control plane and node pools',
    annotations: [
      {
        key: 'emeland.io/owner-groups',
        value: 'platform-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000d',
    displayName: 'kube-prometheus-stack',
    description: 'Prometheus, Grafana and Alertmanager installed as one stack',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'obs-team',
      },
      {
        key: 'p3-template-source',
        value: 'helm:prometheus-community/kube-prometheus-stack:0.75.0',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000e',
    displayName: 'GitOps delivery (Argo CD)',
    description: 'Argo CD project syncing a Git repository into a namespace',
    annotations: [
      {
        key: 'emeland.io/owner-groups',
        value: 'platform-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-00000000000f',
    displayName: 'Container registry project (Harbor)',
    description: 'Team project on the Harbor registry with image scanning',
    annotations: [
      {
        key: 'emeland.io/owner-identities',
        value: 'infra-team',
      },
    ],
  },
  {
    capabilityId: 'c1a2b3c4-0001-4a3b-8c1d-000000000010',
    displayName: 'CI runner pool (Kubernetes)',
    description: 'Autoscaling pipeline runners on the shared cluster',
    annotations: [
      {
        key: 'emeland.io/owner-groups',
        value: 'platform-team',
      },
    ],
  },
] satisfies CapabilityWireWithDescription[]
