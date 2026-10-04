import { expect, test, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
const local = process.env.TERON_LOCAL_REGRESSION === '1'
test.skip(!local, 'Requires disposable local regression stack')
const state = local ? JSON.parse(readFileSync('/tmp/teron-regression-accounts.json', 'utf8')) : { ws: {} }
async function login (page: Page): Promise<void> {
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
  await page.goto('/')
  await page.locator('input[name=email]').fill('user@regression.local')
  await page.locator('input[type=password]').fill('Regression123!')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/mode=workspaces/, { timeout: 30000 })
  await page.goto(`/workbench/${state.ws.workspaceUrl}/setting/profile`)
  await expect(page.getByText('Gerenciar identidades').first()).toBeVisible({ timeout: 120000 })
}
function sql (query: string): string {
  return execFileSync('docker', ['compose', '-f', 'dev/docker-compose.regression.yaml', 'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', query], { encoding: 'utf8' }).trim()
}
test('User replaces email through OTP and keeps global and workspace identities aligned', async ({ page }) => {
  await login(page)
  for (const email of ['user.replacement@regression.local', 'user@regression.local']) {
    await page.getByRole('button', { name: 'E-mail', exact: true }).click()
    await page.getByPlaceholder('E-mail', { exact: true }).fill(email)
    await page.getByRole('button', { name: 'Enviar código de confirmação' }).click()
    await expect(page.locator('[name=code-1]')).toBeVisible({ timeout: 30000 })
    const code = sql(`select o.code from global_account.otp o join global_account.social_id s on s._id=o.social_id where s.value='${email}' order by o.created_on desc limit 1`)
    expect(code).toMatch(/^\d{6}$/)
    for (let i = 0; i < 6; i++) await page.locator(`[name=code-${i + 1}]`).fill(code[i])
    await expect(page.locator('[name=code-1]')).toHaveCount(0, { timeout: 60000 })
    await expect(page.getByText(email, { exact: true })).toBeVisible()
    expect(sql(`select count(*) from channel c join global_account.social_id s on c._id=s._id::text where s.person_uuid='${state.user.account}' and s.type='email' and s.is_deleted=false and c.data->>'value'='${email}' and c.data->>'isDeleted'='false'`)).toBe('1')
    expect(sql(`select count(*) from channel c join global_account.social_id s on c._id=s._id::text where s.person_uuid='${state.user.account}' and s.type='email' and (c.data->>'key'<>s.key or c.data->>'value'<>s.value or (c.data->>'isDeleted')::boolean<>s.is_deleted)`)).toBe('0')
  }
  await page.reload()
  await expect(page.getByText('user@regression.local', { exact: true })).toBeVisible({ timeout: 120000 })
})
