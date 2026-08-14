import { expect, type Locator, type Page } from '@playwright/test'
import { PlatformURI } from '../utils'

export class LoginPage {
  readonly page: Page

  constructor (page: Page) {
    this.page = page
  }

  inputEmail = (): Locator => this.page.locator('input[name=email]')
  inputPassword = (): Locator => this.page.locator('input[name=current-password]')
  buttonLogin = (): Locator => this.page.getByTestId('auth-submit')
  loginWithPassword = (): Locator => this.page.getByTestId('auth-method-toggle')
  linkSignUp = (): Locator => this.page.locator('a[href="/cadastro"]')
  invalidCredentialsMessage = (): Locator => this.page.locator('.auth-error')

  recoverLink = (): Locator => this.page.getByTestId('auth-recover')
  passwordRecovery = (): Locator => this.page.locator('h1.auth-title')
  recoveryLoginText = (): Locator => this.page.locator('.auth-back-action')
  recoverySignUpText = (): Locator => this.linkSignUp()
  recoveryLogin = (): Locator => this.page.locator('.auth-back-action')
  recoverySignUp = (): Locator => this.linkSignUp()

  profileButton = (): Locator => this.page.locator('#profile-button')
  popupItemButton = (hasText: string): Locator => this.page.locator('div.popup button[class*="menu"]', { hasText })

  // ACTIONS
  async goto (): Promise<void> {
    await (await this.page.goto(`${PlatformURI}/entrar`))?.finished()
  }

  // ACTIONS
  async gotoAdmin (): Promise<void> {
    await (await this.page.goto(`${PlatformURI}/entrar/admin`))?.finished()
  }

  async clickSignUp (): Promise<void> {
    await this.linkSignUp().click()
  }

  async clickOnRecover (): Promise<void> {
    await this.recoverLink().click()
  }

  async clickOnRecoveryLogin (): Promise<void> {
    await this.recoveryLogin().click()
  }

  async clickOnRecoverySignUp (): Promise<void> {
    await this.recoverySignUp().click()
  }

  async login (email: string, password: string): Promise<void> {
    await this.inputEmail().fill(email)
    if (!(await this.inputPassword().isVisible())) await this.loginWithPassword().click()
    await this.inputPassword().fill(password)
    expect(await this.buttonLogin().isEnabled()).toBe(true)
    await this.buttonLogin().click()
  }

  async openProfileMenu (): Promise<void> {
    await this.profileButton().click()
  }

  // ASSERTS

  async checkIfErrorMessageIsShown (message: string): Promise<void> {
    if (message === 'wrong-credentials') {
      await expect(this.invalidCredentialsMessage()).toBeVisible()
    }
  }

  async checkIfLoginButtonIsDisabled (): Promise<void> {
    await expect(this.buttonLogin()).toBeDisabled()
  }

  async checkIfPasswordRecoveryIsVisible (): Promise<void> {
    await expect(this.passwordRecovery()).toBeVisible()
    await expect(this.recoveryLoginText()).toBeVisible()
    await expect(this.recoverySignUpText()).toBeVisible()
  }
}
