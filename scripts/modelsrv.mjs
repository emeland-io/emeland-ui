/**
 * Access to the modelsrv repository on GitLab for the generator scripts.
 *
 * Environment:
 *   EMELAND_GITLAB_URL        instance, default https://gitlab.opendefense.cloud
 *   EMELAND_MODELSRV_PROJECT  project path, default odc/emeland/modelsrv
 *   EMELAND_MODELSRV_REF      branch or tag, default main
 *   GITLAB_TOKEN              personal, group or project access token with read_api
 *   CI_JOB_TOKEN              fallback in GitLab CI. modelsrv has to allow this
 *                             project under Settings > CI/CD > Job token permissions
 *
 */
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { gunzipSync } from 'node:zlib'
import { dirname, basename } from 'node:path'

export const GITLAB_URL = (
  process.env.EMELAND_GITLAB_URL ?? 'https://gitlab.opendefense.cloud'
).replace(/\/+$/, '')
export const PROJECT = process.env.EMELAND_MODELSRV_PROJECT ?? 'odc/emeland/modelsrv'
export const REF = process.env.EMELAND_MODELSRV_REF ?? 'main'

const API = `${GITLAB_URL}/api/v4/projects/${encodeURIComponent(PROJECT)}`
const REF_QUERY = `ref=${encodeURIComponent(REF)}`

// the token goes to the configured instance only
function headersFor(url) {
  if (!url.startsWith(`${GITLAB_URL}/`)) return {}
  if (process.env.GITLAB_TOKEN) return { 'PRIVATE-TOKEN': process.env.GITLAB_TOKEN }
  if (process.env.CI_JOB_TOKEN) return { 'JOB-TOKEN': process.env.CI_JOB_TOKEN }
  return {}
}

// node:http instead of fetch: fetch adds sec-fetch-mode, which the archive
// endpoint's hotlinking guard answers with 406
function request(url) {
  const headers = { accept: '*/*', ...headersFor(url) }
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https:') ? httpsRequest : httpRequest)(url, { headers }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('error', reject)
      res.on('end', () =>
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
      )
    })
    req.on('error', reject)
    req.end()
  })
}

async function get(url) {
  const res = await request(url)
  if (res.status < 200 || res.status >= 300) {
    const hint =
      (res.status === 401 || res.status === 404) && url.startsWith(`${GITLAB_URL}/`)
        ? ' (private project: set GITLAB_TOKEN, or allow this project in the modelsrv job token permissions)'
        : ''
    throw new Error(`${url}: HTTP ${res.status}${hint}`)
  }
  return res
}

/** Page of the file in the GitLab UI, for provenance headers */
export function blobUrl(path) {
  return `${GITLAB_URL}/${PROJECT}/-/blob/${REF}/${path}`
}

/** API URL returning the raw file content */
export function rawUrl(path) {
  return `${API}/repository/files/${encodeURIComponent(path)}/raw?${REF_QUERY}`
}

/** Text of a URL, authenticated when it points at the configured instance */
export async function fetchText(url) {
  return (await get(url)).body.toString('utf8')
}

/** Content of a repository file with the blob and last-commit ids GitLab sends along */
export async function fetchFile(path) {
  const res = await get(rawUrl(path))
  return {
    text: res.body.toString('utf8'),
    blobSha: res.headers['x-gitlab-blob-id'],
    lastCommitId: res.headers['x-gitlab-last-commit-id'],
  }
}

// entries of a ustar/pax tar, as git archive writes it
function* tarEntries(buf) {
  let pos = 0
  let paxPath
  while (pos + 512 <= buf.length) {
    const block = buf.subarray(pos, pos + 512)
    if (block[0] === 0) break
    const field = (start, len) => block.toString('utf8', start, start + len).replace(/\0.*$/s, '')
    const size = parseInt(field(124, 12), 8) || 0
    const type = String.fromCharCode(block[156])
    const prefix = field(345, 155)
    const name = paxPath ?? (prefix ? `${prefix}/${field(0, 100)}` : field(0, 100))
    const data = buf.subarray(pos + 512, pos + 512 + size)
    pos += 512 + Math.ceil(size / 512) * 512
    paxPath = undefined
    if (type === 'x') {
      // extended header for the next entry, records are "<len> key=value\n"
      paxPath = data.toString('utf8').match(/^\d+ path=(.*)$/m)?.[1]
      continue
    }
    if (type === 'g') continue
    if (type === '0' || type === '\0') yield name
  }
}

/** Names of the files directly in a directory of the repository */
export async function listDir(dir) {
  const res = await get(
    `${API}/repository/archive.tar.gz?sha=${encodeURIComponent(REF)}&path=${encodeURIComponent(dir)}`,
  )
  const tar = gunzipSync(res.body)
  const names = []
  for (const entry of tarEntries(tar)) {
    // the archive wraps everything in a <project>-<ref>-<sha>/ directory
    const path = entry.replace(/^[^/]+\//, '')
    if (dirname(path) === dir) names.push(basename(path))
  }
  return names.sort()
}

/** A commit by sha, undefined when the lookup fails */
export async function commit(sha) {
  if (!sha) return undefined
  try {
    const res = await get(`${API}/repository/commits/${sha}`)
    const c = JSON.parse(res.body.toString('utf8'))
    return {
      sha: c.id,
      date: new Date(c.authored_date).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      author: c.author_name,
      subject: c.title,
      htmlUrl: c.web_url,
    }
  } catch {
    return undefined
  }
}