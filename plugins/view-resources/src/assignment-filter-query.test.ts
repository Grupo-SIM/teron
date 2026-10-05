import { assignmentFilterQuery } from './assignment-filter-query'

describe('assignment filter queries', () => {
  it('matches one selected person in both lists and legacy scalar assignments', () => {
    expect(assignmentFilterQuery({ $all: ['person-a'] })).toEqual({
      $or: [
        { assignees: { $all: ['person-a'] } },
        { assignees: { $exists: false }, assignee: { $in: ['person-a'] } }
      ]
    })
  })

  it('requires every person for all mode; a scalar cannot match multiple people', () => {
    expect(assignmentFilterQuery({ $all: ['a', 'b'] }).$or[1].assignee).toEqual({ $in: [] })
  })

  it('supports any and exclusion modes without reviving explicitly empty lists', () => {
    for (const value of [{ $in: ['a', 'b'] }, { $nin: ['a'] }]) {
      expect(assignmentFilterQuery(value).$or).toEqual([
        { assignees: value },
        { assignees: { $exists: false }, assignee: value }
      ])
    }
  })
})
