# E2E Testing with Playwright

This directory contains End-to-End tests for the WasteTrack Dashboard application using Playwright.

## Setup

### Prerequisites

- Node.js and npm installed
- Application dependencies installed (`npm install`)

### Browser Installation

Install Playwright browsers:

```bash
npx playwright install chromium
```

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests with UI mode (visual test runner)

```bash
npm run test:e2e:ui
```

### Debug tests

```bash
npm run test:e2e:debug
```

### Generate tests with codegen

```bash
npm run test:e2e:codegen
```

This will open a browser where you can interact with the application and Playwright will generate test code.

## Test Structure

```
e2e/
├── page-objects/          # Page Object Model classes
│   ├── BasePage.ts       # Base class with common utilities
│   ├── LoginPage.ts      # Login page object
│   └── DashboardPage.ts  # Dashboard page object
├── tests/                 # Test specifications
│   ├── auth/             # Authentication tests
│   │   └── login.spec.ts
│   └── csv-import/       # CSV import tests
│       └── upload.spec.ts
└── README.md             # This file
```

## Guidelines

### Page Object Model

- All page interactions are encapsulated in page object classes
- Use `data-testid` attributes for element selection
- Common utilities are available in `BasePage`

### Test Organization

- Tests follow the **Arrange, Act, Assert** pattern
- Each test is independent with proper setup/teardown
- Use descriptive test names

### Selectors

Always use `data-testid` attributes for reliable element selection:

```typescript
// Good
await page.getByTestId("login-button").click();

// Avoid
await page.locator('button:has-text("Login")').click();
```

### Visual Testing

Tests can include visual screenshots for regression testing:

```typescript
await expect(page).toHaveScreenshot("login-page.png");
```

### API Testing

For backend validation, use API testing alongside UI tests:

```typescript
// Wait for API response
const response = await page.waitForResponse("**/api/batches");
expect(response.status()).toBe(200);
```

### Parallel Execution

Tests run in parallel by default for faster execution. Configure in `playwright.config.ts`.

## Configuration

### Test Environment

- **Browser**: Chromium (Desktop Chrome) only
- **Base URL**: `http://localhost:4321`
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally

### Test Data

- Use test CSV files from `test-csv-files/` directory
- Mock external dependencies when needed
- Use realistic test data

### CI/CD Integration

The configuration includes:

- JUnit and JSON reports for CI systems
- Screenshot and video capture on failures
- Trace collection for debugging

## Best Practices

1. **Isolation**: Each test should be independent
2. **Reliability**: Use proper waits and assertions
3. **Maintainability**: Keep tests simple and focused
4. **Performance**: Tests should run fast (< 30 seconds)
5. **Debugging**: Use traces and screenshots for failures

## Troubleshooting

### Common Issues

1. **Tests timing out**: Increase timeout in config or use proper waits
2. **Element not found**: Check if `data-testid` attributes are added to components
3. **Flaky tests**: Use proper waits and avoid race conditions
4. **CI failures**: Check network timeouts and resource constraints

### Debug Mode

Use debug mode to step through tests:

```bash
npm run test:e2e:debug -- --grep "test name"
```

### Trace Viewer

View traces for failed tests:

```bash
npx playwright show-trace test-results/trace.zip
```
