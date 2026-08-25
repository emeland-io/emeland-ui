#!/usr/bin/env node
/**
 * Regenerate src/api/gen (zod schemas + types) from the EmELand OpenAPI spec.
 *
 * Source selection (see USAGE below):
 *   --remote (default)  newest *.yaml in the modelsrv GitHub repo's
 *                       api/openapi/ directory (version parsed from the name)
 *   --local <path>      newest spec in a local modelsrv checkout at <path>
 *                       (required); provenance from local git
 *   --spec <url|file>   exact source, no resolution
 *   EMELAND_OAPI_SPEC   legacy env equivalent of --spec (flags win)
 *
 * The spec is never vendored into this repo. Generated files are committed
 * and marked @generated — review their diff, never edit them by hand.
 * Each generated file carries a provenance header (spec version, blob sha,
 * last spec commit) so a regen is traceable to the exact spec content.
 */
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const USAGE = `Usage: npm run api:gen [-- <flags>]

  (no flags)          newest spec from the modelsrv GitHub repo (main)
  --local <path>      newest spec from a local modelsrv checkout.
                      path is required: the checkout root, the spec
                      directory, or a spec file
  --spec <url|file>   exact spec source, no newest-version resolution
  -h, --help          this help

  GITHUB_TOKEN/GH_TOKEN are used for GitHub API calls when set
  (anonymous calls are rate-limited to 60/hour per IP).`

const REPO = 'emeland-io/modelsrv'
const SPECS_DIR = 'api/openapi'
const GEN_DIR = 'src/api/gen'
const ZOD_GEN = `${GEN_DIR}/zod.gen.ts`
const GEN_FILES = [ZOD_GEN, `${GEN_DIR}/types.gen.ts`, `${GEN_DIR}/index.ts`]

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
}

// ---------------------------------------------------------------- CLI

let args
try {
  args = parseArgs({
    options: {
      remote: { type: 'boolean' },
      local: { type: 'boolean' },
      spec: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true, // the optional path after --local
  })
} catch (e) {
  console.error(`${e.message}\n\n${USAGE}`)
  process.exit(1)
}
const { values: flags, positionals } = args

if (flags.help) {
  console.log(USAGE)
  process.exit(0)
}
if ([flags.remote, flags.local, flags.spec].filter(Boolean).length > 1) {
  console.error(`Pick one of --remote, --local, --spec.\n\n${USAGE}`)
  process.exit(1)
}
if (positionals.length > (flags.local ? 1 : 0)) {
  console.error(`Unexpected argument: ${positionals[flags.local ? 1 : 0]}\n\n${USAGE}`)
  process.exit(1)
}

// ------------------------------------------------- spec resolution

function semverOf(name) {
  const m = name.match(/(\d+)\.(\d+)\.(\d+)/)
  return m ? m.slice(1).map(Number) : [0, 0, 0]
}

function cmpSemver(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}

function newestByVersion(names) {
  return names
    .filter((n) => /\.ya?ml$/.test(n))
    .map((n) => ({ name: n, version: semverOf(n) }))
    .sort((a, b) => cmpSemver(b.version, a.version))[0]
}

// newest spec in the modelsrv GitHub repo, with blob sha + page link
async function resolveRemoteSpec() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${SPECS_DIR}`, {
    headers: GH_HEADERS,
  })
  if (!res.ok) throw new Error(`Failed to list modelsrv specs: HTTP ${res.status}`)
  const files = (await res.json()).filter((f) => f.type === 'file')
  const newest = newestByVersion(files.map((f) => f.name))
  if (!newest) throw new Error(`No *.yaml spec found in modelsrv ${SPECS_DIR}/`)
  const f = files.find((x) => x.name === newest.name)
  return {
    mode: 'remote',
    input: f.download_url,
    name: f.name,
    version: newest.version,
    blobSha: f.sha,
    htmlUrl: f.html_url,
    commit: await fetchRemoteSpecCommit(f.name),
  }
}

// last commit touching the spec file — best effort, regen works without it
async function fetchRemoteSpecCommit(name) {
  try {
    const url = `https://api.github.com/repos/${REPO}/commits?path=${SPECS_DIR}/${name}&per_page=1`
    const res = await fetch(url, { headers: GH_HEADERS })
    if (!res.ok) return undefined
    const [c] = await res.json()
    if (!c) return undefined
    return {
      sha: c.sha,
      date: c.commit.author.date,
      author: c.commit.author.name,
      subject: c.commit.message.split('\n')[0],
      htmlUrl: c.html_url,
    }
  } catch {
    return undefined
  }
}

// newest spec in a local checkout, provenance from local git
function resolveLocalSpec(pathArg) {
  if (!pathArg) {
    throw new Error('--local requires a path (checkout root, spec directory, or spec file)')
  }
  const given = resolve(pathArg)
  if (!existsSync(given)) {
    throw new Error(`--local: ${given} does not exist`)
  }
  let file
  if (statSync(given).isFile()) {
    file = given
  } else {
    // accept the checkout root or the spec directory itself
    const dir = existsSync(join(given, SPECS_DIR)) ? join(given, SPECS_DIR) : given
    const newest = newestByVersion(readdirSync(dir))
    if (!newest) throw new Error(`--local: no *.yaml spec found in ${dir}`)
    file = join(dir, newest.name)
  }
  return {
    mode: 'local',
    input: file,
    name: basename(file),
    version: semverOf(basename(file)),
    commit: localGitInfo(file),
  }
}

// commit + dirty state of a file in a local git checkout
function localGitInfo(file) {
  const git = (...argv) =>
    execFileSync('git', ['-C', dirname(file), ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  try {
    const [sha, date, author, subject] = git('log', '-1', '--format=%H%n%aI%n%an%n%s', '--', file).split('\n')
    if (!sha) return undefined
    return { sha, date, author, subject, dirty: git('status', '--porcelain', '--', file) !== '' }
  } catch {
    return undefined // not a git checkout, or git unavailable
  }
}

function resolveExplicitSpec(source) {
  const isUrl = /^https?:\/\//.test(source)
  return {
    mode: isUrl ? 'url' : 'local',
    input: isUrl ? source : resolve(source),
    name: basename(new URL(source, 'file:///').pathname),
    version: semverOf(source),
    commit: isUrl ? undefined : localGitInfo(resolve(source)),
  }
}

const explicit = flags.spec ?? (!flags.local && process.env.EMELAND_OAPI_SPEC)
let spec
try {
  spec = explicit
    ? resolveExplicitSpec(explicit)
    : flags.local
      ? resolveLocalSpec(positionals[0])
      : await resolveRemoteSpec()
} catch (e) {
  console.error(`[api:gen] error: ${e.message}`)
  process.exit(1)
}

console.log(`[api:gen] mode:        ${spec.mode}`)
console.log(`[api:gen] spec:        ${spec.name} (v${spec.version.join('.')})`)
console.log(`[api:gen] source:      ${spec.input}`)
if (spec.htmlUrl) console.log(`[api:gen] spec page:   ${spec.htmlUrl}`)
if (spec.blobSha) console.log(`[api:gen] blob sha:    ${spec.blobSha}`)
if (spec.commit) {
  const c = spec.commit
  console.log(`[api:gen] spec commit: ${c.sha.slice(0, 12)} (${c.date}, ${c.author})`)
  console.log(`[api:gen]              "${c.subject}"`)
  if (c.htmlUrl) console.log(`[api:gen] commit url:  ${c.htmlUrl}`)
  if (c.dirty) console.log('[api:gen] WARNING: spec has uncommitted local changes')
}

// ------------------------------------------------------ generation

const { createClient } = await import('@hey-api/openapi-ts')
await createClient({
  input: spec.input,
  output: { path: GEN_DIR },
  // schemas + types only: the hand-written fetch/resource layer stays
  plugins: ['@hey-api/typescript', { name: 'zod' }],
})

const shimmed = readFileSync(ZOD_GEN, 'utf8')
  .replaceAll('z.uuid()', 'z.string().min(1)')
  .replaceAll('z.url()', 'z.string()')
  .replaceAll('z.iso.datetime()', 'z.string()')

const leftover = shimmed.match(/z\.(uuid|url|iso)\b[^,\n]*/g)
if (leftover) {
  throw new Error(
    `format shim missed generator output (update the replacements): ${[...new Set(leftover)].join(', ')}`,
  )
}
writeFileSync(ZOD_GEN, shimmed)
console.log('[api:gen] applied format shim (z.uuid/z.url/z.iso.datetime -> string) in zod.gen.ts')

const generatorVersion = createRequire(import.meta.url)('@hey-api/openapi-ts/package.json').version
const provenance = [
  `// This file is auto-generated by @hey-api/openapi-ts v${generatorVersion} — do not edit`,
  `// spec:        ${spec.name} (v${spec.version.join('.')})${spec.mode === 'remote' ? '' : ` [${spec.mode} source]`}`,
  `// source:      ${spec.input}`,
  ...(spec.htmlUrl ? [`// spec page:   ${spec.htmlUrl}`] : []),
  ...(spec.blobSha ? [`// blob sha:    ${spec.blobSha}`] : []),
  ...(spec.commit
    ? [
        `// spec commit: ${spec.commit.sha} (${spec.commit.date})${spec.commit.dirty ? ' + uncommitted changes' : ''}`,
        `//              ${spec.commit.subject}`,
        ...(spec.commit.htmlUrl ? [`// commit url:  ${spec.commit.htmlUrl}`] : []),
      ]
    : []),
  `// regenerate:  npm run api:gen`,
  '',
].join('\n')

for (const file of GEN_FILES) {
  const body = readFileSync(file, 'utf8').replace(/^\/\/ This file is auto-generated.*\n/, '')
  writeFileSync(file, provenance + body)
}
console.log(`[api:gen] wrote provenance headers to ${GEN_FILES.length} files`)

console.log('[api:gen] wrote src/api/gen — review the diff and commit')
