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

export interface SimintpayBillingContract {
  id: string
  quantity: number
  pendingQuantity: number | null
  version: number
  unitAmount: string
  recurringAmount: string
  currentPeriodStart: string
  currentPeriodEnd: string
}

export interface SimintpayQuantityChange {
  id: string
  contractId: string
  status: 'APPLIED' | 'SCHEDULED' | 'PENDING_PAYMENT' | 'PENDING_RECURRENCE_UPDATE' | 'FAILED' | 'COMPENSATION_REQUIRED'
  previousQuantity: number
  targetQuantity: number
  effectiveQuantity: number
  scheduledFor: string | null
  prorationAmount: string
  nextRecurringAmount: string
  failureCode: string | null
  failureMessage: string | null
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
    throw new PlatformError(new Status(Severity.ERROR, 'SimintpayNotConfigured' as any, {}))
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
    throw new PlatformError(new Status(Severity.ERROR, 'InvalidWorkspaceSeats' as any, {}))
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
    throw new PlatformError(new Status(Severity.ERROR, 'WorkspacePaymentUnavailable' as any, {}))
  }
  if (!response.ok) {
    const body = await response.text()
    throw new PlatformError(new Status(Severity.ERROR, workspacePaymentErrorCode(response.status, body) as any, {}))
  }
  return (await response.json()) as SimintpayWorkspaceSubscription
}

async function internalRequest<T> (path: string, init?: RequestInit): Promise<T> {
  const config = configuration()
  const headers = new Headers(init?.headers)
  headers.set('content-type', 'application/json')
  headers.set('x-internal-token', config.token)
  let response: Response
  try {
    response = await fetch(`${config.url.replace(/\/$/, '')}/internal/billing${path}`, {
      ...init,
      headers
    })
  } catch {
    throw new PlatformError(new Status(Severity.ERROR, 'WorkspacePaymentUnavailable' as any, {}))
  }
  if (!response.ok) {
    const body = await response.text()
    throw new PlatformError(new Status(Severity.ERROR, workspacePaymentErrorCode(response.status, body) as any, {}))
  }
  return (await response.json()) as T
}

export async function getWorkspaceBillingContract (workspace: WorkspaceUuid): Promise<SimintpayBillingContract> {
  return await internalRequest(`/contracts/by-resource/WORKSPACE/${encodeURIComponent(workspace)}`)
}

export async function cancelWorkspaceBillingContract (contractId: string): Promise<SimintpayBillingContract> {
  return await internalRequest(`/contracts/${encodeURIComponent(contractId)}/cancel`, { method: 'POST' })
}

export async function requestWorkspaceQuantityChange (
  contract: SimintpayBillingContract,
  workspace: WorkspaceUuid,
  targetQuantity: number,
  operationId: string
): Promise<SimintpayQuantityChange> {
  return await internalRequest(`/contracts/${encodeURIComponent(contract.id)}/quantity-changes`, {
    method: 'POST',
    headers: { 'idempotency-key': `workspace:${workspace}:quantity:${operationId}` },
    body: JSON.stringify({ targetQuantity, expectedVersion: contract.version })
  })
}

export async function getWorkspaceQuantityChange (
  contractId: string,
  changeId: string
): Promise<SimintpayQuantityChange> {
  return await internalRequest(
    `/contracts/${encodeURIComponent(contractId)}/quantity-changes/${encodeURIComponent(changeId)}`
  )
}
