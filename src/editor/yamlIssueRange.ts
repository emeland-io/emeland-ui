import { isMap, isSeq, parseAllDocuments, type Pair } from 'yaml'

export interface SourceRange {
  from: number
  to: number
}

function pairKey(pair: Pair): string | undefined {
  const key = pair.key as { value?: unknown } | null
  if (key == null || typeof key !== 'object' || !('value' in key)) return undefined
  const value = key.value
  if (value == null) return undefined
  return String(value)
}

function clamp(text: string, from: number, to: number): SourceRange {
  const max = text.length
  const start = Math.max(0, Math.min(from, max))
  let end = Math.max(start, Math.min(to, max))
  while (end > start && /\s/.test(text[end - 1]!)) end -= 1
  if (end === start && start < max) end = start + 1
  return { from: start, to: end }
}

function nodeRange(
  text: string,
  node: { range?: [number, number, number] | null } | null | undefined,
): SourceRange | null {
  const range = node?.range
  if (!range) return null
  return clamp(text, range[0], range[1])
}

function pairRange(text: string, pair: Pair): SourceRange | null {
  const key = pair.key as { range?: [number, number, number] | null } | null
  const value = pair.value as { range?: [number, number, number] | null } | null
  const from = key?.range?.[0]
  const to = value?.range?.[1] ?? key?.range?.[1]
  if (from == null || to == null) return nodeRange(text, value) ?? nodeRange(text, key)
  return clamp(text, from, to)
}

/** Parent key line only — used when a nested path is missing. */
function pairKeyLine(text: string, pair: Pair): SourceRange | null {
  const key = pair.key as { range?: [number, number, number] | null } | null
  const from = key?.range?.[0]
  if (from == null) return null
  let lineEnd = text.indexOf('\n', from)
  if (lineEnd < 0) lineEnd = text.length
  return clamp(text, from, lineEnd)
}

function longestMapKey(pairs: Pair[], remaining: string): string | undefined {
  let best: string | undefined
  for (const pair of pairs) {
    const key = pairKey(pair)
    if (key == null) continue
    if (remaining === key || remaining.startsWith(`${key}.`)) {
      if (!best || key.length > best.length) best = key
    }
  }
  return best
}

function walk(text: string, node: unknown, remaining: string): SourceRange | null {
  if (node == null) return null

  if (isMap(node)) {
    const key = longestMapKey(node.items, remaining)
    if (key == null) return null
    const pair = node.items.find((item) => pairKey(item) === key)
    if (!pair) return null
    const rest = remaining.slice(key.length)
    if (!rest) return pairRange(text, pair)
    return walk(text, pair.value, rest.slice(1)) ?? pairKeyLine(text, pair)
  }

  if (isSeq(node)) {
    const match = remaining.match(/^(\d+)(?:\.(.*))?$/)
    if (!match) return nodeRange(text, node)
    const item = node.get(Number(match[1]), true)
    if (match[2]) return walk(text, item, match[2]) ?? nodeRange(text, item)
    return nodeRange(text, item)
  }

  return nodeRange(text, node as { range?: [number, number, number] | null })
}

export function issueSourceRange(text: string, path: string): SourceRange | null {
  if (!text) return null

  const docs = parseAllDocuments(text)
  if (!docs.length) return null

  let rest = path
  let doc = docs[0]
  const docMatch = path.match(/^document\[(\d+)\](?:\.(.*))?$/)
  if (docMatch) {
    doc = docs[Number(docMatch[1])] ?? docs[0]
    rest = docMatch[2] ?? ''
  }
  if (!doc) return null

  if (!rest) return nodeRange(text, doc.contents) ?? nodeRange(text, doc)

  return walk(text, doc.contents, rest)
}
