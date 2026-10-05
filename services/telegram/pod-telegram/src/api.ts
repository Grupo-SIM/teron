import { SocialIdType, type PersonId } from '@hcengineering/core'
import { getAccountClient } from '@hcengineering/server-client'
import type { Token } from '@hcengineering/server-token'
import type { Request } from 'express'

import { PlatformWorker } from './platform'
import { telegram, type TelegramDialog } from './telegram'

export type IntegrationState =
  | { status: 'authorized', number: string, socialId: PersonId }
  | { status: 'wantcode' | 'wantpassword', number: string }
  | 'Missing'

export interface RequestContext {
  rawToken: string
  token: Token
}

export const getPhone = (req: Request): string => {
  const phone = req.params.phone
  if (typeof phone !== 'string' || phone.length === 0) {
    throw new Error('Phone number is required')
  }
  return phone
}

export const getCommand = (req: Request): { command: 'start' | 'next', input?: string } => {
  const { command, input } = req.body ?? {}
  if ((command !== 'start' && command !== 'next') || (input !== undefined && typeof input !== 'string')) {
    throw new Error('Invalid Telegram authorization command')
  }
  return { command, input }
}

async function getSocialId (rawToken: string): Promise<PersonId> {
  const socialIds = await getAccountClient(rawToken).getSocialIds()
  const socialId = socialIds.find((item) => item.type === SocialIdType.EMAIL) ?? socialIds[0]
  if (socialId === undefined) {
    throw new Error('No social identity is available for this account')
  }
  return socialId._id
}

async function authorizedState (phone: string, rawToken: string): Promise<IntegrationState> {
  return { status: 'authorized', number: phone, socialId: await getSocialId(rawToken) }
}

export class TelegramIntegrationApi {
  constructor (private readonly worker: PlatformWorker) {}

  async getState ({ rawToken, token }: RequestContext, phone: string): Promise<IntegrationState> {
    const session = await this.worker.getSession(token.account, phone)
    return session === undefined ? 'Missing' : await authorizedState(phone, rawToken)
  }

  async command (
    { rawToken, token }: RequestContext,
    phone: string,
    command: 'start' | 'next',
    input?: string
  ): Promise<IntegrationState> {
    if (command === 'start') {
      const session = await this.worker.getSession(token.account, phone)
      if (session !== undefined) {
        return await authorizedState(phone, rawToken)
      }

      await telegram.auth(phone)
      return { status: 'wantcode', number: phone }
    }

    const connection = telegram.getConnection(phone)
    if (connection?.signInFlow === undefined) {
      throw new Error('Telegram authorization has not been started')
    }

    if (connection.signInFlow.state === 'code') {
      const authorized = await telegram.authCode(phone, input ?? '')
      if (!authorized) {
        return { status: 'wantpassword', number: phone }
      }
    } else if (connection.signInFlow.state === 'pass') {
      await telegram.authPass(phone, input ?? '')
    } else {
      throw new Error('Telegram authorization is already complete')
    }

    await this.worker.saveSession({ account: token.account, phone, token: connection.getToken() })
    telegram.forgetConnection(phone)
    return await authorizedState(phone, rawToken)
  }

  async disconnect ({ token }: RequestContext, phone: string): Promise<void> {
    await this.worker.removeSession(token.account, phone)
    const connection = telegram.getConnection(phone)
    telegram.forgetConnection(phone)
    await connection?.close()
  }

  async restart ({ rawToken, token }: RequestContext, phone: string): Promise<IntegrationState> {
    const session = await this.worker.getSession(token.account, phone)
    if (session === undefined) return 'Missing'

    const connection = telegram.getConnection(phone)
    if (connection !== undefined) {
      await connection.close()
      telegram.forgetConnection(phone)
    }
    return await authorizedState(phone, rawToken)
  }

  async listChats ({ token }: RequestContext, phone: string): Promise<TelegramDialog[]> {
    const session = await this.worker.getSession(token.account, phone)
    if (session === undefined) {
      throw new Error('Telegram integration is not connected')
    }

    const connection = await telegram.create(phone, session.token)
    try {
      return await connection.getDialogs()
    } finally {
      await connection.close()
    }
  }
}
