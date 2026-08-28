import { API } from '@/constants/api'
import type { Context, ContextType } from '@/types/context'
import { decodeAnnotations } from './decode'
import { MINIMAL_LIST_FIELDS, decodeTypeEntity, makeResourceApi, responseId } from './resource'
import type { Context as ContextWire, ContextType as ContextTypeWire } from './gen/types.gen'
import { zContext, zContextType, zInstanceListItem } from './gen/zod.gen'

function decodeContext(res: ContextWire): Context {
  return {
    contextId: responseId(res, 'contextId'),
    displayName: res.displayName ?? '',
    description: res.description ?? '',
    contextTypeId: res.type,
    parentId: res.parent,
    annotations: decodeAnnotations(res.annotations),
  }
}

const contexts = makeResourceApi<Context, ContextWire>({
  name: 'Context',
  namePlural: 'contexts',
  listPath: API.CONTEXTS.list,
  byIdPath: API.CONTEXTS.byId,
  mocks: async () => (await import('@/mocks/contexts')).contexts,
  idKey: 'contextId',
  idOf: (c) => c.contextId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zContext,
  decode: decodeContext,
})

export const fetchContexts = contexts.fetchAll
export const fetchContextById = contexts.fetchById

const contextTypes = makeResourceApi<ContextType, ContextTypeWire>({
  name: 'Context type',
  namePlural: 'context types',
  listPath: API.CONTEXT_TYPES.list,
  byIdPath: API.CONTEXT_TYPES.byId,
  mocks: async () => (await import('@/mocks/contexts')).contextTypes,
  idKey: 'contextTypeId',
  idOf: (t) => t.contextTypeId,
  listSchema: zInstanceListItem,
  requireListFields: MINIMAL_LIST_FIELDS,
  responseSchema: zContextType,
  decode: (res) => decodeTypeEntity('contextTypeId', res),
})

export const fetchContextTypes = contextTypes.fetchAll
export const fetchContextTypeById = contextTypes.fetchById
