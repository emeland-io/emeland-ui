import type { Annotations, UUID, Version } from './common'

export interface ValidValue {
  /** the parameter this binds (ParameterRef) */
  parameter: UUID
  /** the offered/required subset of the parameter's valid values */
  values: string[]
}

export interface Variant {
  /** the input parameter values this variant offers */
  inputParameters?: ValidValue[]
  /** capabilities this variant depends on */
  dependencies?: VariantDependency[]
}

export interface VariantDependency {
  /** the required capability (CapabilityRef) */
  capability: UUID
  /** the output parameter values the dependency must offer */
  outputParameters?: ValidValue[]
}

/** Reference to a capability version, with its lifecycle window and variants */
export interface CapabilityVersionRef {
  capabilityVersionId: UUID
  version?: Version
  variants?: Variant[]
}

export interface Capability {
  capabilityId: UUID
  displayName: string
  /** diagram field, not yet in the modelsrv spec (passed through validation) */
  description?: string
  versions?: CapabilityVersionRef[]
  annotations: Annotations
}
