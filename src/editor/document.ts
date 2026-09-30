import { parse as parseYaml, parseAllDocuments, stringify as stringifyYaml } from 'yaml'
import type { ZodError } from 'zod'
import { RESOURCE_TYPE_BY_NAME, RESOURCE_TYPE_DEFS, type ResourceTypeDef } from './kinds'

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

/** Normalize Threshold form flat UUID into nested metricInstanceRef for YAML. */
export function formSpecToYamlSpec(kind: string, spec: Record<string, unknown>): Record<string, unknown> {
  const out = { ...spec }
  if (kind === 'Threshold') {
    const ref = out.metricInstanceRef
    if (typeof ref === 'string' && ref.length > 0) {
      out.metricInstanceRef = { metricInstanceId: ref }
    } else if (isPlainObject(ref) && typeof ref.metricInstanceId === 'string') {
      // already nested
    } else if (ref === '' || ref == null) {
      delete out.metricInstanceRef
    }
  }
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

/** Flatten nested Threshold ref for the form editor. */
export function yamlSpecToFormSpec(kind: string, spec: Record<string, unknown>): Record<string, unknown> {
  const out = { ...spec }
  if (kind === 'Threshold' && isPlainObject(out.metricInstanceRef)) {
    const id = out.metricInstanceRef.metricInstanceId
    out.metricInstanceRef = typeof id === 'string' ? id : ''
  }
  if (!isPlainObject(out.annotations)) {
    out.annotations = {}
  }
  return out
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

export function parseDocument(text: string): { document?: IngressDocument; issues: ValidationIssue[] } {
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

  const yamlSpec = formSpecToYamlSpec(doc.kind, doc.spec)
  const parsed = def.schema.safeParse(yamlSpec)
  if (!parsed.success) {
    issues.push(...zodIssues(parsed.error))
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
  const id = idKey && typeof doc.spec[idKey] === 'string' ? String(doc.spec[idKey]).slice(0, 8) : 'draft'
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
