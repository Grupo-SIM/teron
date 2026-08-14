import { expect, type Locator, type Page } from '@playwright/test'
import { CommonPage } from './common-page'
import { SignUpData } from './common-types'

export class SignInJoinPage extends CommonPage {
  readonly page: Page

  constructor (page: Page) {
    super(page)
    this.page = page
  }

  inputEmail = (): Locator => this.page.locator('input[name="email"]')
  inputPassword = (): Locator => this.page.getByTestId('auth-password')
  buttonSubmit = (): Locator => this.page.getByTestId('join-form-submit')
  buttonToggle = (): Locator => this.page.getByTestId('join-form-toggle')
  buttonJoinWithThisAccount = (): Locator => this.page.getByTestId('join-with-this-account')

  async join (data: Pick<SignUpData, 'email' | 'password'>): Promise<void> {
    await Promise.race([
      this.buttonSubmit().waitFor({ state: 'visible', timeout: 10000 }),
      this.buttonJoinWithThisAccount().waitFor({ state: 'visible', timeout: 10000 })
    ])

    const submitBtn = this.buttonSubmit()
    const toggleBtn = this.buttonToggle()

    const submitText = await submitBtn.textContent().catch(() => '')
    if (submitText != null && submitText.toLowerCase().includes('sign up')) {
      await toggleBtn.click()
      await this.inputEmail().waitFor({ state: 'visible', timeout: 5000 })
    }
    await this.inputEmail().fill(data.email)
    await this.inputPassword().fill(data.password)
    await expect(this.buttonSubmit()).toBeEnabled()
    await this.buttonSubmit().click()
  }
}
