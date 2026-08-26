import { z } from 'zod'
import { MODEL_API } from '@/constants/api'
import type { Model } from '@/types/model'
import { USE_MOCKS, getJson } from './fetch'
import { annotationsResponseSchema, decodeAnnotations } from './decode'
import { parseApiResponse } from './validate'

const modelResponseSchema = z.object({
  modelId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  baseUrl: z.string().optional(),
  environment: z.string().optional(),
  version: z.string().optional(),
  status: z.enum(['online', 'offline', 'unknown']).optional(),
  host: z.string().optional(),
  region: z.string().optional(),
  // the backend sends annotations as Array<{key, value}>
  annotations: annotationsResponseSchema.optional(),
})

export async function fetchModel(): Promise<Model> {
  if (USE_MOCKS) {
    const { model } = await import('@/mocks/model')
    return model
  }
  const data = await getJson<unknown>(MODEL_API.model, 'model')
  const res = parseApiResponse(modelResponseSchema, data, 'model')
  const { annotations, ...rest } = res
  return {
    ...rest,
    ...(annotations !== undefined ? { annotations: decodeAnnotations(annotations) } : {}),
  }
}
