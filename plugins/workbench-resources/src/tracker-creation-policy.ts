/** Tracker content creation is unrestricted except for sectors. */
export function isUnrestrictedTrackerCreation (identifier: unknown): boolean {
  return typeof identifier === 'string' &&
    ((identifier.startsWith('tracker:component:') && identifier !== 'tracker:component:CreateProject') ||
      (identifier.startsWith('tracker:class:') && identifier !== 'tracker:class:Project'))
}
