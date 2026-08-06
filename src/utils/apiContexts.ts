import type { Api } from '@/types/api'
import type { Component, ComponentInstance } from '@/types/component'
import type { SystemInstance } from '@/types/system'

/**
 * Context flows of an API, derived from the deployed instances.
 *
 * Contexts are a deployment property (Phase 0), so an API's location is
 * resolved through: API -> providing/consuming components -> their component
 * instances -> system instances -> context.
 *
 * An API "crosses a context boundary" when at least one consumer context is
 * not part of the provider contexts — i.e. traffic flows across a trust
 * boundary (e.g. staging calls a production API). This is the basis for
 * threat-modelling and compliance use cases described in the EmELand book
 * ("Generate the Communication Intersection").
 */
export interface ApiContextFlow {
  /** context ids where the API is provided, sorted */
  providerContexts: string[]
  /** context ids where the API is consumed, sorted */
  consumerContexts: string[]
  /** consumer contexts the API is not provided in (the boundary crossings) */
  crossContexts: string[]
  crosses: boolean
}

export interface ApiContextFlowInput {
  apis: Api[]
  components: Component[]
  componentInstances: ComponentInstance[]
  systemInstances: SystemInstance[]
}

export function resolveApiContextFlows({
  apis,
  components,
  componentInstances,
  systemInstances,
}: ApiContextFlowInput): Map<string, ApiContextFlow> {
  const contextBySystemInstance = new Map(
    systemInstances.map((si) => [si.systemInstanceId, si.context]),
  )

  // contexts per component, via its instances
  const contextsByComponent = new Map<string, Set<string>>()
  for (const ci of componentInstances) {
    const context = contextBySystemInstance.get(ci.systemInstance)
    if (!context) continue
    const set = contextsByComponent.get(ci.component) ?? new Set<string>()
    set.add(context)
    contextsByComponent.set(ci.component, set)
  }

  const flows = new Map<string, ApiContextFlow>()
  for (const api of apis) {
    const providerContexts = new Set<string>()
    const consumerContexts = new Set<string>()
    for (const c of components) {
      if (c.provides.includes(api.apiId)) {
        for (const ctx of contextsByComponent.get(c.componentId) ?? []) providerContexts.add(ctx)
      }
      if (c.consumes.includes(api.apiId)) {
        for (const ctx of contextsByComponent.get(c.componentId) ?? []) consumerContexts.add(ctx)
      }
    }
    const crossContexts = [...consumerContexts]
      .filter((ctx) => !providerContexts.has(ctx))
      .sort((a, b) => a.localeCompare(b))
    flows.set(api.apiId, {
      providerContexts: [...providerContexts].sort((a, b) => a.localeCompare(b)),
      consumerContexts: [...consumerContexts].sort((a, b) => a.localeCompare(b)),
      crossContexts,
      crosses: crossContexts.length > 0,
    })
  }
  return flows
}
