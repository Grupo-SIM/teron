import { PlatformError, Severity, Status } from '@hcengineering/platform'
import type { AccountUuid, WorkspaceUuid } from '@hcengineering/core'

export interface WorkspacePaymentDetails {
  seats: number
  customerDocument: string
  customerPhone: string
  card: {
    number: string
    expMonth: string
    expYear: string
    cvv: string
    holderName: string
    holderDocument: string
  }
}

interface SimintpayWorkspaceSubscription {
  contractId: string
  externalSubscriptionId: string
  currentPeriodStart: string
  currentPeriodEnd: string
}

function responseMessage (body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: unknown, error?: unknown }
    const message = parsed.message ?? parsed.error
    if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join(' ')
    if (typeof message === 'string') return message
  } catch {
    // Non-JSON responses are still useful for the generic fallback below.
  }
  return body
}

export function workspacePaymentErrorCode (status: number, body: string): string {
  const message = responseMessage(body).toLowerCase()
  if (status === 400 && message.includes('pagamento ainda não foi aprovado pelo gateway')) {
    return 'WorkspacePaymentDeclined'
  }
  if (status === 400 || status === 422) return 'WorkspacePaymentInvalidDetails'
  if (status === 401 || status === 403) return 'SimintpayNotConfigured'
  if (status === 408 || status === 429 || status >= 500) return 'WorkspacePaymentUnavailable'
  return 'WorkspacePaymentFailed'
}

function configuration (): {
  url: string
  token: string
  ownerId: string
  baseAmount: string
  unitAmount: string
} {
  const url = process.env.SIMINTPAY_API_URL
  const token = process.env.SIMINTPAY_INTERNAL_TOKEN
  const ownerId = process.env.SIMINTPAY_BILLING_OWNER_ID
  const unitAmount = process.env.SIMINTPAY_WORKSPACE_SEAT_AMOUNT ?? '9.99'
  if (url == null || token == null || ownerId == null) {
    throw new PlatformError(new Status(Severity.ERROR, 'SimintpayNotConfigured', {}))
  }
  return { url, token, ownerId, baseAmount: process.env.SIMINTPAY_WORKSPACE_BASE_AMOUNT ?? '0.00', unitAmount }
}

export async function createPaidWorkspaceSubscription (
  account: AccountUuid,
  workspace: WorkspaceUuid,
  customer: { name: string, email: string },
  payment: WorkspacePaymentDetails
): Promise<SimintpayWorkspaceSubscription> {
  if (!Number.isInteger(payment.seats) || payment.seats < 1) {
    throw new PlatformError(new Status(Severity.ERROR, 'InvalidWorkspaceSeats', {}))
  }
  const config = configuration()
  let response: Response
  try {
    response = await fetch(`${config.url.replace(/\/$/, '')}/internal/billing/workspace-subscriptions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-token': config.token,
        // Stable for the workspace creation attempt. Never derived from card data.
        'idempotency-key': `workspace:${workspace}`
      },
      body: JSON.stringify({
        billingOwnerId: config.ownerId,
        accountId: account,
        resourceId: workspace,
        quantity: payment.seats,
        baseAmount: config.baseAmount,
        unitAmount: config.unitAmount,
        customer: {
          name: customer.name,
          email: customer.email,
          document: payment.customerDocument,
          phone: payment.customerPhone
        },
        card: {
          number: payment.card.number,
          exp_month: payment.card.expMonth,
          exp_year: payment.card.expYear,
          cvv: payment.card.cvv,
          holder_name: payment.card.holderName,
          holder_document: payment.card.holderDocument,
          token: ''
        }
      })
    })
  } catch {
    throw new PlatformError(new Status(Severity.ERROR, 'WorkspacePaymentUnavailable', {}))
  }
  if (!response.ok) {
    const body = await response.text()
    throw new PlatformError(new Status(Severity.ERROR, workspacePaymentErrorCode(response.status, body), {}))
  }
  return (await response.json()) as SimintpayWorkspaceSubscription
}
