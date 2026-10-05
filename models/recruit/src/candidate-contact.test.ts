import type { Person } from '@hcengineering/contact'
import { candidateContactUpdate } from './candidate-contact'

describe('candidateContactUpdate', () => {
  const person = { name: 'Ana' } as Person

  it('preserves candidate title and source on the external contact', () => {
    expect(candidateContactUpdate(person, { title: 'Designer', source: 'Indicação', skills: 2 })).toEqual({
      professionalTitle: 'Designer',
      contactSource: 'Indicação',
      skills: 2
    })
  })

  it('does not replace contact edits on a repeated migration', () => {
    expect(candidateContactUpdate({ ...person, professionalTitle: 'Líder' }, { title: 'Designer' })).toEqual({})
    expect(candidateContactUpdate({ ...person, skills: 3 }, { skills: 2 })).toEqual({})
    expect(candidateContactUpdate(person, undefined)).toEqual({})
  })
})
