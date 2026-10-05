/** Apply assignment criteria to canonical lists and legacy scalar assignments. */
export function assignmentFilterQuery (value: Record<string, any>): Record<string, any> {
  const all: string[] | undefined = value.$all
  const legacy = all === undefined
    ? value
    : all.length > 1 ? { $in: [] } : { $in: all }
  return {
    $or: [
      { assignees: value },
      { assignees: { $exists: false }, assignee: legacy }
    ]
  }
}
