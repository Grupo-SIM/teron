interface MeetingPresence {
  _id: string
  room: string
  sessionId: string | null
}

export function shouldRestoreMeetingPresence (
  previous: MeetingPresence | undefined,
  current: MeetingPresence | undefined,
  meetingRoom: string | undefined,
  sessionId: string | null,
  defaultRoom: string,
  roomExists: boolean
): boolean {
  return roomExists && meetingRoom !== undefined && sessionId !== null &&
    previous !== undefined && current !== undefined && previous._id !== current._id &&
    previous.room === meetingRoom && previous.sessionId === sessionId &&
    current.sessionId === null && current.room === defaultRoom && current.room !== meetingRoom
}
