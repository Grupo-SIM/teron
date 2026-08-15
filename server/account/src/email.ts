//
// Copyright © 2026 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at http://www.eclipse.org/legal/epl-2.0
//

const legacyFont = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
const brandFont = "'Manrope','Segoe UI',Arial,sans-serif"

/**
 * Applies the Teron visual identity to localized transactional-email content.
 *
 * Some translations contain the former complete email shell while older ones
 * contain only the message fragment. Keeping the shell here makes both formats
 * render consistently and leaves translation files responsible only for copy.
 */
export function renderBrandedEmail (html: string, language?: string): string {
  const content = normalizeContent(extractContent(html))
  const emailLanguage = language?.toLowerCase() === 'pt-br' ? 'pt-BR' : (language ?? 'en')

  return `<!DOCTYPE html>
<html lang="${emailLanguage}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style>
    body, table, td, p, a, h1, h2, h3, span { font-family: ${brandFont} !important; }
    .email-content h1, .email-content h2, .email-content h3 { margin: 0 0 14px; color: #ffffff; font-size: 24px; line-height: 1.25; letter-spacing: -0.5px; }
    .email-content p { margin: 0 0 22px; color: #b6b6bb; font-size: 15px; line-height: 1.65; }
    .email-content a { color: #7aa7ff; }
    .email-content strong, .email-content b { color: #ffffff; }
    @media only screen and (max-width: 600px) {
      .email-outer { padding: 20px 12px !important; }
      .email-header { padding: 24px !important; }
      .email-content { padding: 30px 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#090a0f;color:#ffffff;font-family:${brandFont};-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#090a0f">
    <tr>
      <td class="email-outer" align="center" style="padding:48px 16px">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">
          <tr>
            <td class="email-header" style="padding:28px 40px;background-color:#000000;background-image:linear-gradient(120deg,#000000 55%,#111a2d 100%);border:1px solid #26262c;border-bottom:0;border-radius:16px 16px 0 0">
              <span style="display:block;color:#ffffff;font-size:24px;font-weight:700;line-height:1;letter-spacing:-0.6px">Teron</span>
              <div style="width:36px;height:3px;margin-top:20px;background-color:#2f6bff;border-radius:999px;font-size:0;line-height:0">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding:40px;background-color:#111217;border:1px solid #26262c;border-top:0;border-radius:0 0 16px 16px">
              ${content}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 16px 0;color:#6f6f77;font-size:12px;line-height:1.5">
              &copy; Teron
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function extractContent (html: string): string {
  const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? html
  const brandedContent =
    /<td style="background-color:#FFFFFF;padding:36px 40px;[^"]*">([\s\S]*?)<\/td><\/tr><tr><td align="center" style="padding:20px 0">/i.exec(
      body
    )?.[1]

  return (brandedContent ?? body).trim()
}

function normalizeContent (content: string): string {
  return content
    .replaceAll(legacyFont, brandFont)
    .replaceAll('background-color:#18181B', 'background-color:#2F6BFF')
    .replaceAll('background-color:#F9FAFB', 'background-color:#17171B')
    .replaceAll('border:1px solid #E4E4E7', 'border:1px solid #2D2F31')
    .replaceAll('border-top:1px solid #F4F4F5', 'border-top:1px solid #26262C')
    .replaceAll('color:#18181B', 'color:#FFFFFF')
    .replaceAll('color:#52525B', 'color:#B6B6BB')
    .replaceAll('color:#71717A', 'color:#7AA7FF')
    .replaceAll('color:#A1A1AA', 'color:#8A8A93')
}
