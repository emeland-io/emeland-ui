import type { Context, Finding, FindingType, Sensor } from "./types";

export const FINDING_TYPES: Record<string, FindingType> = {
  ContextTypeMissing: {
    id: "fa538332-fb6d-51ef-99f3-87831ac140fb",
    displayName: "ContextTypeMissing",
    description:
      "A Context references a ContextType UUID not registered in the model, or has no ContextType assigned.",
    severity: "high",
  },
  ContextParentNotFound: {
    id: "daf948a3-f77d-582e-9bbe-72251e22373f",
    displayName: "ContextParentNotFound",
    description: "A Context references a parent Context UUID not registered in the model.",
    severity: "medium",
  },
  NodeTypeMissing: {
    id: "808c222c-3e02-5d38-9a82-4b16c792b075",
    displayName: "NodeTypeMissing",
    description: "A Node resource has no NodeType assigned.",
    severity: "medium",
  },
  SystemInstanceContextMissing: {
    id: "19a7ff20-2b1e-5b0c-9fe1-c0d2b0e2a113",
    displayName: "SystemInstanceContextMissing",
    description: "A SystemInstance references a Context UUID not yet created.",
    severity: "low",
  },
  ApiInstanceApiMissing: {
    id: "2e1b6c82-4d9f-58a1-a5c3-1d4f9e4a7bb0",
    displayName: "ApiInstanceApiMissing",
    description: "An ApiInstance references an API UUID that is not registered.",
    severity: "high",
  },
  ComponentConsumesUnknownApi: {
    id: "f3c2d1e0-9b87-5a64-b3e2-8c1f0a5d9e44",
    displayName: "ComponentConsumesUnknownApi",
    description: "A Component consumes an API UUID that is not registered in the landscape.",
    severity: "high",
  },
};

export const SENSORS: Record<string, Sensor> = {
  "git-main": {
    id: "git-main",
    kind: "git-sensor",
    label: "git://emeland/prod/watchedDir",
    lastSeen: "2026-04-19T10:42:11Z",
    status: "healthy",
  },
  "k8s-eu": {
    id: "k8s-eu",
    kind: "k8s-sensor",
    label: "cluster: eu-west-1",
    lastSeen: "2026-04-19T10:41:58Z",
    status: "healthy",
  },
  "k8s-us": {
    id: "k8s-us",
    kind: "k8s-sensor",
    label: "cluster: us-east-2",
    lastSeen: "2026-04-19T10:38:04Z",
    status: "degraded",
  },
  "file-local": {
    id: "file-local",
    kind: "file-sensor",
    label: "/var/emeland/manifests",
    lastSeen: "2026-04-19T10:39:22Z",
    status: "healthy",
  },
};

export const CONTEXTS: Record<string, Context> = {
  "ctx-payments": {
    id: "b1f3e1c2-1111-4aaa-9111-000000000001",
    displayName: "Payments",
    typeRef: "ct-domain",
  },
  "ctx-identity": {
    id: "b1f3e1c2-1111-4aaa-9111-000000000002",
    displayName: "Identity",
    typeRef: "ct-domain",
  },
  "ctx-ml-platform": {
    id: "b1f3e1c2-1111-4aaa-9111-000000000003",
    displayName: "ML Platform",
    typeRef: "ct-domain",
  },
  "ctx-retail": {
    id: "b1f3e1c2-1111-4aaa-9111-000000000004",
    displayName: "Retail Ops",
    typeRef: "ct-domain",
  },
};

export const FINDINGS: Finding[] = [
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56001",
    typeKind: "ContextTypeMissing",
    summary: 'Context "checkout-eu" has no ContextType set',
    description:
      "Resource ingested from watchedDir/ContextTypeMissing.yaml. The referenced type UUID 8d1f… is not registered in the model.",
    firstSeen: "2026-04-19T09:12:04Z",
    lastSeen: "2026-04-19T10:41:40Z",
    count: 14,
    resources: [
      {
        resourceId: "c9b72e1a-1111-4444-aaaa-000000000101",
        resourceType: "Context",
        displayName: "checkout-eu",
        reference: "/landscape/contexts/c9b72e1a-1111-4444-aaaa-000000000101",
      },
    ],
    annotations: [
      { key: "sensor", value: "git-main" },
      { key: "sourceFile", value: "watchedDir/ContextTypeMissing.yaml" },
      { key: "commit", value: "a83e2f1" },
    ],
    contextId: "ctx-payments",
    sensor: "git-main",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56002",
    typeKind: "ContextParentNotFound",
    summary: 'Context "fraud-scoring" parent UUID not registered',
    description:
      "Parent reference dangling; parent context likely not yet ingested from the identity sensor.",
    firstSeen: "2026-04-18T22:01:17Z",
    lastSeen: "2026-04-19T10:40:03Z",
    count: 3,
    resources: [
      {
        resourceId: "c9b72e1a-1111-4444-aaaa-000000000102",
        resourceType: "Context",
        displayName: "fraud-scoring",
      },
      {
        resourceId: "00000000-0000-0000-0000-000000000dea",
        resourceType: "Context",
        displayName: "(missing parent)",
      },
    ],
    annotations: [{ key: "sensor", value: "git-main" }],
    contextId: "ctx-payments",
    sensor: "git-main",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56003",
    typeKind: "NodeTypeMissing",
    summary: 'Node "ip-10-0-12-44.us-east-2" has no NodeType',
    firstSeen: "2026-04-19T10:22:11Z",
    lastSeen: "2026-04-19T10:38:04Z",
    count: 1,
    resources: [
      {
        resourceId: "a1b2c3d4-0000-4444-aaaa-000000000201",
        resourceType: "Node",
        displayName: "ip-10-0-12-44.us-east-2",
      },
    ],
    annotations: [
      { key: "sensor", value: "k8s-us" },
      { key: "cluster", value: "us-east-2" },
    ],
    contextId: "ctx-ml-platform",
    sensor: "k8s-us",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56004",
    typeKind: "ApiInstanceApiMissing",
    summary: 'ApiInstance "payments-v3.eu-west" references unknown API',
    description:
      "The ApiInstance was registered before the corresponding API resource. May self-resolve when the product team pushes the API manifest.",
    firstSeen: "2026-04-19T08:44:22Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 6,
    resources: [
      {
        resourceId: "f0e1d2c3-2222-4444-aaaa-000000000301",
        resourceType: "ApiInstance",
        displayName: "payments-v3.eu-west",
      },
      {
        resourceId: "00000000-0000-0000-0000-000000000a01",
        resourceType: "API",
        displayName: "(missing)",
      },
    ],
    annotations: [{ key: "sensor", value: "k8s-eu" }],
    contextId: "ctx-payments",
    sensor: "k8s-eu",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56005",
    typeKind: "ComponentConsumesUnknownApi",
    summary: 'Component "checkout-worker" consumes unknown API',
    firstSeen: "2026-04-19T07:11:44Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 9,
    resources: [
      {
        resourceId: "f0e1d2c3-2222-4444-aaaa-000000000401",
        resourceType: "Component",
        displayName: "checkout-worker",
      },
      {
        resourceId: "00000000-0000-0000-0000-000000000a02",
        resourceType: "API",
        displayName: "(missing)",
      },
    ],
    annotations: [
      { key: "sensor", value: "git-main" },
      { key: "consumes", value: "payments-api-v2" },
    ],
    contextId: "ctx-payments",
    sensor: "git-main",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56006",
    typeKind: "SystemInstanceContextMissing",
    summary: 'SystemInstance "orders-prod" has no Context set',
    firstSeen: "2026-04-19T06:30:00Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 2,
    resources: [
      {
        resourceId: "f0e1d2c3-2222-4444-aaaa-000000000501",
        resourceType: "SystemInstance",
        displayName: "orders-prod",
      },
    ],
    annotations: [{ key: "sensor", value: "k8s-eu" }],
    contextId: "ctx-retail",
    sensor: "k8s-eu",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56007",
    typeKind: "NodeTypeMissing",
    summary: 'Node "gpu-worker-07.eu-west-1" has no NodeType',
    firstSeen: "2026-04-19T05:14:30Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 1,
    resources: [
      {
        resourceId: "a1b2c3d4-0000-4444-aaaa-000000000202",
        resourceType: "Node",
        displayName: "gpu-worker-07.eu-west-1",
      },
    ],
    annotations: [
      { key: "sensor", value: "k8s-eu" },
      { key: "cluster", value: "eu-west-1" },
    ],
    contextId: "ctx-ml-platform",
    sensor: "k8s-eu",
    state: "acknowledged",
    ackedBy: "lutz",
    ackedAt: "2026-04-19T07:42:00Z",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56008",
    typeKind: "ContextTypeMissing",
    summary: 'Context "sso-prod" has no ContextType set',
    firstSeen: "2026-04-18T14:02:01Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 22,
    resources: [
      {
        resourceId: "c9b72e1a-1111-4444-aaaa-000000000103",
        resourceType: "Context",
        displayName: "sso-prod",
      },
    ],
    annotations: [{ key: "sensor", value: "file-local" }],
    contextId: "ctx-identity",
    sensor: "file-local",
    state: "snoozed",
    snoozedUntil: "2026-04-19T14:00:00Z",
    snoozedBy: "maya",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56009",
    typeKind: "ComponentConsumesUnknownApi",
    summary: 'Component "ml-trainer" consumes unknown API',
    firstSeen: "2026-04-17T11:22:00Z",
    lastSeen: "2026-04-19T04:10:58Z",
    count: 4,
    resources: [
      {
        resourceId: "f0e1d2c3-2222-4444-aaaa-000000000402",
        resourceType: "Component",
        displayName: "ml-trainer",
      },
      {
        resourceId: "00000000-0000-0000-0000-000000000a03",
        resourceType: "API",
        displayName: "(missing)",
      },
    ],
    annotations: [{ key: "sensor", value: "git-main" }],
    contextId: "ctx-ml-platform",
    sensor: "git-main",
    state: "resolved",
    resolvedAt: "2026-04-19T04:11:00Z",
    resolvedReason: "Auto-resolved: API resource was registered.",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56010",
    typeKind: "ContextParentNotFound",
    summary: 'Context "retail-reporting" parent UUID not registered',
    firstSeen: "2026-04-19T03:00:00Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 2,
    resources: [
      {
        resourceId: "c9b72e1a-1111-4444-aaaa-000000000104",
        resourceType: "Context",
        displayName: "retail-reporting",
      },
    ],
    annotations: [{ key: "sensor", value: "git-main" }],
    contextId: "ctx-retail",
    sensor: "git-main",
    state: "open",
  },
  {
    findingId: "7a3f2c1e-4b8d-5e9f-a0b1-c2d3e4f56011",
    typeKind: "ApiInstanceApiMissing",
    summary: 'ApiInstance "identity-saml.prod" references unknown API',
    firstSeen: "2026-04-18T18:00:00Z",
    lastSeen: "2026-04-19T10:41:58Z",
    count: 11,
    resources: [
      {
        resourceId: "f0e1d2c3-2222-4444-aaaa-000000000302",
        resourceType: "ApiInstance",
        displayName: "identity-saml.prod",
      },
    ],
    annotations: [{ key: "sensor", value: "file-local" }],
    contextId: "ctx-identity",
    sensor: "file-local",
    state: "open",
  },
];
