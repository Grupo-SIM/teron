import { type Class, type Doc, type Ref, type TxOperations } from '@hcengineering/core'
import tags, { type TagElement } from '@hcengineering/tags'

/** Create a reference only if this object does not already have the tag in this collection. */
export async function addTagReference (
  client: TxOperations,
  object: Doc,
  targetClass: Ref<Class<Doc>>,
  collection: string,
  { title, color, _id: tag }: TagElement
): Promise<boolean> {
  // A shared scope serializes concurrent assignments, including across browser tabs.
  const ops = client.apply(`tag-reference:${object._id}`)
  ops.notMatch(tags.class.TagReference, { attachedTo: object._id, collection, tag })
  await ops.addCollection(tags.class.TagReference, object.space, object._id, targetClass, collection, {
    title,
    color,
    tag
  })
  return (await ops.commit()).result
}
