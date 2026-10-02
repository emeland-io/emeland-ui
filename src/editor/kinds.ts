/**
 * Guided YAML editor resource-type catalog.
 *
 * Field shapes follow `emelandctl create` / modelsrv ingress documents
 * (`version` / `kind` / `spec`), not the GET wire types one-for-one.
 */
import type { ZodType } from 'zod'
import {
  zApiInstanceSpec,
  zApiSpec,
  zArtifactInstanceSpec,
  zArtifactSpec,
  zBindingSpec,
  zCapabilitySpec,
  zComponentInstanceSpec,
  zComponentSpec,
  zContextSpec,
  zContextTypeSpec,
  zFilterRuleSpec,
  zFindingSpec,
  zFindingTypeSpec,
  zGroupSpec,
  zIdentitySpec,
  zMergeRuleSpec,
  zMetricInstanceSpec,
  zMetricSpec,
  zNodeSpec,
  zNodeTypeSpec,
  zOrgUnitSpec,
  zParameterSpec,
  zPermissionResourceSpec,
  zPermissionSpecSpec,
  zProductSpec,
  zRoleResourceSpec,
  zRoleSpecSpec,
  zSystemInstanceSpec,
  zSystemSpec,
  zThresholdSpec,
} from './schemas'

export const DOCUMENT_VERSION = 'emeland.io/v1'

export type FieldType = 'string' | 'boolean' | 'enum' | 'uuid' | 'annotations' | 'stringList'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  description?: string
  enumValues?: readonly string[]
  /**
   * When set, this UUID field references another resource type.
   * Bundle documents of that type are offered as form suggestions.
   */
  refType?: string
}

/** Short validation rule shown under form fields. */
export function fieldValidationRule(field: FieldDef): string {
  switch (field.type) {
    case 'uuid':
      return field.required ? 'Required. Must be a valid UUID' : 'If set, must be a valid UUID'
    case 'string':
      return field.required ? 'Required. Non-empty text' : 'Optional free text'
    case 'enum':
      return field.enumValues?.length
        ? `Required. One of: ${field.enumValues.join(', ')}`
        : 'Required. Pick a value'
    case 'stringList':
      if (field.refType) {
        return field.required
          ? 'Required. Comma-separated UUIDs'
          : 'Optional. Comma-separated UUIDs'
      }
      return field.required
        ? 'Required. Comma-separated values'
        : 'Optional. Comma-separated values'
    case 'annotations':
      return 'Optional. Each key needs a non-empty value. Some keys require a specific format'
    case 'boolean':
      return field.required ? 'Required. True or false' : 'Optional. True or false'
    default:
      return field.required ? 'Required' : 'Optional'
  }
}

export interface ResourceTypeDef {
  resourceType: string
  label: string
  description: string
  idField: string
  fields: FieldDef[]
  schema: ZodType
  phase?: string
  formHint?: string
}

const PHASE_BY_KIND: Record<string, string> = {
  Node: 'L',
  NodeType: 'L',
  FilterRule: 'L',
  MergeRule: 'L',
  Context: 'P0',
  ContextType: 'P0',
  System: 'P1',
  SystemInstance: 'P1',
  Component: 'P1',
  ComponentInstance: 'P1',
  API: 'P1',
  ApiInstance: 'P1',
  OrgUnit: 'P2',
  Group: 'P2',
  Identity: 'P2',
  Binding: 'P2',
  RoleSpec: 'P2',
  PermissionSpec: 'P2',
  Role: 'P2',
  Permission: 'P2',
  Capability: 'P3',
  Parameter: 'P3',
  Finding: 'P5',
  FindingType: 'P5',
  Product: 'P5',
  Metric: 'P6',
  MetricInstance: 'P6',
  Threshold: 'P6',
  Artifact: 'P8',
  ArtifactInstance: 'P8',
}

const PHASE_TITLE: Record<string, string> = {
  L: 'Landscape',
  P0: 'Context',
  P1: 'Structure',
  P2: 'Identity',
  P3: 'Capabilities',
  P5: 'Risk',
  P6: 'Observability',
  P7: 'Capacity',
  P8: 'Artifacts',
}

/** Tooltip / search text for a phase chip, e.g. "P1 Structure". */
export function phaseLabel(phase: string): string {
  const title = PHASE_TITLE[phase]
  if (phase === 'L') return title ?? 'Landscape'
  return title ? `${phase} ${title}` : `Phase ${phase.replace(/^P/, '')}`
}

const commonId = (key: string, label: string): FieldDef => ({
  key,
  label,
  type: 'uuid',
  required: true,
  description: 'Pre-filled like emelandctl create (minted UUID). Edit if you need a specific id',
})

const displayName: FieldDef = {
  key: 'displayName',
  label: 'Display name',
  type: 'string',
  required: true,
}

const description: FieldDef = {
  key: 'description',
  label: 'Description',
  type: 'string',
}

const annotations: FieldDef = {
  key: 'annotations',
  label: 'Annotations',
  type: 'annotations',
  description: 'Key/value map written as a YAML mapping (ingress format)',
}

export const RESOURCE_TYPE_DEFS: ResourceTypeDef[] = [
  {
    resourceType: 'System',
    label: 'System',
    description: 'High-level landscape system',
    idField: 'systemId',
    schema: zSystemSpec,
    fields: [
      commonId('systemId', 'System ID'),
      displayName,
      description,
      {
        key: 'abstract',
        label: 'Abstract',
        type: 'boolean',
        required: true,
        description: 'Whether this is an abstract system definition',
      },
      {
        key: 'parent',
        label: 'Parent system',
        type: 'uuid',
        description: 'Leave empty for a root system',
        refType: 'System',
      },
      annotations,
    ],
    formHint: 'Optional version lifecycle (spec.version) can be added in YAML mode.',
  },
  {
    resourceType: 'Context',
    label: 'Context',
    description: 'Grouping context (env, region, …)',
    idField: 'contextId',
    schema: zContextSpec,
    fields: [
      commonId('contextId', 'Context ID'),
      displayName,
      description,
      {
        key: 'type',
        label: 'Context type',
        type: 'uuid',
        required: true,
        description: 'ContextType UUID',
        refType: 'ContextType',
      },
      { key: 'parent', label: 'Parent context', type: 'uuid', refType: 'Context' },
      annotations,
    ],
  },
  {
    resourceType: 'ContextType',
    label: 'Context type',
    description: 'Vocabulary for context categorization',
    idField: 'contextTypeId',
    schema: zContextTypeSpec,
    fields: [commonId('contextTypeId', 'Context type ID'), displayName, description, annotations],
  },
  {
    resourceType: 'Node',
    label: 'Node',
    description: 'Landscape execution node',
    idField: 'nodeId',
    schema: zNodeSpec,
    fields: [
      commonId('nodeId', 'Node ID'),
      displayName,
      description,
      {
        key: 'nodeType',
        label: 'Node type',
        type: 'uuid',
        required: true,
        description: 'NodeType UUID',
        refType: 'NodeType',
      },
      annotations,
    ],
  },
  {
    resourceType: 'NodeType',
    label: 'Node type',
    description: 'Vocabulary for node kinds',
    idField: 'nodeTypeId',
    schema: zNodeTypeSpec,
    fields: [commonId('nodeTypeId', 'Node type ID'), displayName, description, annotations],
  },
  {
    resourceType: 'Component',
    label: 'Component',
    description: 'Software component belonging to a system',
    idField: 'componentId',
    schema: zComponentSpec,
    fields: [
      commonId('componentId', 'Component ID'),
      displayName,
      description,
      {
        key: 'system',
        label: 'System',
        type: 'uuid',
        required: true,
        description: 'Owning system UUID',
        refType: 'System',
      },
      {
        key: 'consumes',
        label: 'Consumes',
        type: 'stringList',
        description: 'API UUIDs this component consumes',
        refType: 'API',
      },
      {
        key: 'provides',
        label: 'Provides',
        type: 'stringList',
        description: 'API UUIDs this component provides',
        refType: 'API',
      },
      annotations,
    ],
    formHint: 'Optional version lifecycle (spec.version) can be added in YAML mode.',
  },
  {
    resourceType: 'API',
    label: 'API',
    description: 'API offered by a system',
    idField: 'apiId',
    schema: zApiSpec,
    fields: [
      commonId('apiId', 'API ID'),
      displayName,
      description,
      {
        key: 'type',
        label: 'API type',
        type: 'enum',
        required: true,
        enumValues: ['Unknown', 'OpenAPI', 'GraphQL', 'gRPC', 'Other'],
      },
      {
        key: 'system',
        label: 'System',
        type: 'uuid',
        description: 'Owning system UUID',
        refType: 'System',
      },
      annotations,
    ],
    formHint: 'Optional version lifecycle (spec.version) can be added in YAML mode.',
  },
  {
    resourceType: 'Capability',
    label: 'Capability',
    description: 'Technical building block with versioned lifecycle',
    idField: 'capabilityId',
    schema: zCapabilitySpec,
    fields: [commonId('capabilityId', 'Capability ID'), displayName, annotations],
    formHint:
      'Capability versions, variants, and dependencies are structured. Switch to YAML to edit them.',
  },
  {
    resourceType: 'Parameter',
    label: 'Parameter',
    description: 'Discrete parameter vocabulary',
    idField: 'parameterId',
    schema: zParameterSpec,
    fields: [
      commonId('parameterId', 'Parameter ID'),
      displayName,
      {
        key: 'values',
        label: 'Values',
        type: 'stringList',
        description: 'Allowed discrete values',
      },
      annotations,
    ],
  },
  {
    resourceType: 'SystemInstance',
    label: 'System instance',
    description: 'Concrete system deployment in a context',
    idField: 'instanceId',
    schema: zSystemInstanceSpec,
    fields: [
      commonId('instanceId', 'Instance ID'),
      displayName,
      { key: 'system', label: 'System', type: 'uuid', required: true, refType: 'System' },
      { key: 'context', label: 'Context', type: 'uuid', refType: 'Context' },
      annotations,
    ],
  },
  {
    resourceType: 'Metric',
    label: 'Metric',
    description: 'Abstract measurement vocabulary',
    idField: 'metricId',
    schema: zMetricSpec,
    fields: [commonId('metricId', 'Metric ID'), displayName, description, annotations],
  },
  {
    resourceType: 'MetricInstance',
    label: 'Metric instance',
    description: 'Metric bound to a subject',
    idField: 'metricInstanceId',
    schema: zMetricInstanceSpec,
    fields: [
      commonId('metricInstanceId', 'Metric instance ID'),
      displayName,
      description,
      {
        key: 'metricRef',
        label: 'Metric',
        type: 'uuid',
        required: true,
        description: 'Metric UUID (stored as metricRef.metricId)',
        refType: 'Metric',
      },
      annotations,
    ],
    formHint:
      'Optional subject ({ resourceId, resourceType }) can be added in YAML under spec.subject.',
  },
  {
    resourceType: 'Threshold',
    label: 'Threshold',
    description: 'Condition attached to a metric instance',
    idField: 'thresholdId',
    schema: zThresholdSpec,
    fields: [
      commonId('thresholdId', 'Threshold ID'),
      displayName,
      description,
      {
        key: 'metricInstanceRef',
        label: 'Metric instance',
        type: 'uuid',
        required: true,
        description: 'MetricInstance UUID (stored as metricInstanceRef.metricInstanceId)',
        refType: 'MetricInstance',
      },
      annotations,
    ],
    formHint:
      'Threshold expressions live in annotations (emeland.io/threshold.expression). The form maps metric instance to metricInstanceRef.',
  },
  {
    resourceType: 'Finding',
    label: 'Finding',
    description: 'Rule violation or compliance finding',
    idField: 'findingId',
    schema: zFindingSpec,
    fields: [commonId('findingId', 'Finding ID'), displayName, description, annotations],
    formHint:
      'Finding type and resource refs are not exposed by emelandctl create. Add them in YAML if needed.',
  },
  {
    resourceType: 'FindingType',
    label: 'Finding type',
    description: 'Vocabulary for finding classification',
    idField: 'findingTypeId',
    schema: zFindingTypeSpec,
    fields: [commonId('findingTypeId', 'Finding type ID'), displayName, description, annotations],
  },
  {
    resourceType: 'ComponentInstance',
    label: 'Component instance',
    description: 'Component deployed in a system instance',
    idField: 'instanceId',
    schema: zComponentInstanceSpec,
    fields: [
      commonId('instanceId', 'Instance ID'),
      displayName,
      {
        key: 'component',
        label: 'Component',
        type: 'uuid',
        required: true,
        description: 'Component UUID',
        refType: 'Component',
      },
      {
        key: 'systemInstance',
        label: 'System instance',
        type: 'uuid',
        description: 'SystemInstance UUID',
        refType: 'SystemInstance',
      },
      annotations,
    ],
  },
  {
    resourceType: 'ApiInstance',
    label: 'API instance',
    description: 'API deployed in a system instance',
    idField: 'instanceId',
    schema: zApiInstanceSpec,
    fields: [
      commonId('instanceId', 'Instance ID'),
      displayName,
      { key: 'api', label: 'API', type: 'uuid', description: 'API UUID', refType: 'API' },
      {
        key: 'systemInstance',
        label: 'System instance',
        type: 'uuid',
        description: 'SystemInstance UUID',
        refType: 'SystemInstance',
      },
      annotations,
    ],
  },
  {
    resourceType: 'Product',
    label: 'Product',
    description: 'Procured product with optional vendor',
    idField: 'productId',
    schema: zProductSpec,
    fields: [
      commonId('productId', 'Product ID'),
      displayName,
      description,
      {
        key: 'vendor',
        label: 'Vendor',
        type: 'uuid',
        description: 'Vendor OrgUnit UUID',
        refType: 'OrgUnit',
      },
      annotations,
    ],
  },
  {
    resourceType: 'Artifact',
    label: 'Artifact',
    description: 'Binary artefact tracked in the landscape',
    idField: 'artifactId',
    schema: zArtifactSpec,
    fields: [commonId('artifactId', 'Artifact ID'), displayName, description, annotations],
    formHint: 'Optional hash (algorithm:hex) can be added in YAML under spec.hash.',
  },
  {
    resourceType: 'ArtifactInstance',
    label: 'Artifact instance',
    description: 'Concrete copy/location of an artifact',
    idField: 'artifactInstanceId',
    schema: zArtifactInstanceSpec,
    fields: [
      commonId('artifactInstanceId', 'Artifact instance ID'),
      displayName,
      description,
      {
        key: 'artifact',
        label: 'Artifact',
        type: 'uuid',
        description: 'Artifact UUID',
        refType: 'Artifact',
      },
      annotations,
    ],
  },
  {
    resourceType: 'OrgUnit',
    label: 'Org unit',
    description: 'Organizational unit',
    idField: 'orgUnitId',
    schema: zOrgUnitSpec,
    fields: [
      commonId('orgUnitId', 'Org unit ID'),
      displayName,
      description,
      {
        key: 'parent',
        label: 'Parent org unit',
        type: 'uuid',
        description: 'Parent OrgUnit UUID',
        refType: 'OrgUnit',
      },
      annotations,
    ],
  },
  {
    resourceType: 'Group',
    label: 'Group',
    description: 'Group of identities',
    idField: 'groupId',
    schema: zGroupSpec,
    fields: [commonId('groupId', 'Group ID'), displayName, description, annotations],
  },
  {
    resourceType: 'Identity',
    label: 'Identity',
    description: 'Person, service account, or other identity',
    idField: 'identityId',
    schema: zIdentitySpec,
    fields: [commonId('identityId', 'Identity ID'), displayName, description, annotations],
  },
  {
    resourceType: 'PermissionSpec',
    label: 'Permission spec',
    description: 'Organizational permission definition',
    idField: 'permissionSpecId',
    schema: zPermissionSpecSpec,
    fields: [
      commonId('permissionSpecId', 'Permission spec ID'),
      displayName,
      description,
      annotations,
    ],
  },
  {
    resourceType: 'RoleSpec',
    label: 'Role spec',
    description: 'Organizational role definition',
    idField: 'roleSpecId',
    schema: zRoleSpecSpec,
    fields: [commonId('roleSpecId', 'Role spec ID'), displayName, description, annotations],
  },
  {
    resourceType: 'Permission',
    label: 'Permission',
    description: 'Realized permission instance',
    idField: 'permissionId',
    schema: zPermissionResourceSpec,
    fields: [commonId('permissionId', 'Permission ID'), displayName, description, annotations],
    formHint: 'Permission spec UUID (spec) can be added in YAML if needed.',
  },
  {
    resourceType: 'Role',
    label: 'Role',
    description: 'Realized role instance',
    idField: 'roleId',
    schema: zRoleResourceSpec,
    fields: [commonId('roleId', 'Role ID'), displayName, description, annotations],
    formHint: 'Role spec, permissions, resources, and context can be added in YAML if needed.',
  },
  {
    resourceType: 'Binding',
    label: 'Binding',
    description: 'Binds a subject to a role',
    idField: 'bindingId',
    schema: zBindingSpec,
    fields: [commonId('bindingId', 'Binding ID'), displayName, description, annotations],
    formHint: 'Role and subject refs can be added in YAML if needed.',
  },
  {
    resourceType: 'FilterRule',
    label: 'Filter rule',
    description: 'Event filter chain rule',
    idField: 'ruleId',
    schema: zFilterRuleSpec,
    fields: [commonId('ruleId', 'Rule ID'), displayName, description, annotations],
  },
  {
    resourceType: 'MergeRule',
    label: 'Merge rule',
    description: 'Event merge rule',
    idField: 'ruleId',
    schema: zMergeRuleSpec,
    fields: [commonId('ruleId', 'Rule ID'), displayName, description, annotations],
  },
]
  .map((def) => ({
    ...def,
    phase: PHASE_BY_KIND[def.resourceType],
  }))
  .sort((a, b) => a.resourceType.localeCompare(b.resourceType)) as ResourceTypeDef[]

export const RESOURCE_TYPE_BY_NAME = Object.fromEntries(
  RESOURCE_TYPE_DEFS.map((k) => [k.resourceType, k]),
) as Record<string, ResourceTypeDef>

export function newId(): string {
  return crypto.randomUUID()
}

export function blankDocument(resourceType: string): {
  version: string
  kind: string
  spec: Record<string, unknown>
} {
  const def = RESOURCE_TYPE_BY_NAME[resourceType] ?? RESOURCE_TYPE_DEFS[0]!
  const spec: Record<string, unknown> = {}

  for (const field of def.fields) {
    if (field.type === 'uuid' && field.key === def.idField) {
      spec[field.key] = newId()
    } else if (field.key === 'displayName') {
      spec.displayName = `New ${def.label}`
    } else if (field.type === 'boolean' && field.required) {
      spec[field.key] = false
    } else if (field.type === 'enum' && field.required && field.enumValues?.length) {
      spec[field.key] = field.enumValues[0]
    } else if (field.type === 'annotations') {
      spec.annotations = {}
    } else if (field.type === 'stringList') {
      // omit empty lists
    }
  }

  return { version: DOCUMENT_VERSION, kind: def.resourceType, spec }
}
