import { API } from '@/constants/api'
import type { Context, ContextType } from '@/types/context'
import { decodeAnnotations, type AnnotationsResponse } from './decode'
import { decodeTypeEntity, makeResourceApi, responseId } from './resource'

interface ContextResponse {
  contextId?: string
  instanceId?: string
  displayName?: string
  description?: string
  type?: string
  parent?: string
  annotations?: AnnotationsResponse
}

function decodeContext(res: ContextResponse): Context {
  return {
    contextId: responseId(res, 'contextId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    contextTypeId: res.type,
    parentId: res.parent,
    annotations: decodeAnnotations(res.annotations),
  }
}

const contexts = makeResourceApi<Context, ContextResponse>({
  name: 'Context',
  namePlural: 'contexts',
  listPath: API.CONTEXTS.list,
  byIdPath: API.CONTEXTS.byId,
  mocks: async () => (await import('@/mocks/contexts')).contexts,
  idOf: (c) => c.contextId,
  decode: decodeContext,
})

export const fetchContexts = contexts.fetchAll
export const fetchContextById = contexts.fetchById

const contextTypes = makeResourceApi<ContextType, Record<string, unknown>>({
  name: 'Context type',
  namePlural: 'context types',
  listPath: API.CONTEXT_TYPES.list,
  byIdPath: API.CONTEXT_TYPES.byId,
  mocks: async () => (await import('@/mocks/contexts')).contextTypes,
  idOf: (t) => t.contextTypeId,
  decode: (res) => decodeTypeEntity('contextTypeId', res),
})

export const fetchContextTypes = contextTypes.fetchAll
export const fetchContextTypeById = contextTypes.fetchById
