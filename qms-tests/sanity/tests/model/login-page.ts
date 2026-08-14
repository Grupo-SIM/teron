import { expect, type Locator, type Page } from '@playwright/test'
import { PlatformURI } from '../utils'

export class LoginPage {
  readonly page: Page
  readonly inputEmail: Locator
  readonly inputPassword: Locator
  readonly buttonLogin: Locator
  readonly buttonSignUp: Locator
  readonly loginWithPassword: Locator
  readonly accountNotFoundMessage: Locator
  constructor (page: Page) {
    this.page = page
    this.inputEmail = page.locator('input[name=email]')
    this.inputPassword = page.locator('input[name=current-password]')
    this.buttonLogin = page.getByTestId('auth-submit')
    this.buttonSignUp = page.locator('a[href="/cadastro"]')
    this.loginWithPassword = page.getByTestId('auth-method-toggle')
    this.accountNotFoundMessage = page.locator('.auth-error')
  }

  async goto (): Promise<void> {
    await (await this.page.goto(`${PlatformURI}/entrar`))?.finished()
  }

  async login (email: string, password: string): Promise<void> {
    await this.inputEmail.fill(email)
    if (!(await this.inputPassword.isVisible())) await this.loginWithPassword.click()
    await this.inputPassword.fill(password)

    // Wait for form validation to complete
    await this.page.waitForTimeout(1000)

    expect(await this.buttonLogin.isEnabled()).toBe(true)
    await this.buttonLogin.click()
  }

  async checkIfErrorMessageIsShown (message: string): Promise<void> {
    if (message === 'Account not found or the provided credentials are incorrect') {
      await expect(this.accountNotFoundMessage).toContainText(message)
    }
  }

  async checkIfUserIsLoggedIn (credentials: string): Promise<void> {
    if (credentials === 'wrong-email' || credentials === 'wrong-password') {
      await expect(this.buttonLogin).toBeVisible()
      await expect(this.accountNotFoundMessage).toBeVisible()
    }
    if (credentials === 'correct-credentials') {
      await expect(this.page.getByText('sanity-ws')).toBeVisible()
    }
  }
}
