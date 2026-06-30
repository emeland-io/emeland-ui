import { apiFetch } from './fetch'
import { API } from '@/constants/api'
import type { Context, ContextType } from '@/types/context'

const USE_MOCKS = import.meta.env.VITE_EMEL_DEV_USE_MOCKS === 'true'

interface ContextResponse {
  contextId: string
  displayName: string
  description?: string
  type?: string
  parent?: string
  annotations?: { key: string; value: string }[] | Record<string, string>
}

interface InstanceListItem {
  instanceId: string
  displayName: string
  reference: string
}

function decodeAnnotations(
  raw: { key: string; value: string }[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!raw) return {}
  if (Array.isArray(raw)) return Object.fromEntries(raw.map((a) => [a.key, a.value]))
  return raw
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
    annotations: decodeAnnotations(res.annotations as { key: string; value: string }[] | undefined),
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
  const resp = await apiFetch(API.CONTEXTS.list)
  if (!resp.ok) throw new Error(`Failed to load contexts: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(contextFromList)
}

export async function fetchContextById(id: string): Promise<Context> {
  if (USE_MOCKS) {
    const { contexts } = await import('@/mocks/contexts')
    const found = contexts.find((c) => c.contextId === id)
    if (!found) throw new Error(`Context ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.CONTEXTS.byId(id))
  if (!resp.ok) throw new Error(`Failed to load context ${id}: ${resp.status}`)
  return decodeContext(await resp.json())
}

export async function fetchContextTypes(): Promise<ContextType[]> {
  if (USE_MOCKS) {
    const { contextTypes } = await import('@/mocks/contexts')
    return contextTypes
  }
  const resp = await apiFetch(API.CONTEXT_TYPES.list)
  if (!resp.ok) throw new Error(`Failed to load context types: ${resp.status}`)
  const data: InstanceListItem[] = await resp.json()
  return data.map(contextTypeFromList)
}

export async function fetchContextTypeById(id: string): Promise<ContextType> {
  if (USE_MOCKS) {
    const { contextTypes } = await import('@/mocks/contexts')
    const found = contextTypes.find((t) => t.contextTypeId === id)
    if (!found) throw new Error(`Context type ${id} not found in mocks`)
    return found
  }
  const resp = await apiFetch(API.CONTEXT_TYPES.byId(id))
  if (!resp.ok) throw new Error(`Failed to load context type ${id}: ${resp.status}`)
  return decodeContextType(await resp.json())
}
