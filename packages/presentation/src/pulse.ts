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
// limitations under the License

import { HulypulseClient } from '@hcengineering/hulypulse-client'
import { getMetadata } from '@hcengineering/platform'
import presentation from './plugin'

let currentWorkspaceUuid: string | undefined
let currentToken: string | undefined
let currentPulseUrl: string | undefined
let promise: Promise<HulypulseClient | undefined> | undefined

export async function createPulseClient (): Promise<HulypulseClient | undefined> {
  const pulseUrl = getMetadata(presentation.metadata.PulseUrl) ?? ''
  const token = getMetadata(presentation.metadata.Token) ?? ''
  const workspaceUuid = getMetadata(presentation.metadata.WorkspaceUuid) ?? ''

  if (pulseUrl === '' || token === '' || workspaceUuid === '') {
    return undefined
  }

  // Credentials or endpoint changed, need to reconnect
  if (token !== currentToken || workspaceUuid !== currentWorkspaceUuid || pulseUrl !== currentPulseUrl) {
    closePulseClient()
  }

  if (promise !== undefined) {
    // eslint-disable-next-line @typescript-eslint/return-await
    return promise
  }

  const connection = HulypulseClient.connect(`${pulseUrl}?token=${token}`).catch(() => {
    // A transient connection failure must not disable invitations until reload.
    // Do not clear a newer connection if credentials changed while this one failed.
    if (promise === connection) promise = undefined
    return undefined
  })
  promise = connection
  currentToken = token
  currentPulseUrl = pulseUrl
  currentWorkspaceUuid = workspaceUuid

  // eslint-disable-next-line @typescript-eslint/return-await
  return promise
}

export function closePulseClient (): void {
  if (promise !== undefined) {
    void promise.then((client) => {
      client?.close()
    })
  }
  promise = undefined
  currentToken = undefined
  currentPulseUrl = undefined
  currentWorkspaceUuid = undefined
}
