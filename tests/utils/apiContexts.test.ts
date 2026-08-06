import { describe, it, expect } from 'vitest'
import { resolveApiContextFlows } from '@/utils/apiContexts'
import type { Api } from '@/types/api'
import type { Component, ComponentInstance } from '@/types/component'
import type { SystemInstance } from '@/types/system'

function api(apiId: string): Api {
  return {
    apiId,
    displayName: apiId,
    version: { version: '' },
    type: 'OpenAPI',
    system: '',
    annotations: {},
  }
}

function comp(componentId: string, over: Partial<Component> = {}): Component {
  return {
    componentId,
    displayName: componentId,
    version: { version: '' },
    system: '',
    consumes: [],
    provides: [],
    annotations: {},
    ...over,
  }
}

function compInst(
  componentInstanceId: string,
  component: string,
  systemInstance: string,
): ComponentInstance {
  return {
    componentInstanceId,
    displayName: componentInstanceId,
    component,
    systemInstance,
    consumes: [],
    provides: [],
    annotations: {},
  }
}

function sysInst(systemInstanceId: string, context?: string): SystemInstance {
  return {
    systemInstanceId,
    displayName: systemInstanceId,
    system: 'sys',
    ...(context ? { context } : {}),
    annotations: {},
  }
}

describe('resolveApiContextFlows', () => {
  it('flags a consumer context the API is not provided in as crossing', () => {
    const flows = resolveApiContextFlows({
      apis: [api('a1')],
      components: [comp('p', { provides: ['a1'] }), comp('c', { consumes: ['a1'] })],
      componentInstances: [compInst('pi', 'p', 'si-prod'), compInst('ci', 'c', 'si-staging')],
      systemInstances: [sysInst('si-prod', 'prod'), sysInst('si-staging', 'staging')],
    })
    expect(flows.get('a1')).toEqual({
      providerContexts: ['prod'],
      consumerContexts: ['staging'],
      crossContexts: ['staging'],
      crosses: true,
    })
  })

  it('does not flag consumers inside the provider contexts', () => {
    const flows = resolveApiContextFlows({
      apis: [api('a1')],
      components: [comp('p', { provides: ['a1'] }), comp('c', { consumes: ['a1'] })],
      componentInstances: [
        compInst('pi1', 'p', 'si-prod'),
        compInst('pi2', 'p', 'si-staging'),
        compInst('ci', 'c', 'si-staging'),
      ],
      systemInstances: [sysInst('si-prod', 'prod'), sysInst('si-staging', 'staging')],
    })
    const flow = flows.get('a1')!
    expect(flow.providerContexts).toEqual(['prod', 'staging'])
    expect(flow.consumerContexts).toEqual(['staging'])
    expect(flow.crosses).toBe(false)
    expect(flow.crossContexts).toEqual([])
  })

  it('returns an empty flow for APIs without deployed instances', () => {
    const flows = resolveApiContextFlows({
      apis: [api('a1')],
      components: [comp('p', { provides: ['a1'] })],
      componentInstances: [],
      systemInstances: [],
    })
    expect(flows.get('a1')).toEqual({
      providerContexts: [],
      consumerContexts: [],
      crossContexts: [],
      crosses: false,
    })
  })

  it('ignores instances without a context and unrelated components', () => {
    const flows = resolveApiContextFlows({
      apis: [api('a1')],
      components: [comp('p', { provides: ['a1'] }), comp('x', { consumes: ['other'] })],
      componentInstances: [
        compInst('pi', 'p', 'si-none'), // system instance has no context
        compInst('xi', 'x', 'si-staging'),
      ],
      systemInstances: [sysInst('si-none'), sysInst('si-staging', 'staging')],
    })
    expect(flows.get('a1')).toEqual({
      providerContexts: [],
      consumerContexts: [],
      crossContexts: [],
      crosses: false,
    })
  })

  it('dedupes contexts across multiple instances and components', () => {
    const flows = resolveApiContextFlows({
      apis: [api('a1')],
      components: [
        comp('p1', { provides: ['a1'] }),
        comp('p2', { provides: ['a1'] }),
        comp('c', { consumes: ['a1'] }),
      ],
      componentInstances: [
        compInst('i1', 'p1', 'si-prod'),
        compInst('i2', 'p2', 'si-prod'),
        compInst('i3', 'c', 'si-prod'),
        compInst('i4', 'c', 'si-staging'),
      ],
      systemInstances: [sysInst('si-prod', 'prod'), sysInst('si-staging', 'staging')],
    })
    expect(flows.get('a1')).toEqual({
      providerContexts: ['prod'],
      consumerContexts: ['prod', 'staging'],
      crossContexts: ['staging'],
      crosses: true,
    })
  })
})
