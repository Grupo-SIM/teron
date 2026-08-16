//
// Copyright © 2026 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
//

import { renderBrandedEmail } from '../email'

describe('renderBrandedEmail', () => {
  it('wraps legacy translated fragments in the Teron email shell', () => {
    const result = renderBrandedEmail('<h3>Confirm your email</h3><p>Message</p>')

    expect(result).toContain('https://teron.app/assets/teron-email-logo.png')
    expect(result).toContain("'Manrope','Segoe UI',Arial,sans-serif")
    expect(result).toContain('background-color:#090a0f')
    expect(result).toContain('<h3>Confirm your email</h3><p>Message</p>')
  })

  it('uses the requested locale and the light-mode logo in the document', () => {
    const result = renderBrandedEmail('<h3>Recupere sua senha</h3>', 'pt-br')

    expect(result).toContain('<html lang="pt-BR">')
    expect(result).toContain('<img src="https://teron.app/assets/teron-email-logo.png"')
  })

  it('replaces the previous shell without nesting complete documents', () => {
    const oldHtml =
      '<!DOCTYPE html><html><body><table><tr><td style="background-color:#FFFFFF;padding:36px 40px;border:1px solid #E4E4E7"><h1>Reset password</h1></td></tr><tr><td align="center" style="padding:20px 0"><p>Footer</p></td></tr></table></body></html>'
    const result = renderBrandedEmail(oldHtml)

    expect(result.match(/<!DOCTYPE html>/g)).toHaveLength(1)
    expect(result).toContain('<h1>Reset password</h1>')
    expect(result).not.toContain('<p>Footer</p>')
  })

  it('maps the previous neutral palette to the Teron palette', () => {
    const result = renderBrandedEmail(
      '<p style="color:#52525B">Message</p><a style="background-color:#18181B;color:#FFFFFF">Action</a>'
    )

    expect(result).toContain('color:#B6B6BB')
    expect(result).toContain('background-color:#2F6BFF')
  })

  it('promotes the primary link in legacy fragments to a button', () => {
    const result = renderBrandedEmail(
      '<p>Para redefinir sua senha, clique no botão abaixo: <a href="https://teron.app/reset">Redefinir senha</a></p><p>Se o botão acima não funcionar, use o fallback.</p>',
      'pt-br'
    )

    expect(result).toContain('background-color:#2F6BFF;border-radius:8px')
    expect(result).toContain('Redefinir senha &rarr;')
    expect(result).toContain('clique no botão abaixo:')
    expect(result).toContain('Se o botão acima não funcionar')
  })
})
