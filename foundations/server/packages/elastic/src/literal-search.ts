import { normalizeSearch } from '@hcengineering/core'

/** Wildcards in user input are literal; only the surrounding stars implement substring search. */
export function literalSearchQuery (query: string): Record<string, unknown> {
  const value = normalizeSearch(query).replace(/[\\*?]/g, '\\$&')
  return { wildcard: { literalSearch: { value: `*${value}*` } } }
}

export function literalSearchValues (doc: Record<string, unknown>): string[] {
  const values = new Set<string>()
  const visit = (value: unknown): void => {
    if (typeof value === 'string') values.add(normalizeSearch(value))
    else if (Array.isArray(value)) value.forEach(visit)
    else if (value !== null && typeof value === 'object') Object.values(value).forEach(visit)
  }
  for (const [key, value] of Object.entries(doc)) {
    if (!['literalSearch', 'data', 'workspaceId', 'id', '_id', '_class', 'space', 'baseId', 'attachedTo', 'attachedToClass', 'modifiedBy', 'modifiedOn'].includes(key)) visit(value)
  }
  return values.size === 0 ? [''] : [...values]
}
