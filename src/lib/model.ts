import type { GraphNode, ModelResource, ModelResourceType } from "./types";

export const RESOURCE_TYPES: ModelResourceType[] = [
  {
    id: "Context",
    displayName: "Context",
    description: "A logical container — a domain, team, or product area. Resources live inside contexts.",
  },
  {
    id: "ContextType",
    displayName: "ContextType",
    description: "Schema for a context (e.g. 'domain', 'product line').",
  },
  {
    id: "System",
    displayName: "System",
    description: "Top-level system definition. Has APIs and is materialised as SystemInstances.",
  },
  {
    id: "SystemInstance",
    displayName: "SystemInstance",
    description: "A deployed instance of a System inside a Context.",
  },
  {
    id: "API",
    displayName: "API",
    description: "API definition — produced by a System and consumed by Components.",
  },
  {
    id: "ApiInstance",
    displayName: "ApiInstance",
    description: "Concrete deployment of an API behind a SystemInstance.",
  },
  {
    id: "Component",
    displayName: "Component",
    description: "Independently-deployable workload that consumes APIs.",
  },
  {
    id: "Node",
    displayName: "Node",
    description: "A processing node in the modelsrv pipeline (sensor / filter / injector).",
  },
  {
    id: "NodeType",
    displayName: "NodeType",
    description: "Schema for a Node — drives wiring and subscriber semantics.",
  },
];

export const RESOURCES: ModelResource[] = [
  // ─── ContextTypes ──────────────────────────────────────────────────────────
  {
    id: "ct-domain",
    type: "ContextType",
    displayName: "Domain",
    description: "Business domain — owns one or more product lines.",
    attributes: { schemaVersion: "v1" },
    relations: [],
  },

  // ─── Contexts ─────────────────────────────────────────────────────────────
  {
    id: "ctx-payments",
    type: "Context",
    displayName: "Payments",
    description: "Payment processing domain.",
    attributes: { owner: "payments-platform" },
    relations: [
      { name: "type", targetType: "ContextType", targetId: "ct-domain" },
      { name: "systems", targetType: "System", targetId: "sys-checkout", cardinality: "many" },
      { name: "systems", targetType: "System", targetId: "sys-payments", cardinality: "many" },
    ],
  },
  {
    id: "ctx-identity",
    type: "Context",
    displayName: "Identity",
    description: "Identity, SSO, and access management.",
    attributes: { owner: "identity-platform" },
    relations: [
      { name: "type", targetType: "ContextType", targetId: "ct-domain" },
      { name: "systems", targetType: "System", targetId: "sys-identity", cardinality: "many" },
    ],
  },
  {
    id: "ctx-ml-platform",
    type: "Context",
    displayName: "ML Platform",
    description: "ML training and inference platform.",
    attributes: { owner: "ml-platform" },
    relations: [
      { name: "type", targetType: "ContextType", targetId: "ct-domain" },
      { name: "systems", targetType: "System", targetId: "sys-ml", cardinality: "many" },
    ],
  },

  // ─── Systems ───────────────────────────────────────────────────────────────
  {
    id: "sys-checkout",
    type: "System",
    displayName: "Checkout",
    description: "Customer-facing checkout system.",
    attributes: { repo: "github.com/example/checkout" },
    relations: [
      { name: "context", targetType: "Context", targetId: "ctx-payments" },
      { name: "exposes", targetType: "API", targetId: "api-checkout-v3", cardinality: "many" },
      { name: "instances", targetType: "SystemInstance", targetId: "si-checkout-eu", cardinality: "many" },
    ],
  },
  {
    id: "sys-payments",
    type: "System",
    displayName: "Payments core",
    description: "Core payment ledger and authorisation system.",
    attributes: { repo: "github.com/example/payments-core" },
    relations: [
      { name: "context", targetType: "Context", targetId: "ctx-payments" },
      { name: "exposes", targetType: "API", targetId: "api-payments-v3", cardinality: "many" },
      { name: "instances", targetType: "SystemInstance", targetId: "si-payments-eu", cardinality: "many" },
    ],
  },
  {
    id: "sys-identity",
    type: "System",
    displayName: "Identity",
    description: "SSO + SAML identity provider.",
    attributes: { repo: "github.com/example/identity" },
    relations: [
      { name: "context", targetType: "Context", targetId: "ctx-identity" },
      { name: "exposes", targetType: "API", targetId: "api-identity-saml", cardinality: "many" },
      { name: "instances", targetType: "SystemInstance", targetId: "si-identity-prod", cardinality: "many" },
    ],
  },
  {
    id: "sys-ml",
    type: "System",
    displayName: "ML training",
    description: "Distributed ML training system.",
    attributes: { repo: "github.com/example/ml-trainer" },
    relations: [
      { name: "context", targetType: "Context", targetId: "ctx-ml-platform" },
      { name: "components", targetType: "Component", targetId: "comp-ml-trainer", cardinality: "many" },
    ],
  },

  // ─── SystemInstances ───────────────────────────────────────────────────────
  {
    id: "si-checkout-eu",
    type: "SystemInstance",
    displayName: "checkout-eu",
    description: "EU production deployment of Checkout.",
    attributes: { region: "eu-west-1", cluster: "k8s-eu" },
    relations: [
      { name: "system", targetType: "System", targetId: "sys-checkout" },
      { name: "context", targetType: "Context", targetId: "ctx-payments" },
      { name: "apiInstances", targetType: "ApiInstance", targetId: "ai-checkout-eu", cardinality: "many" },
    ],
  },
  {
    id: "si-payments-eu",
    type: "SystemInstance",
    displayName: "payments-eu",
    description: "EU production deployment of Payments core.",
    attributes: { region: "eu-west-1", cluster: "k8s-eu" },
    relations: [
      { name: "system", targetType: "System", targetId: "sys-payments" },
      { name: "context", targetType: "Context", targetId: "ctx-payments" },
      { name: "apiInstances", targetType: "ApiInstance", targetId: "ai-payments-v3-eu", cardinality: "many" },
    ],
  },
  {
    id: "si-identity-prod",
    type: "SystemInstance",
    displayName: "identity-prod",
    description: "Prod deployment of Identity.",
    attributes: { region: "us-east-2", cluster: "k8s-us" },
    relations: [
      { name: "system", targetType: "System", targetId: "sys-identity" },
      { name: "context", targetType: "Context", targetId: "ctx-identity" },
      { name: "apiInstances", targetType: "ApiInstance", targetId: "ai-identity-saml-prod", cardinality: "many" },
    ],
  },

  // ─── APIs ─────────────────────────────────────────────────────────────────
  {
    id: "api-checkout-v3",
    type: "API",
    displayName: "checkout-v3",
    description: "Checkout REST API, version 3.",
    attributes: { protocol: "REST", version: "3" },
    relations: [
      { name: "exposedBy", targetType: "System", targetId: "sys-checkout" },
      { name: "instances", targetType: "ApiInstance", targetId: "ai-checkout-eu", cardinality: "many" },
    ],
  },
  {
    id: "api-payments-v3",
    type: "API",
    displayName: "payments-v3",
    description: "Payments REST API, version 3.",
    attributes: { protocol: "REST", version: "3" },
    relations: [
      { name: "exposedBy", targetType: "System", targetId: "sys-payments" },
      { name: "instances", targetType: "ApiInstance", targetId: "ai-payments-v3-eu", cardinality: "many" },
      { name: "consumedBy", targetType: "Component", targetId: "comp-checkout-worker", cardinality: "many" },
    ],
  },
  {
    id: "api-identity-saml",
    type: "API",
    displayName: "identity-saml",
    description: "SAML SSO API.",
    attributes: { protocol: "SAML", version: "2" },
    relations: [
      { name: "exposedBy", targetType: "System", targetId: "sys-identity" },
      { name: "instances", targetType: "ApiInstance", targetId: "ai-identity-saml-prod", cardinality: "many" },
    ],
  },

  // ─── ApiInstances ─────────────────────────────────────────────────────────
  {
    id: "ai-checkout-eu",
    type: "ApiInstance",
    displayName: "checkout-v3.eu-west",
    attributes: { url: "https://checkout-eu.example.com" },
    relations: [
      { name: "api", targetType: "API", targetId: "api-checkout-v3" },
      { name: "systemInstance", targetType: "SystemInstance", targetId: "si-checkout-eu" },
    ],
  },
  {
    id: "ai-payments-v3-eu",
    type: "ApiInstance",
    displayName: "payments-v3.eu-west",
    attributes: { url: "https://payments-eu.internal" },
    relations: [
      { name: "api", targetType: "API", targetId: "api-payments-v3" },
      { name: "systemInstance", targetType: "SystemInstance", targetId: "si-payments-eu" },
    ],
  },
  {
    id: "ai-identity-saml-prod",
    type: "ApiInstance",
    displayName: "identity-saml.prod",
    attributes: { url: "https://sso.example.com/saml" },
    relations: [
      { name: "api", targetType: "API", targetId: "api-identity-saml" },
      { name: "systemInstance", targetType: "SystemInstance", targetId: "si-identity-prod" },
    ],
  },

  // ─── Components ───────────────────────────────────────────────────────────
  {
    id: "comp-checkout-worker",
    type: "Component",
    displayName: "checkout-worker",
    description: "Background worker that processes checkout events.",
    attributes: { runtime: "node20" },
    relations: [
      { name: "context", targetType: "Context", targetId: "ctx-payments" },
      { name: "consumes", targetType: "API", targetId: "api-payments-v3", cardinality: "many" },
    ],
  },
  {
    id: "comp-ml-trainer",
    type: "Component",
    displayName: "ml-trainer",
    description: "Distributed training worker.",
    attributes: { runtime: "python3.12", gpu: "true" },
    relations: [
      { name: "context", targetType: "Context", targetId: "ctx-ml-platform" },
      { name: "system", targetType: "System", targetId: "sys-ml" },
    ],
  },

  // ─── NodeTypes ────────────────────────────────────────────────────────────
  {
    id: "nt-git-sensor",
    type: "NodeType",
    displayName: "git-sensor",
    description: "Watches a git repository and emits resource events on commits.",
    attributes: { phase: "ingest" },
    relations: [],
  },
  {
    id: "nt-k8s-sensor",
    type: "NodeType",
    displayName: "k8s-sensor",
    description: "Watches a Kubernetes cluster and emits resource events.",
    attributes: { phase: "ingest" },
    relations: [],
  },
  {
    id: "nt-file-sensor",
    type: "NodeType",
    displayName: "file-sensor",
    description: "Watches a local directory and emits resource events.",
    attributes: { phase: "ingest" },
    relations: [],
  },
  {
    id: "nt-structural-filter",
    type: "NodeType",
    displayName: "structural-filter",
    description: "Phase-0 filter — checks structural integrity of resources.",
    attributes: { phase: "filter-0" },
    relations: [],
  },
  {
    id: "nt-reference-filter",
    type: "NodeType",
    displayName: "reference-filter",
    description: "Phase-1 filter — checks cross-resource references.",
    attributes: { phase: "filter-1" },
    relations: [],
  },

  // ─── Nodes (sensors + filters; injector class reserved) ───────────────────
  {
    id: "node-git-main",
    type: "Node",
    displayName: "git-main",
    description: "Git sensor on prod watch dir.",
    attributes: { url: "git://emeland/prod/watchedDir" },
    relations: [
      { name: "type", targetType: "NodeType", targetId: "nt-git-sensor" },
      { name: "subscribers", targetType: "Node", targetId: "node-structural-0", cardinality: "many" },
    ],
  },
  {
    id: "node-k8s-eu",
    type: "Node",
    displayName: "k8s-eu",
    description: "Kubernetes sensor for eu-west-1.",
    attributes: { cluster: "eu-west-1" },
    relations: [
      { name: "type", targetType: "NodeType", targetId: "nt-k8s-sensor" },
      { name: "subscribers", targetType: "Node", targetId: "node-structural-0", cardinality: "many" },
    ],
  },
  {
    id: "node-k8s-us",
    type: "Node",
    displayName: "k8s-us",
    description: "Kubernetes sensor for us-east-2.",
    attributes: { cluster: "us-east-2" },
    relations: [
      { name: "type", targetType: "NodeType", targetId: "nt-k8s-sensor" },
      { name: "subscribers", targetType: "Node", targetId: "node-structural-0", cardinality: "many" },
    ],
  },
  {
    id: "node-file-local",
    type: "Node",
    displayName: "file-local",
    description: "File sensor on /var/emeland/manifests.",
    attributes: { path: "/var/emeland/manifests" },
    relations: [
      { name: "type", targetType: "NodeType", targetId: "nt-file-sensor" },
      { name: "subscribers", targetType: "Node", targetId: "node-structural-0", cardinality: "many" },
    ],
  },
  {
    id: "node-structural-0",
    type: "Node",
    displayName: "structural-0",
    description: "Structural-integrity filter, fans out into reference-1 for cross-resource checks.",
    attributes: { phase: "filter-0" },
    relations: [
      { name: "type", targetType: "NodeType", targetId: "nt-structural-filter" },
      { name: "subscribers", targetType: "Node", targetId: "node-reference-1", cardinality: "many" },
    ],
  },
  {
    id: "node-reference-1",
    type: "Node",
    displayName: "reference-1",
    description: "Reference-resolution filter — checks UUIDs against the model.",
    attributes: { phase: "filter-1" },
    relations: [
      { name: "type", targetType: "NodeType", targetId: "nt-reference-filter" },
    ],
  },
];

export const RESOURCE_INDEX: Map<string, ModelResource> = new Map(
  RESOURCES.map((r) => [r.id, r])
);

export const resourcesOfType = (type: string): ModelResource[] =>
  RESOURCES.filter((r) => r.type === type);

export const countByType = (): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const t of RESOURCE_TYPES) out[t.id] = 0;
  for (const r of RESOURCES) out[r.type] = (out[r.type] ?? 0) + 1;
  return out;
};

/** Pipeline graph derived from Node resources + their subscriber relations. */
export const GRAPH_NODES: GraphNode[] = RESOURCES.filter((r) => r.type === "Node").map((node) => {
  const typeRel = node.relations.find((rel) => rel.name === "type");
  const typeRes = typeRel ? RESOURCE_INDEX.get(typeRel.targetId) : undefined;
  const nodeType = typeRes?.displayName ?? "unknown";
  const kind: GraphNode["kind"] = nodeType.endsWith("-sensor")
    ? "sensor"
    : nodeType.endsWith("-filter")
      ? "filter"
      : "injector";
  return {
    id: node.id,
    kind,
    nodeType,
    displayName: node.displayName,
    subscribers: node.relations.filter((rel) => rel.name === "subscribers").map((rel) => rel.targetId),
  };
});
