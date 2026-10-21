import type { Class, Doc, DocumentQuery, Ref } from '@hcengineering/core'
import type { TagReference } from '@hcengineering/tags'

export function getLabelQuery (
  attachedTo: Ref<Doc>,
  count: number | undefined,
  targetClass: Ref<Class<Doc>> | undefined,
  collection: string | undefined,
  queryWhenEmpty: boolean
): DocumentQuery<TagReference> | undefined {
  // Parent and collection identify the references regardless of which class or
  // mixin an editor used to attach them. Collection counts can be stale.
  if (collection !== undefined) return { attachedTo, collection }
  if (!(count !== undefined && count > 0) && !queryWhenEmpty) return undefined
  return { attachedTo, ...(targetClass !== undefined ? { attachedToClass: targetClass } : {}) }
}
