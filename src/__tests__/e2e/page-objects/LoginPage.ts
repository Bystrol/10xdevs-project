import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Page elements using data-testid selectors
  private get emailInput() {
    return this.getByTestId("email-input");
  }
  private get passwordInput() {
    return this.getByTestId("password-input");
  }
  private get loginButton() {
    return this.getByTestId("login-button");
  }
  private get registerLink() {
    return this.getByTestId("register-link");
  }
  private get resetPasswordLink() {
    return this.getByTestId("reset-password-link");
  }
  private get errorMessage() {
    return this.getByTestId("error-message");
  }
  private get successMessage() {
    return this.getByTestId("success-message");
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto("/login");
    await this.waitForLoad();
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.clickLogin();
    await this.waitForNavigation();
  }

  /**
   * Click register link
   */
  async clickRegisterLink() {
    await this.registerLink.click();
  }

  /**
   * Click reset password link
   */
  async clickResetPasswordLink() {
    await this.resetPasswordLink.click();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return (await this.successMessage.textContent()) || "";
  }

  /**
   * Check if login was successful by verifying redirect or presence of dashboard elements
   */
  async isLoginSuccessful(): Promise<boolean> {
    try {
      // Wait for redirect to dashboard or check for dashboard-specific elements
      await this.page.waitForURL("**/dashboard", { timeout: 5000 });
      return true;
    } catch {
      // Check for dashboard-specific test IDs if redirect doesn't work
      return await this.page.getByTestId("welcome-message").isVisible({ timeout: 1000 });
    }
  }

  /**
   * Verify login page elements are visible
   */
  async verifyLoginPageLoaded() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Verify error message is displayed
   */
  async verifyErrorMessage(expectedMessage: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toHaveText(expectedMessage);
  }

  /**
   * Verify success message is displayed
   */
  async verifySuccessMessage(expectedMessage: string) {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toHaveText(expectedMessage);
  }

  /**
   * Clear form fields
   */
  async clearForm() {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
