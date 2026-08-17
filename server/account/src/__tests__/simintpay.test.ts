import { workspacePaymentErrorCode } from '../simintpay'

describe('workspacePaymentErrorCode', () => {
  it('mapeia recusa da DOM para erro de pagamento exibível', () => {
    expect(workspacePaymentErrorCode(400, JSON.stringify({
      message: 'O pagamento ainda não foi aprovado pelo gateway'
    }))).toBe('WorkspacePaymentDeclined')
  })

  it('mapeia indisponibilidade do gateway', () => {
    expect(workspacePaymentErrorCode(503, 'temporarily unavailable')).toBe('WorkspacePaymentUnavailable')
  })
})
