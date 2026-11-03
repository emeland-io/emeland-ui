#!/usr/bin/env node
/**
 * Regenerate src/api/gen (zod schemas + types) from the EmELand OpenAPI spec.
 *
 * Source selection (see USAGE below):
 *   --remote (default)  newest *.yaml in api/openapi/ of the modelsrv
 *                       repository on GitLab (version parsed from the name),
 *                       instance, project, ref and token: see modelsrv.mjs
 *   --local <path>      newest spec in a local modelsrv checkout at <path>
 *                       (required), provenance from local git
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
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { blobUrl, commit, fetchFile, fetchText, listDir, rawUrl } from './modelsrv.mjs'

const USAGE = `Usage: npm run api:gen [-- <flags>]

  (no flags)          newest spec from the modelsrv repository on GitLab
  --local <path>      newest spec from a local modelsrv checkout.
                      path is required: the checkout root, the spec
                      directory, or a spec file
  --spec <url|file>   exact spec source, no newest-version resolution
  --check             generate into a temp dir and fail on drift
  -h, --help          this help

  GITLAB_TOKEN, or CI_JOB_TOKEN in GitLab CI, authenticates against the
  private modelsrv project (see scripts/modelsrv.mjs).`

const SPECS_DIR = 'api/openapi'
const GEN_DIR = 'src/api/gen'
const ZOD_GEN = `${GEN_DIR}/zod.gen.ts`
const GEN_FILES = [ZOD_GEN, `${GEN_DIR}/types.gen.ts`, `${GEN_DIR}/index.ts`]

// ---------------------------------------------------------------- CLI

let args
try {
  args = parseArgs({
    options: {
      remote: { type: 'boolean' },
      local: { type: 'boolean' },
      spec: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
      check: { type: 'boolean' },
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

// only names carrying a spec version (X.Y.Z) participate — an unversioned
// yaml would otherwise sort as [0,0,0] and could win on tie order
function newestByVersion(names) {
  return names
    .filter((n) => /\.ya?ml$/.test(n) && /\d+\.\d+\.\d+/.test(n))
    .map((n) => ({ name: n, version: semverOf(n) }))
    .sort((a, b) => cmpSemver(b.version, a.version))[0]
}

// newest spec in the modelsrv repository on GitLab, with blob sha + page link
async function resolveRemoteSpec() {
  const newest = newestByVersion(await listDir(SPECS_DIR))
  if (!newest) throw new Error(`No *.yaml spec found in modelsrv ${SPECS_DIR}/`)
  const path = `${SPECS_DIR}/${newest.name}`
  const file = await fetchFile(path)
  return {
    mode: 'remote',
    input: rawUrl(path),
    text: file.text,
    name: newest.name,
    version: newest.version,
    blobSha: file.blobSha,
    htmlUrl: blobUrl(path),
    // best effort, regen works without it
    commit: await commit(file.lastCommitId),
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
    execFileSync('git', ['-C', dirname(file), ...argv], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  try {
    const [sha, date, author, subject] = git(
      'log',
      '-1',
      '--format=%H%n%aI%n%an%n%s',
      '--',
      file,
    ).split('\n')
    if (!sha) return undefined
    return { sha, date, author, subject, dirty: git('status', '--porcelain', '--', file) !== '' }
  } catch {
    return undefined // not a git checkout, or git unavailable
  }
}

// a GitLab raw-file API URL carries the file path encoded before /raw
function nameOfUrl(source) {
  const { pathname } = new URL(source)
  const api = pathname.match(/\/repository\/files\/([^/]+)\/raw$/)
  return basename(api ? decodeURIComponent(api[1]) : pathname)
}

function resolveExplicitSpec(source) {
  const isUrl = /^https?:\/\//.test(source)
  return {
    mode: isUrl ? 'url' : 'local',
    input: isUrl ? source : resolve(source),
    name: isUrl ? nameOfUrl(source) : basename(source),
    version: semverOf(isUrl ? nameOfUrl(source) : basename(source)),
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

// a URL is downloaded here, the generator would fetch it without the token
let input = spec.input
if (/^https?:\/\//.test(input)) {
  input = join(mkdtempSync(join(tmpdir(), 'emeland-api-spec-')), spec.name)
  try {
    writeFileSync(input, spec.text ?? (await fetchText(spec.input)))
  } catch (e) {
    console.error(`[api:gen] error: ${e.message}`)
    process.exit(1)
  }
}

// --check: generate into a temp dir and diff — no writes to src/api/gen
const outDir = flags.check ? mkdtempSync(join(tmpdir(), 'emeland-api-gen-')) : GEN_DIR

const { createClient } = await import('@hey-api/openapi-ts')
await createClient({
  input,
  output: { path: outDir },
  // schemas + types only: the hand-written fetch/resource layer stays
  plugins: ['@hey-api/typescript', { name: 'zod' }],
})

const zodFile = join(outDir, 'zod.gen.ts')
const shimmed = readFileSync(zodFile, 'utf8')
  .replaceAll('z.uuid()', 'z.string().min(1)')
  .replaceAll('z.url()', 'z.string()')
  .replaceAll('z.iso.datetime()', 'z.string()')

const leftover = shimmed.match(/z\.(uuid|url|iso)\b[^,\n]*/g)
if (leftover) {
  throw new Error(
    `format shim missed generator output (update the replacements): ${[...new Set(leftover)].join(', ')}`,
  )
}
writeFileSync(zodFile, shimmed)
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

const outFiles = GEN_FILES.map((f) => join(outDir, basename(f)))
for (const file of outFiles) {
  const content = readFileSync(file, 'utf8')
  // strip the generator's own banner only when it is the one we know,
  // if the generator ever changes it, we prepend ours rather than double-strip
  const known = content.match(/^\/\/ This file is auto-generated.*\n/)
  const body = known ? content.slice(known[0].length) : content
  writeFileSync(file, provenance + body)
}

// format with the repo's prettier config: keeps the committed files
// format:check-clean and regeneration byte-stable (drift checks depend on it).
// --config is explicit because prettier resolves config by file location,
// and --check writes to a temp dir outside the repo
execFileSync(
  'npx',
  ['prettier', '--write', '--log-level', 'warn', '--config', '.prettierrc', ...outFiles],
  { stdio: 'inherit' },
)

if (flags.check) {
  const drifted = GEN_FILES.filter(
    (f) => readFileSync(f, 'utf8') !== readFileSync(join(outDir, basename(f)), 'utf8'),
  )
  if (drifted.length) {
    console.error(`[api:gen] drift in ${drifted.join(', ')} — run 'npm run api:gen' and commit`)
    process.exit(1)
  }
  console.log('[api:gen] src/api/gen is up to date with the newest spec')
  process.exit(0)
}
console.log(`[api:gen] wrote provenance headers to ${outFiles.length} files`)
console.log('[api:gen] formatted generated files with prettier')
console.log('[api:gen] wrote src/api/gen — review the diff and commit')
