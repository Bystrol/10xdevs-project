import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  // Page elements using data-testid selectors
  private get welcomeMessage() {
    return this.getByTestId("welcome-message");
  }
  private get userMenu() {
    return this.getByTestId("user-menu");
  }
  private get logoutButton() {
    return this.getByTestId("logout-button");
  }
  private get importsLink() {
    return this.getByTestId("imports-link");
  }
  private get batchesList() {
    return this.getByTestId("batches-list");
  }
  private get csvUploader() {
    return this.getByTestId("csv-uploader");
  }

  /**
   * Navigate to dashboard page
   */
  async goto() {
    await super.goto("/");
    await this.waitForLoad();
  }

  /**
   * Get welcome message text
   */
  async getWelcomeMessage(): Promise<string> {
    return (await this.welcomeMessage.textContent()) || "";
  }

  /**
   * Click user menu
   */
  async openUserMenu() {
    await this.userMenu.click();
  }

  /**
   * Click logout button
   */
  async clickLogout() {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.waitForNavigation();
  }

  /**
   * Click imports link to navigate to imports page
   */
  async goToImports() {
    await this.importsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Verify dashboard page is loaded
   */
  async verifyDashboardLoaded() {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.userMenu).toBeVisible();
  }

  /**
   * Check if user is logged in by verifying dashboard elements
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await expect(this.welcomeMessage).toBeVisible({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get number of batches displayed
   */
  async getBatchesCount(): Promise<number> {
    const batches = await this.batchesList.locator('[data-testid="batch-item"]').all();
    return batches.length;
  }

  /**
   * Verify CSV uploader is visible
   */
  async verifyCsvUploaderVisible() {
    await expect(this.csvUploader).toBeVisible();
  }

  /**
   * Take dashboard screenshot for visual comparison
   */
  async takeDashboardScreenshot() {
    await this.takeScreenshot("dashboard-loaded");
  }
}
