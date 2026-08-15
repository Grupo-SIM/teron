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
  const unitAmount = process.env.SIMINTPAY_WORKSPACE_SEAT_AMOUNT
  if (url == null || token == null || ownerId == null || unitAmount == null) {
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
  const response = await fetch(`${config.url.replace(/\/$/, '')}/internal/billing/workspace-subscriptions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-token': config.token },
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
  if (!response.ok) {
    const body = await response.text()
    throw new PlatformError(new Status(Severity.ERROR, 'WorkspacePaymentFailed', { body: body.slice(0, 1000) }))
  }
  return (await response.json()) as SimintpayWorkspaceSubscription
}
