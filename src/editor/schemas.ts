/**
 * Ingress-oriented Zod schemas for YAML documents modelsrv / emelandctl use
 * Annotations are a string map (YAML mapping), not the OpenAPI key/value array
 */
import { z } from 'zod'
import { annotationFormatIssue } from '@/utils/annotations'

export const zAnnotationMap = z
  .record(
    z.string().min(1, 'annotation key is required'),
    z.string().min(1, 'annotation value is required'),
  )
  .superRefine((map, ctx) => {
    for (const [key, value] of Object.entries(map)) {
      const msg = annotationFormatIssue(key, value)
      if (!msg) continue
      ctx.addIssue({ code: 'custom', message: msg, path: [key] })
    }
  })

export const zVersionSpec = z.object({
  version: z.string().min(1, 'version string is required'),
  availableFrom: z.string().optional(),
  deprecatedFrom: z.string().optional(),
  terminatedFrom: z.string().optional(),
  retiredFrom: z.string().optional(),
})

const zUuid = z.string().uuid('Must be a valid UUID')
const zRequiredText = z.string().min(1, 'Required')

export const zSystemSpec = z.object({
  systemId: zUuid.optional(),
  displayName: zRequiredText,
  description: z.string().optional(),
  version: zVersionSpec.optional(),
  abstract: z.boolean(),
  parent: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zContextSpec = z.object({
  contextId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  type: zUuid,
  parent: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zContextTypeSpec = z.object({
  contextTypeId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zNodeSpec = z.object({
  nodeId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  nodeType: zUuid,
  annotations: zAnnotationMap.optional(),
})

export const zNodeTypeSpec = z.object({
  nodeTypeId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zComponentSpec = z.object({
  componentId: zUuid.optional(),
  displayName: zRequiredText,
  description: z.string().optional(),
  version: zVersionSpec.optional(),
  system: zUuid,
  consumes: z.array(zUuid).optional(),
  provides: z.array(zUuid).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zApiSpec = z.object({
  apiId: zUuid.optional(),
  displayName: zRequiredText,
  description: z.string().optional(),
  version: zVersionSpec.optional(),
  type: z.enum(['Unknown', 'OpenAPI', 'GraphQL', 'gRPC', 'Other'], {
    error: 'Must be Unknown, OpenAPI, GraphQL, gRPC, or Other',
  }),
  system: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zCapabilityVersionSpec = z.object({
  capabilityVersionId: zUuid,
  version: zVersionSpec.optional(),
  dependencies: z.array(z.unknown()).optional(),
  variants: z.array(z.unknown()).optional(),
})

export const zCapabilitySpec = z.object({
  capabilityId: zUuid,
  displayName: zRequiredText,
  versions: z.array(zCapabilityVersionSpec).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zParameterSpec = z.object({
  parameterId: zUuid,
  displayName: zRequiredText,
  values: z.array(z.string()).optional(),
  annotations: zAnnotationMap.optional(),
})

export const zSystemInstanceSpec = z.object({
  instanceId: zUuid,
  displayName: zRequiredText,
  system: zUuid,
  context: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zMetricSpec = z.object({
  metricId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  annotations: zAnnotationMap.optional(),
})

export const zMetricInstanceSpec = z.object({
  metricInstanceId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  metricRef: z.object({
    metricId: zUuid,
  }),
  subject: z
    .object({
      resourceId: zUuid,
      resourceType: zRequiredText,
    })
    .optional(),
  annotations: zAnnotationMap.optional(),
})

export const zThresholdSpec = z.object({
  thresholdId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  metricInstanceRef: z.object({
    metricInstanceId: zUuid,
  }),
  annotations: zAnnotationMap.optional(),
})

function zDescOnlyResource(idKey: string) {
  return z.object({
    [idKey]: zUuid,
    displayName: zRequiredText,
    description: z.string().optional(),
    annotations: zAnnotationMap.optional(),
  })
}

export const zFindingSpec = zDescOnlyResource('findingId')
export const zFindingTypeSpec = zDescOnlyResource('findingTypeId')
export const zGroupSpec = zDescOnlyResource('groupId')
export const zIdentitySpec = zDescOnlyResource('identityId')
export const zPermissionSpecSpec = zDescOnlyResource('permissionSpecId')
export const zRoleSpecSpec = zDescOnlyResource('roleSpecId')
export const zPermissionResourceSpec = zDescOnlyResource('permissionId')
export const zRoleResourceSpec = zDescOnlyResource('roleId')
export const zBindingSpec = zDescOnlyResource('bindingId')
export const zFilterRuleSpec = zDescOnlyResource('ruleId')
export const zMergeRuleSpec = zDescOnlyResource('ruleId')
export const zArtifactSpec = zDescOnlyResource('artifactId')

export const zComponentInstanceSpec = z.object({
  instanceId: zUuid,
  displayName: zRequiredText,
  component: zUuid,
  systemInstance: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zApiInstanceSpec = z.object({
  instanceId: zUuid,
  displayName: zRequiredText,
  api: zUuid.optional(),
  systemInstance: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zProductSpec = z.object({
  productId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  vendor: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zArtifactInstanceSpec = z.object({
  artifactInstanceId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  artifact: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})

export const zOrgUnitSpec = z.object({
  orgUnitId: zUuid,
  displayName: zRequiredText,
  description: z.string().optional(),
  parent: zUuid.optional(),
  annotations: zAnnotationMap.optional(),
})
