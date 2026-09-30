import type { Person } from '@hcengineering/contact'
import { candidateContactUpdate } from './candidate-contact'

describe('candidateContactUpdate', () => {
  const person = { name: 'Ana' } as Person

  it('preserves candidate title and source on the external contact', () => {
    expect(candidateContactUpdate(person, { title: 'Designer', source: 'Indicação' })).toEqual({
      professionalTitle: 'Designer',
      contactSource: 'Indicação'
    })
  })

  it('does not replace contact edits on a repeated migration', () => {
    expect(candidateContactUpdate({ ...person, professionalTitle: 'Líder' }, { title: 'Designer' })).toEqual({})
    expect(candidateContactUpdate(person, undefined)).toEqual({})
  })
})
