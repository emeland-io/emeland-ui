import { parse as parseYaml, parseAllDocuments, stringify as stringifyYaml } from 'yaml'
import { z, type ZodError } from 'zod'
import { RESOURCE_TYPE_BY_NAME, RESOURCE_TYPE_DEFS, type ResourceTypeDef } from './kinds'
import { safeStorage } from '@/utils/storage'
import { annotationFormatIssue } from '@/utils/annotations'

const zUuidCheck = z.string().uuid()

export interface IngressDocument {
  version: string
  kind: string
  spec: Record<string, unknown>
}

export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidateResult {
  ok: boolean
  issues: ValidationIssue[]
  document?: IngressDocument
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function nestUuidRef(out: Record<string, unknown>, field: string, idKey: string): void {
  const ref = out[field]
  if (typeof ref === 'string' && ref.length > 0) {
    out[field] = { [idKey]: ref }
  } else if (isPlainObject(ref) && typeof ref[idKey] === 'string') {
    // already nested
  } else if (ref === '' || ref == null) {
    delete out[field]
  }
}

function flattenUuidRef(out: Record<string, unknown>, field: string, idKey: string): void {
  if (!isPlainObject(out[field])) return
  const id = (out[field] as Record<string, unknown>)[idKey]
  out[field] = typeof id === 'string' ? id : ''
}

export function formSpecToYamlSpec(
  kind: string,
  spec: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...spec }
  if (kind === 'MetricInstance' && typeof out.metric === 'string') {
    if (!out.metricRef) out.metricRef = out.metric
    delete out.metric
  }

  if (kind === 'Threshold') nestUuidRef(out, 'metricInstanceRef', 'metricInstanceId')
  if (kind === 'MetricInstance') nestUuidRef(out, 'metricRef', 'metricId')

  // Drop empty annotations / empty string lists for cleaner YAML
  if (isPlainObject(out.annotations) && Object.keys(out.annotations).length === 0) {
    delete out.annotations
  }
  for (const key of ['consumes', 'provides', 'values'] as const) {
    if (Array.isArray(out[key]) && (out[key] as unknown[]).length === 0) delete out[key]
  }
  // Drop blank optional strings
  for (const [k, v] of Object.entries(out)) {
    if (v === '' || v === undefined) delete out[k]
  }
  return out
}

/** Flatten nested ingress refs for the form editor. */
export function yamlSpecToFormSpec(
  kind: string,
  spec: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...spec }

  if (kind === 'MetricInstance' && typeof out.metric === 'string' && !out.metricRef) {
    out.metricRef = out.metric
    delete out.metric
  }

  if (kind === 'Threshold') flattenUuidRef(out, 'metricInstanceRef', 'metricInstanceId')
  if (kind === 'MetricInstance') flattenUuidRef(out, 'metricRef', 'metricId')

  if (!isPlainObject(out.annotations)) {
    out.annotations = {}
  }
  return out
}

/** Map validation issues onto form field keys (top-level + nested + array indices) */
export function issuesToFieldErrors(issues: ValidationIssue[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const issue of issues) {
    const full = issue.path.replace(/^spec\./, '')
    if (!full) continue
    if (!map[full]) map[full] = issue.message
    if (!map[issue.path]) map[issue.path] = issue.message
    const top = full.split('.')[0]
    if (top && top !== 'annotations' && !map[top]) map[top] = issue.message
  }
  return map
}

export function fieldDefIssues(
  def: ResourceTypeDef,
  spec: Record<string, unknown>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const field of def.fields) {
    const path = `spec.${field.key}`
    const raw = spec[field.key]

    if (field.type === 'uuid') {
      const s = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw)
      if (!s) {
        if (field.required) issues.push({ path, message: 'Required. Must be a valid UUID' })
        continue
      }
      if (!zUuidCheck.safeParse(s).success) {
        issues.push({ path, message: 'Must be a valid UUID' })
      }
      continue
    }

    if (field.type === 'string') {
      const s = typeof raw === 'string' ? raw.trim() : raw == null ? '' : String(raw)
      if (!s && field.required) {
        issues.push({ path, message: 'Required. Non-empty text' })
      }
      continue
    }

    if (field.type === 'boolean') {
      if (field.required && typeof raw !== 'boolean') {
        issues.push({ path, message: 'Required. True or false' })
      }
      continue
    }

    if (field.type === 'enum' && field.enumValues?.length) {
      const s = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
      if (!s) {
        if (field.required) {
          issues.push({
            path,
            message: `Required. One of: ${field.enumValues.join(', ')}`,
          })
        }
        continue
      }
      if (!field.enumValues.includes(s)) {
        issues.push({
          path,
          message: `Must be one of: ${field.enumValues.join(', ')}`,
        })
      }
      continue
    }

    if (field.type === 'stringList') {
      if (!Array.isArray(raw) || raw.length === 0) {
        if (field.required) {
          issues.push({
            path,
            message: field.refType
              ? 'Required. Comma-separated UUIDs'
              : 'Required. Comma-separated values',
          })
        }
        continue
      }
      raw.forEach((item, i) => {
        const s = typeof item === 'string' ? item.trim() : String(item ?? '')
        if (!s) {
          issues.push({ path: `${path}.${i}`, message: 'List items cannot be empty' })
          return
        }
        if (field.refType && !zUuidCheck.safeParse(s).success) {
          issues.push({
            path: `${path}.${i}`,
            message: `Must be a valid UUID (got "${s}")`,
          })
        }
      })
      continue
    }

    if (field.type === 'annotations') {
      if (!isPlainObject(raw)) continue
      for (const [key, value] of Object.entries(raw)) {
        const k = key.trim()
        const v = typeof value === 'string' ? value : String(value ?? '')
        if (!k) {
          issues.push({ path: `${path}.`, message: 'Annotation key is required' })
          continue
        }
        if (!v.trim()) {
          issues.push({
            path: `${path}.${k}`,
            message: 'Annotation value is required',
          })
          continue
        }
        const formatMsg = annotationFormatIssue(k, v)
        if (formatMsg) {
          issues.push({ path: `${path}.${k}`, message: formatMsg })
        }
      }
    }
  }

  return issues
}

export function stringifyDocument(doc: IngressDocument): string {
  const payload = {
    version: doc.version,
    kind: doc.kind,
    spec: formSpecToYamlSpec(doc.kind, doc.spec),
  }
  return stringifyYaml(payload, {
    lineWidth: 100,
    defaultKeyType: 'PLAIN',
    defaultStringType: 'PLAIN',
  })
}

export function parseDocument(text: string): {
  document?: IngressDocument
  issues: ValidationIssue[]
} {
  const issues: ValidationIssue[] = []
  let raw: unknown
  try {
    raw = parseYaml(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid YAML'
    return { issues: [{ path: '', message: msg }] }
  }

  if (!isPlainObject(raw)) {
    return { issues: [{ path: '', message: 'Document must be a YAML mapping' }] }
  }

  const version = raw.version
  const kind = raw.kind
  const spec = raw.spec

  if (typeof version !== 'string' || !version.startsWith('emeland.io/')) {
    issues.push({
      path: 'version',
      message: 'version must be a string starting with "emeland.io/" (e.g. emeland.io/v1)',
    })
  }
  if (typeof kind !== 'string' || !kind.trim()) {
    issues.push({ path: 'kind', message: 'kind is required' })
  } else if (!RESOURCE_TYPE_BY_NAME[kind]) {
    issues.push({
      path: 'kind',
      message: `Unsupported resource type "${kind}". Supported: ${RESOURCE_TYPE_DEFS.map((k) => k.resourceType).join(', ')}`,
    })
  }
  if (!isPlainObject(spec)) {
    issues.push({ path: 'spec', message: 'spec must be a mapping' })
  }

  if (issues.length) return { issues }

  return {
    document: {
      version: version as string,
      kind: kind as string,
      spec: yamlSpecToFormSpec(kind as string, spec as Record<string, unknown>),
    },
    issues: [],
  }
}

function zodIssues(err: ZodError): ValidationIssue[] {
  return err.issues.map((i) => ({
    path: i.path.length ? `spec.${i.path.join('.')}` : 'spec',
    message: i.message,
  }))
}

export function validateDocument(doc: IngressDocument): ValidateResult {
  const def: ResourceTypeDef | undefined = RESOURCE_TYPE_BY_NAME[doc.kind]
  const issues: ValidationIssue[] = []

  if (!doc.version?.startsWith('emeland.io/')) {
    issues.push({
      path: 'version',
      message: 'version must start with "emeland.io/"',
    })
  }
  if (!def) {
    issues.push({ path: 'kind', message: `Unsupported resource type "${doc.kind}"` })
    return { ok: false, issues }
  }

  issues.push(...fieldDefIssues(def, doc.spec))

  const yamlSpec = formSpecToYamlSpec(doc.kind, doc.spec)
  const parsed = def.schema.safeParse(yamlSpec)
  if (!parsed.success) {
    const seen = new Set(issues.map((i) => i.path))
    for (const issue of zodIssues(parsed.error)) {
      // Prefer field-def message when we already flagged this path / its parent
      const top = issue.path.replace(/^spec\./, '').split('.')[0]
      if (seen.has(issue.path) || (top && seen.has(`spec.${top}`))) continue
      issues.push(issue)
      seen.add(issue.path)
    }
  }

  return { ok: issues.length === 0, issues, document: doc }
}

export function validateYamlText(text: string): ValidateResult {
  const { document, issues } = parseDocument(text)
  if (!document) return { ok: false, issues }
  const result = validateDocument(document)
  return { ...result, issues: [...issues, ...result.issues] }
}

export function downloadFilename(doc: IngressDocument): string {
  const def = RESOURCE_TYPE_BY_NAME[doc.kind]
  const idKey = def?.idField
  const id =
    idKey && typeof doc.spec[idKey] === 'string' ? String(doc.spec[idKey]).slice(0, 8) : 'draft'
  const kind = (doc.kind || 'resource').toLowerCase()
  return `${kind}-${id}.yaml`
}

export function bundleDownloadFilename(when: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = when.getFullYear()
  const m = pad(when.getMonth() + 1)
  const d = pad(when.getDate())
  const hh = pad(when.getHours())
  const mm = pad(when.getMinutes())
  const ss = pad(when.getSeconds())
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}-bundle.yaml`
}

export interface BundleItem {
  id: string
  document: IngressDocument
}

export function newBundleItemId(): string {
  return crypto.randomUUID()
}

export const BUNDLE_STORAGE_KEY = 'emeland-yaml-editor-bundle'

function isIngressDocument(v: unknown): v is IngressDocument {
  if (!isPlainObject(v)) return false
  return typeof v.version === 'string' && typeof v.kind === 'string' && isPlainObject(v.spec)
}

/** Load persisted bundle items from localStorage (invalid entries skipped). */
export function loadPersistedBundle(): BundleItem[] {
  const raw = safeStorage()?.getItem(BUNDLE_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: BundleItem[] = []
    for (const entry of parsed) {
      if (!isPlainObject(entry)) continue
      if (typeof entry.id !== 'string' || !entry.id) continue
      if (!isIngressDocument(entry.document)) continue
      out.push({ id: entry.id, document: entry.document })
    }
    return out
  } catch {
    return []
  }
}

export function persistBundle(items: BundleItem[]): void {
  const storage = safeStorage()
  if (!storage) return
  if (!items.length) {
    storage.removeItem(BUNDLE_STORAGE_KEY)
    return
  }
  storage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(items))
}

export function documentLabel(doc: IngressDocument): string {
  const name = doc.spec.displayName
  if (typeof name === 'string' && name.trim()) return name.trim()
  const def = RESOURCE_TYPE_BY_NAME[doc.kind]
  const idKey = def?.idField
  if (idKey && typeof doc.spec[idKey] === 'string') {
    return String(doc.spec[idKey]).slice(0, 8)
  }
  return doc.kind || 'document'
}

export function documentBundleMeta(doc: IngressDocument): string {
  const def = RESOURCE_TYPE_BY_NAME[doc.kind]
  const resourceTypeLabel = def?.label ?? doc.kind
  const id = documentResourceId(doc)
  const short = id ? id.slice(0, 8) : null
  return short ? `${resourceTypeLabel} · ${short}` : resourceTypeLabel
}

export function documentResourceId(doc: IngressDocument): string | null {
  const def = RESOURCE_TYPE_BY_NAME[doc.kind]
  if (!def) return null
  const id = doc.spec[def.idField]
  return typeof id === 'string' && id.trim() ? id : null
}

export function stringifyBundle(docs: IngressDocument[]): string {
  return docs.map((d) => stringifyDocument(d).trimEnd()).join('\n---\n') + '\n'
}

export function parseBundle(text: string): {
  documents: IngressDocument[]
  issues: ValidationIssue[]
} {
  const issues: ValidationIssue[] = []
  const documents: IngressDocument[] = []

  let yamlDocs
  try {
    yamlDocs = parseAllDocuments(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid YAML'
    return { documents: [], issues: [{ path: '', message: msg }] }
  }

  yamlDocs.forEach((ydoc, index) => {
    if (ydoc.errors.length) {
      issues.push({
        path: `document[${index}]`,
        message: ydoc.errors[0]?.message ?? 'YAML parse error',
      })
      return
    }
    const raw = ydoc.toJSON()
    if (raw == null) return // empty docs between ---
    const serialized = stringifyYaml(raw)
    const { document, issues: docIssues } = parseDocument(serialized)
    if (!document) {
      for (const issue of docIssues) {
        issues.push({
          path: issue.path ? `document[${index}].${issue.path}` : `document[${index}]`,
          message: issue.message,
        })
      }
      return
    }
    documents.push(document)
  })

  if (!documents.length && !issues.length) {
    issues.push({ path: '', message: 'no YAML documents found' })
  }

  return { documents, issues }
}

export function validateBundle(docs: IngressDocument[]): ValidateResult {
  const issues: ValidationIssue[] = []
  docs.forEach((doc, index) => {
    const result = validateDocument(doc)
    for (const issue of result.issues) {
      issues.push({
        path: issue.path ? `document[${index}].${issue.path}` : `document[${index}]`,
        message: issue.message,
      })
    }
  })
  if (!docs.length) {
    issues.push({ path: '', message: 'bundle is empty' })
  }
  return { ok: issues.length === 0, issues }
}

export function downloadYaml(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
