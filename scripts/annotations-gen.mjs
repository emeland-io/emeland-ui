#!/usr/bin/env node
/**
 * Generate src/annotations/catalog.gen.ts from the well-known annotations
 * YAML source of truth in the modelsrv repository. Same conventions as
 * api-gen: the generated file is committed, @generated, never edited by hand.
 *
 * Source selection:
 *   --spec <path|url>          exact YAML source (local file or URL)
 *   EMELAND_ANNOTATIONS_SPEC   env equivalent (flag wins)
 *   (default)                  modelsrv main: pkg/annotations/well_known.yaml
 *
 * The generated header is source-independent (no path or hash), so a regen
 * from any location with identical content is byte-identical — the --check
 * drift gate compares content, not provenance.
 *
 * --check: generate into a temp dir and fail on drift; writes nothing.
 *
 * Usage: npm run annotations:gen [-- <flags>]
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { load as loadYaml } from 'js-yaml'
import { z } from 'zod'

const DEFAULT_SPEC =
  'https://raw.githubusercontent.com/emeland-io/modelsrv/main/pkg/annotations/well_known.yaml'
const GEN_FILE = 'src/annotations/catalog.gen.ts'

const USAGE = `Usage: npm run annotations:gen [-- <flags>]

  (no flags)          generate from the modelsrv source of truth:
                      ${DEFAULT_SPEC}
  --spec <path|url>   exact YAML source (local file or URL), or a GitHub API
                      directory like https://api.github.com/repos/<o>/<r>/contents/<dir>
  EMELAND_ANNOTATIONS_SPEC  same, without the flag
  --check             generate into a temp dir and fail on drift; writes nothing
  -h, --help          this help`

const { values: flags } = parseArgs({
  options: {
    spec: { type: 'string' },
    check: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
})
if (flags.help) {
  console.log(USAGE)
  process.exit(0)
}

// ---- source

// option A: a GitHub API contents directory
// (https://api.github.com/repos/<owner>/<repo>/contents/<dir>) — the script
// picks the newest *.yaml in it; option B: a raw-file URL or a local path
const explicit = flags.spec ?? process.env.EMELAND_ANNOTATIONS_SPEC

/** Resolve the newest *.yaml in a GitHub API directory listing */
async function resolveRemoteDir(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to list ${url}: HTTP ${res.status}`)
  const files = (await res.json()).filter((f) => f.type === 'file')
  const specs = files
    .filter((f) => /\.ya?ml$/.test(f.name))
    .map((f) => ({
      name: f.name,
      input: f.download_url,
      version: f.name
        .match(/(\d+)\.(\d+)\.(\d+)/)
        ?.slice(1)
        .map(Number) ?? [0, 0, 0],
    }))
    .sort((a, b) => {
      for (let i = 0; i < 3; i++)
        if (a.version[i] !== b.version[i]) return b.version[i] - a.version[i]
      return 0
    })
  if (specs.length === 0) throw new Error(`No *.yaml found in ${url}`)
  return specs[0]
}

let source = DEFAULT_SPEC
let mode = 'default (modelsrv main)'
if (explicit) {
  if (/^https?:\/\//.test(explicit)) {
    if (explicit.startsWith('https://api.github.com/repos/')) {
      const newest = await resolveRemoteDir(explicit)
      source = newest.input
      mode = `remote dir -> ${newest.name}`
    } else {
      source = explicit
      mode = 'remote'
    }
  } else {
    source = explicit
    mode = 'local override'
  }
}

async function readSource(input) {
  if (/^https?:\/\//.test(input)) {
    const res = await fetch(input)
    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${input}: HTTP ${res.status}` +
          (res.status === 404 ? ' (not published yet? see modelsrv pkg/annotations)' : ''),
      )
    }
    return res.text()
  }
  return readFileSync(resolve(input), 'utf8')
}

// ---- validation

const entrySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  purpose: z.string().min(1),
  example: z.string().min(1),
  appliesTo: z.string().min(1),
  category: z.string().min(1),
  level: z.enum(['required', 'recommended', 'optional']).optional(),
  format: z.enum(['timestamp']).optional(),
})

const catalogSchema = z.object({
  version: z.number(),
  annotations: z.array(entrySchema).min(1),
})

const parsed = catalogSchema.safeParse(loadYaml(await readSource(source)))
if (!parsed.success) {
  console.error(`Invalid annotations catalog in ${source}:`)
  console.error(z.prettifyError(parsed.error))
  process.exit(1)
}

const { version, annotations } = parsed.data
const seen = new Set()
for (const entry of annotations) {
  if (seen.has(entry.key)) {
    console.error(`Duplicate key in ${source}: ${entry.key}`)
    process.exit(1)
  }
  seen.add(entry.key)
}

// ---- generation

const PREFIX = 'emeland.io/'

const lines = annotations.map((a) => {
  const suffix = a.key.startsWith(PREFIX) ? a.key.slice(PREFIX.length) : a.key
  const fields = [
    `key: ${JSON.stringify(a.key)}`,
    `suffix: ${JSON.stringify(suffix)}`,
    `label: ${JSON.stringify(a.label)}`,
    `purpose: ${JSON.stringify(a.purpose)}`,
    `example: ${JSON.stringify(a.example)}`,
    `appliesTo: ${JSON.stringify(a.appliesTo)}`,
    `category: ${JSON.stringify(a.category)}`,
    ...(a.level ? [`level: ${JSON.stringify(a.level)}`] : []),
    ...(a.format ? [`format: ${JSON.stringify(a.format)}`] : []),
  ]
  return `  {\n    ${fields.join(',\n    ')},\n  },`
})

// header carries no source path or hash: regen from any location with the
// same content must be byte-identical (see --check)
const output = `// This file is auto-generated by scripts/annotations-gen.mjs — do not edit
// catalog version: ${version}
// regenerate: npm run annotations:gen

import type { GeneratedAnnotation } from '@/utils/annotations'

export const GENERATED_ANNOTATIONS: GeneratedAnnotation[] = [
${lines.join('\n')}
]
`

const outFile = flags.check
  ? join(mkdtempSync(join(tmpdir(), 'emeland-annotations-gen-')), basename(GEN_FILE))
  : GEN_FILE
writeFileSync(outFile, output)

// format with the repo's prettier config (explicit path: --check writes to a temp dir)
const { execFileSync } = await import('node:child_process')
execFileSync(
  'npx',
  ['prettier', '--write', '--log-level', 'warn', '--config', '.prettierrc', outFile],
  {
    stdio: 'inherit',
  },
)

if (flags.check) {
  const current = readFileSync(GEN_FILE, 'utf8')
  const fresh = readFileSync(outFile, 'utf8')
  if (current !== fresh) {
    console.error(
      `[annotations:gen] drift in ${GEN_FILE} — run 'npm run annotations:gen' and commit`,
    )
    process.exit(1)
  }
  console.log(`[annotations:gen] ${GEN_FILE} is up to date (source: ${mode})`)
  process.exit(0)
}

console.log(`[annotations:gen] wrote ${GEN_FILE} (${annotations.length} entries) from ${source}`)
