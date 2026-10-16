import { get } from 'svelte/store'
//
// Copyright © 2025 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { AccountRole, getCurrentAccount, type Ref } from '@hcengineering/core'
import { getCurrentEmployee, type Person } from '@hcengineering/contact'
import { type PopupResult, showPopup } from '@hcengineering/ui'
import { PulseSubscription } from './pulse-subscription'
import presentation, { createPulseClient } from '@hcengineering/presentation'
import { getMetadata } from '@hcengineering/platform'
import { type Room } from '@hcengineering/love'
import { joinOrCreateMeetingByInvite } from './meetings'
import { roomNotificationsMuted } from './room-notifications'
import JoinRequestPopup from './components/meeting/invites/JoinRequestPopup.svelte'
import JoinResponsePopup from './components/meeting/invites/JoinResponsePopup.svelte'

export const joinRequestSecondsToLive = 5
const responseSecondsToLive = 2

const pulsePrefix = 'love/join'

export interface JoinRequest {
  from: Ref<Person>
  meetingId: string
}

export interface JoinResponse {
  meetingId: string
  accept: boolean
}

const requestPopupCategory = 'joinRequest'
const responseSubscription = new PulseSubscription()
let requestPopup: PopupResult | undefined
let requestMeetingId: string | undefined

export async function subscribeJoinResponses (): Promise<void> {
  const currentPerson = getCurrentEmployee()
  await responseSubscription.start<JoinResponse>(
    `${getPulsePrefix()}/response/${currentPerson}/`,
    (key, response) => { void onJoinResponse(key, response) }
  )
}

export async function unsubscribeJoinResponses (): Promise<void> {
  await responseSubscription.stop()
}

export function sendJoinRequest (meetingId: string): void {
  if (getCurrentAccount().role === AccountRole.ReadOnlyGuest) return
  closeJoinRequestPopup()
  requestMeetingId = meetingId
  requestPopup = showPopup(JoinRequestPopup, { meetingId }, undefined, undefined, undefined, {
    category: requestPopupCategory,
    overlay: false,
    fixed: true
  })
}

export function closeJoinRequestPopup (): void {
  requestPopup?.close()
  requestPopup = undefined
}

export async function updateJoinRequest (meetingId = requestMeetingId): Promise<void> {
  if (meetingId === undefined || meetingId !== requestMeetingId) return
  if (getCurrentAccount().role === AccountRole.ReadOnlyGuest) return
  const client = await createPulseClient()
  const currentPerson = getCurrentEmployee()

  if (client === undefined || meetingId !== requestMeetingId) return

  try {
    await client.put(
      `${getPulsePrefix()}/request/${meetingId}/${currentPerson}`,
      { from: currentPerson, meetingId },
      joinRequestSecondsToLive
    )
  } catch (error) {
    console.warn('failed to put joinRequest:', error)
  }
}

export async function cancelJoinRequest (meetingId = requestMeetingId): Promise<void> {
  if (meetingId === undefined) return
  if (requestMeetingId === meetingId) requestMeetingId = undefined
  const client = await createPulseClient()
  const currentPerson = getCurrentEmployee()

  if (client === undefined) return
  try {
    await client.delete(`${getPulsePrefix()}/request/${meetingId}/${currentPerson}`)
  } catch (error) {
    console.warn('failed to delete invite info:', error)
  }
}

async function onJoinResponse (_key: string, response: JoinResponse | undefined): Promise<void> {
  if (response === undefined || requestMeetingId !== response.meetingId) return

  // Claim the response before any await so repeated events cannot join twice.
  requestMeetingId = undefined
  closeJoinRequestPopup()
  try {
    const client = await createPulseClient()
    if (client !== undefined) {
      const currentPerson = getCurrentEmployee()
      await client.delete(`${getPulsePrefix()}/request/${response.meetingId}/${currentPerson}`)
      await client.delete(`${getPulsePrefix()}/response/${currentPerson}/${response.meetingId}`)
    }
  } catch (error) {
    console.warn('failed to clean up join response:', error)
  }
  if (!response.accept) return
  await joinOrCreateMeetingByInvite(response.meetingId as Ref<Room>)
}

const responsePopupCategory = 'joinResponse'
let responsePopup: PopupResult | undefined
const requestSubscription = new PulseSubscription()
let activeRequestKey: string | undefined
let activeRequestsMap: Map<string, JoinRequest | undefined> | undefined

roomNotificationsMuted.subscribe((enabled) => {
  if (!enabled) return
  responsePopup?.close()
  responsePopup = undefined
  activeRequestKey = undefined
  activeRequestsMap?.clear()
})

export async function subscribeJoinRequests (meetingId: string | undefined): Promise<void> {
  if (getCurrentAccount().role === AccountRole.ReadOnlyGuest) return
  if (meetingId === undefined) return

  activeRequestsMap = new Map<string, JoinRequest>()
  await requestSubscription.start(`${getPulsePrefix()}/request/${meetingId}/`, onJoinRequest)
}

export async function unsubscribeJoinRequests (): Promise<void> {
  activeRequestsMap = undefined
  await requestSubscription.stop()
  responsePopup?.close()
  responsePopup = undefined
  activeRequestKey = undefined
}

export async function responseToJoinRequest (joinRequest: JoinRequest, accept: boolean): Promise<void> {
  if (activeRequestKey === undefined) return

  const requestKey = activeRequestKey
  const requests = activeRequestsMap
  const activeRequest = requests?.get(requestKey)
  if (activeRequest === undefined) return

  const client = await createPulseClient()
  if (client === undefined) return

  await client.put(
    `${getPulsePrefix()}/response/${joinRequest.from}/${joinRequest.meetingId}`,
    { accept, meetingId: joinRequest.meetingId },
    responseSecondsToLive
  )

  if (activeRequestKey === requestKey) {
    responsePopup?.close()
    responsePopup = undefined
    activeRequestKey = undefined
  }
  if (requests?.has(requestKey) === true) requests.set(requestKey, undefined)

  if (!accept) return
  await joinOrCreateMeetingByInvite(joinRequest.meetingId as Ref<Room>)
}

function onJoinRequest (key: string, request: JoinRequest | undefined): void {
  if (activeRequestsMap === undefined) return
  if (request === undefined) {
    activeRequestsMap.delete(key)
    if (activeRequestKey === key) {
      activeRequestKey = undefined
    }
  } else if (!activeRequestsMap.has(key)) {
    activeRequestsMap.set(key, request)
  }
  if (get(roomNotificationsMuted)) {
    responsePopup?.close()
    responsePopup = undefined
    activeRequestKey = undefined
    activeRequestsMap.clear()
    return
  }
  let keyChanged: boolean = false
  if (activeRequestKey === undefined && activeRequestsMap.size > 0) {
    const requests = Array.from(activeRequestsMap.entries())
    const unprocessedRequest = requests.find((v: [string, JoinRequest | undefined]) => v[1] !== undefined)
    if (unprocessedRequest !== undefined) {
      activeRequestKey = unprocessedRequest[0]
      keyChanged = true
    }
  }
  if (activeRequestKey === undefined) {
    responsePopup?.close()
    responsePopup = undefined
    return
  }

  if (responsePopup === undefined) {
    responsePopup = showPopup(
      JoinResponsePopup,
      { request: activeRequestsMap.get(activeRequestKey) },
      undefined,
      undefined,
      undefined,
      {
        category: responsePopupCategory,
        overlay: false,
        fixed: true
      }
    )
    return
  }
  if (keyChanged) {
    responsePopup?.update({ request: activeRequestsMap.get(activeRequestKey) })
  }
}

function getPulsePrefix (): string {
  const workspace = getMetadata(presentation.metadata.WorkspaceUuid) ?? ''
  return `${workspace}/${pulsePrefix}`
}
