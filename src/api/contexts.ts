import { API } from '@/constants/api'
import type { Context, ContextType } from '@/types/context'
import { USE_MOCKS, getJson } from './fetch'
import { decodeAnnotations, type InstanceListItem, type AnnotationsResponse } from './decode'

interface ContextResponse {
  contextId: string
  displayName: string
  description?: string
  type?: string
  parent?: string
  annotations?: AnnotationsResponse
}

function decodeContext(res: ContextResponse): Context {
  return {
    contextId: res.contextId,
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    contextTypeId: res.type,
    parentId: res.parent,
    annotations: decodeAnnotations(res.annotations),
  }
}

function contextFromList(item: InstanceListItem): Context {
  return {
    contextId: item.instanceId,
    displayName: item.displayName,
    annotations: {},
  }
}

function decodeContextType(res: Record<string, unknown>): ContextType {
  return {
    contextTypeId: (res.contextTypeId as string) ?? (res.instanceId as string) ?? '',
    displayName: (res.displayName as string) ?? '',
    description: (res.description as string) ?? '',
    annotations: decodeAnnotations(res.annotations as AnnotationsResponse | undefined),
  }
}

function contextTypeFromList(item: InstanceListItem): ContextType {
  return {
    contextTypeId: item.instanceId,
    displayName: item.displayName,
    annotations: {},
  }
}

export async function fetchContexts(): Promise<Context[]> {
  if (USE_MOCKS) {
    const { contexts } = await import('@/mocks/contexts')
    return contexts
  }
  const data = await getJson<InstanceListItem[]>(API.CONTEXTS.list, 'contexts')
  return data.map(contextFromList)
}

export async function fetchContextById(id: string): Promise<Context> {
  if (USE_MOCKS) {
    const { contexts } = await import('@/mocks/contexts')
    const found = contexts.find((c) => c.contextId === id)
    if (!found) throw new Error(`Context ${id} not found in mocks`)
    return found
  }
  return decodeContext(await getJson<ContextResponse>(API.CONTEXTS.byId(id), `context ${id}`))
}

export async function fetchContextTypes(): Promise<ContextType[]> {
  if (USE_MOCKS) {
    const { contextTypes } = await import('@/mocks/contexts')
    return contextTypes
  }
  const data = await getJson<InstanceListItem[]>(API.CONTEXT_TYPES.list, 'context types')
  return data.map(contextTypeFromList)
}

export async function fetchContextTypeById(id: string): Promise<ContextType> {
  if (USE_MOCKS) {
    const { contextTypes } = await import('@/mocks/contexts')
    const found = contextTypes.find((t) => t.contextTypeId === id)
    if (!found) throw new Error(`Context type ${id} not found in mocks`)
    return found
  }
  return decodeContextType(
    await getJson<Record<string, unknown>>(API.CONTEXT_TYPES.byId(id), `context type ${id}`),
  )
}
