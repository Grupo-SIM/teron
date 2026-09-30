import type { Person } from '@hcengineering/contact'
import type { Candidate } from '@hcengineering/recruit'

export function candidateContactUpdate (person: Person, candidate: Partial<Candidate> | undefined): Partial<Person> {
  if (candidate === undefined) return {}
  return {
    ...(candidate.title && !person.professionalTitle ? { professionalTitle: candidate.title } : {}),
    ...(candidate.source && !person.contactSource ? { contactSource: candidate.source } : {})
  }
}
