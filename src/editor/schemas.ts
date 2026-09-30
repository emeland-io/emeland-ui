/**
 * Ingress-oriented Zod schemas for YAML documents modelsrv / emelandctl use
 * Annotations are a string map (YAML mapping), not the OpenAPI key/value array
 */
import { z } from 'zod'

export const zAnnotationMap = z.record(
  z.string().min(1, 'annotation key is required'),
  z.string().min(1, 'annotation value is required'),
)

export const zVersionSpec = z.object({
  version: z.string(),
  availableFrom: z.string().optional(),
  deprecatedFrom: z.string().optional(),
  terminatedFrom: z.string().optional(),
  retiredFrom: z.string().optional(),
})

export const zSystemSpec = z.object({
  systemId: z.string().min(1).optional(),
  displayName: z.string().min(1),
  description: z.string().optional(),
  version: zVersionSpec.optional(),
  abstract: z.boolean(),
  parent: z.string().min(1).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zContextSpec = z.object({
  contextId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  parent: z.string().min(1).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zContextTypeSpec = z.object({
  contextTypeId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zNodeSpec = z.object({
  nodeId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  nodeType: z.string().min(1),
  annotations: zAnnotationMap.optional(),
})

export const zNodeTypeSpec = z.object({
  nodeTypeId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zComponentSpec = z.object({
  componentId: z.string().min(1).optional(),
  displayName: z.string().min(1),
  description: z.string().optional(),
  version: zVersionSpec.optional(),
  system: z.string().min(1),
  consumes: z.array(z.string().min(1)).optional(),
  provides: z.array(z.string().min(1)).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zApiSpec = z.object({
  apiId: z.string().min(1).optional(),
  displayName: z.string().min(1),
  description: z.string().optional(),
  version: zVersionSpec.optional(),
  type: z.enum(['Unknown', 'OpenAPI', 'GraphQL', 'gRPC', 'Other']),
  system: z.string().min(1).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zCapabilityVersionSpec = z.object({
  capabilityVersionId: z.string().min(1),
  version: zVersionSpec.optional(),
  dependencies: z.array(z.unknown()).optional(),
  variants: z.array(z.unknown()).optional(),
})

export const zCapabilitySpec = z.object({
  capabilityId: z.string().min(1),
  displayName: z.string().min(1),
  versions: z.array(zCapabilityVersionSpec).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zParameterSpec = z.object({
  parameterId: z.string().min(1),
  displayName: z.string().min(1),
  values: z.array(z.string()).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zSystemInstanceSpec = z.object({
  instanceId: z.string().min(1),
  displayName: z.string().min(1),
  system: z.string().min(1),
  context: z.string().min(1).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zMetricSpec = z.object({
  metricId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zMetricInstanceSpec = z.object({
  metricInstanceId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  metric: z.string().min(1),
  subject: z.unknown().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zThresholdSpec = z.object({
  thresholdId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  metricInstanceRef: z.object({
    metricInstanceId: z.string().min(1),
  }),
  annotations: zAnnotationMap.optional(),
})
