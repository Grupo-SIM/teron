import { type Filter, type KeyFilter } from '@hcengineering/view'
import view from './plugin'

/** Upgrade persisted single-person selections to the current array filter contract. */
export function normalizeStoredFilters (
  filters: Filter[],
  resolveAssignees: (filter: Filter) => KeyFilter | undefined
): Filter[] {
  return filters.flatMap((filter) => {
    if (filter.key.key === 'assignees' && filter.key.component === view.component.ArrayFilter) {
      if (filter.value.length === 0) return []
      return [{ ...filter, value: filter.value.flatMap((entry) =>
        (entry[1] as string[]).map((person) => [person, [person]])
      ) }]
    }
    if (filter.key.key !== 'assignee') return [filter]
    const key = resolveAssignees(filter)
    if (key === undefined || (filter.mode !== view.filter.FilterObjectIn && filter.mode !== view.filter.FilterObjectNin)) return [filter]
    if (filter.value.some((person) => typeof person !== 'string')) return [filter]
    const value = filter.value
      .filter((person): person is string => typeof person === 'string')
      .map((person) => [person, [person]])
    if (value.length === 0) return []
    return [{
      ...filter,
      key,
      value,
      modes: [view.filter.FilterArrayAll, view.filter.FilterArrayAny, view.filter.FilterObjectNin],
      mode: filter.mode === view.filter.FilterObjectNin ? view.filter.FilterObjectNin : view.filter.FilterArrayAny
    }]
  })
}
