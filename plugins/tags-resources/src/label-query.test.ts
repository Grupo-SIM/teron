import type { Class, Doc, Ref } from '@hcengineering/core'
import { getLabelQuery } from './label-query'

describe('label query', () => {
  const person = 'person' as Ref<Doc>
  const employeeClass = 'employee-mixin' as Ref<Class<Doc>>

  it('loads functions without relying on the denormalized count or attachment class', () => {
    for (const count of [undefined, 0, 1]) {
      const query = getLabelQuery(person, count, employeeClass, 'functions', false)
      expect(query).toEqual({ attachedTo: person, collection: 'functions' })
      const references = [
        { attachedTo: person, collection: 'functions', attachedToClass: 'person-class' },
        { attachedTo: person, collection: 'functions', attachedToClass: employeeClass },
        { attachedTo: person, collection: 'skills', attachedToClass: employeeClass },
        { attachedTo: 'other-person', collection: 'functions', attachedToClass: employeeClass }
      ]
      expect(references.filter((ref) => Object.entries(query ?? {}).every(([key, value]) =>
        ref[key as keyof typeof ref] === value
      ))).toEqual(references.slice(0, 2))
    }
  })

  it('preserves class filtering and empty-count behavior without a collection', () => {
    expect(getLabelQuery(person, 0, employeeClass, undefined, false)).toBeUndefined()
    expect(getLabelQuery(person, 1, employeeClass, undefined, false)).toEqual({
      attachedTo: person, attachedToClass: employeeClass
    })
    expect(getLabelQuery(person, undefined, undefined, undefined, true)).toEqual({ attachedTo: person })
  })
})
