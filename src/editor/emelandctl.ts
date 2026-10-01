import type { IngressDocument } from './document'

interface FlagMap {
  flag: string
  specKey: string
  isBool?: boolean
}

interface CreateMapping {
  /** emelandctl create <use> */
  use: string
  flags: FlagMap[]
}

const CREATE_BY_KIND: Record<string, CreateMapping> = {
  System: {
    use: 'system',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'abstract', specKey: 'abstract', isBool: true },
      { flag: 'parent', specKey: 'parent' },
    ],
  },
  API: {
    use: 'api',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'type', specKey: 'type' },
      { flag: 'system', specKey: 'system' },
    ],
  },
  Component: {
    use: 'component',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'system', specKey: 'system' },
    ],
  },
  Context: {
    use: 'context',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'parent', specKey: 'parent' },
      { flag: 'type', specKey: 'type' },
    ],
  },
  ContextType: {
    use: 'context-type',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Node: {
    use: 'node',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'node-type', specKey: 'nodeType' },
    ],
  },
  NodeType: {
    use: 'node-type',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Finding: {
    use: 'finding',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  FindingType: {
    use: 'finding-type',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  SystemInstance: {
    use: 'system-instance',
    flags: [
      { flag: 'system', specKey: 'system' },
      { flag: 'context', specKey: 'context' },
    ],
  },
  ComponentInstance: {
    use: 'component-instance',
    flags: [
      { flag: 'component', specKey: 'component' },
      { flag: 'system-instance', specKey: 'systemInstance' },
    ],
  },
  ApiInstance: {
    use: 'api-instance',
    flags: [
      { flag: 'api', specKey: 'api' },
      { flag: 'system-instance', specKey: 'systemInstance' },
    ],
  },
  Product: {
    use: 'product',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'vendor', specKey: 'vendor' },
    ],
  },
  Artifact: {
    use: 'artifact',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  ArtifactInstance: {
    use: 'artifact-instance',
    flags: [{ flag: 'artifact', specKey: 'artifact' }],
  },
  OrgUnit: {
    use: 'org-unit',
    flags: [
      { flag: 'desc', specKey: 'description' },
      { flag: 'parent', specKey: 'parent' },
    ],
  },
  Group: {
    use: 'group',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Identity: {
    use: 'identity',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  PermissionSpec: {
    use: 'permission-spec',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  RoleSpec: {
    use: 'role-spec',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Permission: {
    use: 'permission',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Role: {
    use: 'role',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Binding: {
    use: 'binding',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  FilterRule: {
    use: 'filter-rule',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  MergeRule: {
    use: 'merge-rule',
    flags: [{ flag: 'desc', specKey: 'description' }],
  },
  Capability: {
    use: 'capability',
    flags: [],
  },
  Parameter: {
    use: 'parameter',
    flags: [],
  },
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function annotationFlags(spec: Record<string, unknown>): string[] {
  const ann = spec.annotations
  if (!ann || typeof ann !== 'object' || Array.isArray(ann)) return []
  const out: string[] = []
  for (const [k, v] of Object.entries(ann as Record<string, unknown>)) {
    if (!k.trim()) continue
    out.push(`--annotation ${shellQuote(`${k}=${String(v ?? '')}`)}`)
  }
  return out
}

function capabilityVersionFlags(spec: Record<string, unknown>): string[] {
  const versions = spec.versions
  if (!Array.isArray(versions)) return []
  const out: string[] = []
  for (const raw of versions) {
    if (!raw || typeof raw !== 'object') continue
    const v = raw as Record<string, unknown>
    const ver = v.version
    const versionStr =
      ver && typeof ver === 'object' && !Array.isArray(ver)
        ? String((ver as Record<string, unknown>).version ?? '')
        : typeof ver === 'string'
          ? ver
          : ''
    if (!versionStr) continue
    out.push(`--version ${shellQuote(versionStr)}`)
    if (ver && typeof ver === 'object' && !Array.isArray(ver)) {
      const meta = ver as Record<string, unknown>
      if (typeof meta.availableFrom === 'string' && meta.availableFrom) {
        out.push(`--available-from ${shellQuote(meta.availableFrom)}`)
      }
      if (typeof meta.deprecatedFrom === 'string' && meta.deprecatedFrom) {
        out.push(`--deprecated-from ${shellQuote(meta.deprecatedFrom)}`)
      }
      if (typeof meta.terminatedFrom === 'string' && meta.terminatedFrom) {
        out.push(`--terminated-from ${shellQuote(meta.terminatedFrom)}`)
      }
    }
  }
  return out
}

export function emelandctlCreateCommand(doc: IngressDocument): string | null {
  const mapping = CREATE_BY_KIND[doc.kind]
  if (!mapping) return null

  const parts: string[] = ['emelandctl', 'create', mapping.use]
  const name = doc.spec.displayName
  if (typeof name === 'string' && name.trim()) {
    parts.push(shellQuote(name.trim()))
  }

  for (const f of mapping.flags) {
    const val = doc.spec[f.specKey]
    if (f.isBool) {
      if (val === true) parts.push(`--${f.flag}`)
      continue
    }
    if (typeof val === 'string' && val.trim()) {
      parts.push(`--${f.flag}`, shellQuote(val.trim()))
    }
  }

  if (doc.kind === 'Capability') {
    parts.push(...capabilityVersionFlags(doc.spec))
  }

  parts.push(...annotationFlags(doc.spec))
  return parts.join(' ')
}

export function emelandctlCreateScript(docs: IngressDocument[]): string {
  const lines: string[] = []
  for (const doc of docs) {
    const cmd = emelandctlCreateCommand(doc)
    if (cmd) {
      lines.push(cmd)
    } else {
      lines.push(
        `# ${doc.kind}: no emelandctl create subcommand. Use Copy / Download YAML for modelsrv ingress`,
      )
    }
  }
  return lines.length ? lines.join('\n') + '\n' : ''
}
