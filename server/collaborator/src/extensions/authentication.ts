//
// Copyright © 2023 Hardcore Engineering Inc.
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

import { decodeDocumentId } from '@hcengineering/collaborator-client'
import { MeasureContext } from '@hcengineering/core'
import { decodeToken } from '@hcengineering/server-token'
import { Extension, onAuthenticatePayload, beforeHandleMessagePayload, onDisconnectPayload } from '@hocuspocus/server'
import { isReadOnlyOrGuest } from '@hcengineering/account'

import { Context, buildContext } from '../context'
import { getWorkspaceIds } from '../utils'
import { openCollaborationAccess } from '../collaboration-access'

export interface AuthenticationConfiguration {
  ctx: MeasureContext
}

export class AuthenticationExtension implements Extension {
  private readonly configuration: AuthenticationConfiguration

  constructor (configuration: AuthenticationConfiguration) {
    this.configuration = configuration
  }

  async onAuthenticate (data: onAuthenticatePayload): Promise<Context> {
    const ctx = this.configuration.ctx
    const { workspaceId } = decodeDocumentId(data.documentName)

    return await ctx.with(
      'authenticate',
      {},
      async () => {
        const token = decodeToken(data.token)
        const readonly = isReadOnlyOrGuest(token.account, token.extra)

        ctx.info('authenticate', {
          workspaceId,
          account: token.account,
          mode: token.extra?.mode ?? '',
          readonly
        })

        if (readonly) {
          data.connection.readOnly = true
        }

        // verify workspace can be accessed with the token
        const ids = await getWorkspaceIds(data.token)

        // verify workspace uuid in the document matches the token
        if (ids.uuid !== workspaceId) {
          throw new Error('documentName must include workspace id')
        }

        const authorization = await openCollaborationAccess(token, data.documentName, data.requestParameters.get('content') ?? undefined)
        data.connection.readOnly = readonly || await authorization.check()
        authorization.client.notify = () => {
          void authorization.check().then((readOnly) => {
            const connection = data.instance.documents.get(data.documentName)?.getConnections().find((item) => item.socketId === data.socketId)
            if (connection !== undefined) connection.readOnly = readonly || readOnly
          }).catch(() => {
            data.instance.documents.get(data.documentName)?.getConnections().find((item) => item.socketId === data.socketId)?.close({ code: 4403, reason: 'Document access revoked' })
          })
        }
        return { ...buildContext(data, ids), authorization }
      },
      { workspaceId }
    )
  }

  async beforeHandleMessage (data: beforeHandleMessagePayload): Promise<void> {
    const authorization = (data.context as Context).authorization
    if (authorization === undefined) throw new Error('Missing collaboration authorization.')
    try {
      data.connection.readOnly = await authorization.check()
    } catch (error) {
      data.connection.close({ code: 4403, reason: 'Document access revoked' })
      throw error
    }
  }

  async onDisconnect (data: onDisconnectPayload): Promise<void> {
    await (data.context as Context).authorization?.close()
  }
}
