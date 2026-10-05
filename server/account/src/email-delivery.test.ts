// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

import { type MeasureContext } from '@hcengineering/core'
import { getMetadata } from '@hcengineering/platform'

import { accountPlugin } from './plugin'
import { sendEmail } from './utils'

jest.mock('@hcengineering/platform', () => {
  const actual = jest.requireActual('@hcengineering/platform')
  return { ...actual, ...actual.default, getMetadata: jest.fn() }
})

describe('sendEmail', () => {
  const ctx = { error: jest.fn() } as unknown as MeasureContext

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getMetadata as jest.Mock).mockImplementation((key) => {
      if (key === accountPlugin.metadata.MAIL_URL) return 'https://mail.example.com'
      return undefined
    })
  })

  it('rejects when the mail service rejects delivery', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' })

    await expect(
      sendEmail(
        { to: 'to@example.com', subject: 'Invite', text: 'Text', html: '<p>Text</p>' },
        ctx
      )
    ).rejects.toThrow('Mail service rejected email')
  })

  it('sends the mail service API key in the request body', async () => {
    ;(getMetadata as jest.Mock).mockImplementation((key) => {
      if (key === accountPlugin.metadata.MAIL_URL) return 'https://mail.example.com'
      if (key === accountPlugin.metadata.MAIL_AUTH_TOKEN) return 'mail-api-key'
      return undefined
    })
    global.fetch = jest.fn().mockResolvedValue({ ok: true })

    await sendEmail({ to: 'to@example.com', subject: 'Invite', text: 'Text', html: '<p>Text</p>' }, ctx)

    const request = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit
    expect(JSON.parse(request.body as string)).toMatchObject({ apiKey: 'mail-api-key', to: 'to@example.com' })
  })
})
