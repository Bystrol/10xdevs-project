import { type Locator, type Page } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

/**
 * Base page object class providing common utilities for all page objects
 * Implements Page Object Model pattern for maintainable E2E tests
 */
export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || "http://localhost:4321";
  }

  /**
   * Navigate to a specific path
   */
  async goto(path = "") {
    await this.page.goto(`${this.baseURL}${path}`);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get element by data-testid attribute (recommended approach)
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Click element by data-testid
   */
  async clickByTestId(testId: string) {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input by data-testid
   */
  async fillByTestId(testId: string, value: string) {
    await this.getByTestId(testId).fill(value);
  }

  /**
   * Get text content by data-testid
   */
  async getTextByTestId(testId: string): Promise<string> {
    return (await this.getByTestId(testId).textContent()) || "";
  }

  /**
   * Check if element is visible by data-testid
   */
  async isVisibleByTestId(testId: string): Promise<boolean> {
    return await this.getByTestId(testId).isVisible();
  }

  /**
   * Wait for element to be visible by data-testid
   */
  async waitForTestId(testId: string, timeout = 10000) {
    await this.getByTestId(testId).waitFor({ state: "visible", timeout });
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(urlPattern);
  }

  /**
   * Mock API response for testing
   */
  async mockResponse(url: string, responseData: unknown, status = 200) {
    await this.page.route(url, async (route) => {
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(responseData),
      });
    });
  }

  /**
   * Clear browser context (cookies, localStorage, etc.)
   */
  async clearContext() {
    const context = this.page.context();
    await context.clearCookies();
    await context.clearPermissions();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Get current page URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Reload current page
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState("domcontentloaded");
  }
}
