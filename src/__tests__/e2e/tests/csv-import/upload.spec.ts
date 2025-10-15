import { expect, test } from "@playwright/test";
import { DashboardPage } from "../../page-objects/DashboardPage";
import { LoginPage } from "../../page-objects/LoginPage";

test.describe("CSV Import Flow", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // ARRANGE - Setup authenticated session
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }

    // Login first
    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME, process.env.E2E_PASSWORD);
    await dashboardPage.verifyDashboardLoaded();
  });

  test("should display CSV uploader on imports page", async ({ page }) => {
    // ARRANGE & ACT
    await dashboardPage.goToImports();

    // ASSERT
    await page.waitForLoadState("networkidle");
    await dashboardPage.verifyCsvUploaderVisible();
    expect(page.url()).toContain("/imports");
  });

  test("should upload valid CSV file successfully", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // Wait for batches list to load before getting count
    await page.waitForLoadState("networkidle");
    const initialBatchesCount = await dashboardPage.getBatchesCount();

    // ACT - Upload valid CSV file
    await fileInput.setInputFiles("./test-csv-files/happy_path.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for success message and batch creation
    const successMessage = dashboardPage.getByTestId("upload-success");
    await expect(successMessage).toBeVisible();

    // Verify batch appears in the list
    await page.waitForLoadState("networkidle");
    const finalBatchesCount = await dashboardPage.getBatchesCount();
    expect(finalBatchesCount).toBe(initialBatchesCount + 1);
  });

  test("should handle invalid CSV file gracefully", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload invalid CSV file
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/malformed_csv.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
  });

  test("should validate file size limits", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload file that exceeds size limit
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/over_limit_records.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for size limit error
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("File exceeds the 1000 record limit");
  });

  test("should show progress during upload", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");
    const progressBar = dashboardPage.getByTestId("upload-progress");

    // ACT - Start upload
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/happy_path.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Progress bar should be visible during upload
    await expect(progressBar).toBeVisible();

    // Wait for completion
    const successMessage = dashboardPage.getByTestId("upload-success");
    await expect(successMessage).toBeVisible();

    // Progress should be hidden after completion
    await expect(progressBar).not.toBeVisible();
  });

  test("should handle empty CSV file", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload empty CSV file
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/empty_file.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for empty file error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
  });

  test("should reject CSV with future dates", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload CSV file with future dates
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/future_dates.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for future date error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("date cannot be in the future");
  });

  test("should reject CSV with invalid date formats", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload CSV file with invalid date formats
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/invalid_date_format.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for invalid date format error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("invalid date format");
  });

  test("should reject CSV with invalid quantities", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload CSV file with invalid quantities
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/invalid_quantities.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for invalid quantity error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("quantity must be a positive integer");
  });

  test("should reject CSV with missing required headers", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload CSV file with missing headers
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/missing_headers.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for missing headers error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("Missing required columns");
  });

  test("should reject CSV with unknown waste types", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload CSV file with unknown waste types
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/unknown_waste_types.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for unknown waste type error message
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
  });

  test("should reject CSV with mixed valid and invalid records", async ({ page }) => {
    // ARRANGE
    await dashboardPage.goToImports();
    const fileInput = dashboardPage.getByTestId("file-input");

    // ACT - Upload CSV file with mixed valid/invalid records
    await page.waitForLoadState("networkidle");
    await fileInput.setInputFiles("./test-csv-files/mixed_valid_invalid.csv");

    const uploadButton = dashboardPage.getByTestId("upload-button");
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    // ASSERT - Check for validation error (should fail on first invalid row)
    await page.waitForLoadState("networkidle");
    const errorMessage = dashboardPage.getByTestId("upload-error");
    await expect(errorMessage).toBeVisible();
    // The error could be any validation error depending on which row fails first
  });
});
