// Copyright © 2026 Hardcore Engineering Inc.
// Licensed under the Eclipse Public License, Version 2.0.

import { Analytics } from '@hcengineering/analytics'
import { type MeasureContext } from '@hcengineering/core'
import { type Transporter } from 'nodemailer'

import { MailClient } from './mail'
import { getDefaultTransport } from './transport'

jest.mock('@hcengineering/analytics', () => ({ Analytics: { handleError: jest.fn() } }))
jest.mock('./config', () => ({ __esModule: true, default: {} }))
jest.mock('./transport', () => ({ getDefaultTransport: jest.fn(), getSmtpTransport: jest.fn() }))

describe('MailClient', () => {
  const info = jest.fn()
  const error = jest.fn()
  const ctx = {
    info,
    error,
    with: jest.fn(async (_name, _params, operation) => await operation({ info, error }))
  } as unknown as MeasureContext

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('waits for SMTP acceptance', async () => {
    const sendMail = jest.fn().mockResolvedValue({ response: '250 accepted' })
    ;(getDefaultTransport as jest.Mock).mockReturnValue({ sendMail } as unknown as Transporter)
    const client = new MailClient()

    await client.sendMessage({ from: 'from@example.com', to: 'to@example.com', subject: 'Test' }, ctx)

    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('250 accepted'))
  })

  it('propagates SMTP rejection', async () => {
    const smtpError = new Error('550 rejected')
    const sendMail = jest.fn().mockRejectedValue(smtpError)
    ;(getDefaultTransport as jest.Mock).mockReturnValue({ sendMail } as unknown as Transporter)
    const client = new MailClient()

    await expect(
      client.sendMessage({ from: 'from@example.com', to: 'to@example.com', subject: 'Test' }, ctx)
    ).rejects.toThrow('550 rejected')
    expect(Analytics.handleError).toHaveBeenCalledWith(smtpError)
  })
})
