# TEST-601: Playwright E2E Testing Setup

**Type**: Testing Infrastructure
**Priority**: P0 (Blocks all other test tickets)
**Estimated Effort**: 4 hours
**Component**: Frontend E2E Testing
**Dependencies**: None

---

## Context

After retrospective analysis (see `docs/retrospectives/project-retrospective-2026-01-14.md`), we identified that ~40-60% of development time is spent on rework due to bugs found after features are marked "complete". The root cause is completing features based on unit tests + build without browser verification.

**Key Finding**: "Tests pass ✅, Build succeeds ✅" but feature is broken in browser ❌

**Solution**: Integrate Playwright into TDD workflow to catch browser-level issues during development, not after.

---

## Objectives

1. Install and configure Playwright for Hydra Notes frontend
2. Set up project structure for test organization by ticket/feature
3. Configure test environments (local, SAT, PROD)
4. Add console error monitoring to all tests
5. Create example test demonstrating best practices
6. Update CI/CD pipeline to run Playwright tests

---

## Requirements

### Installation

- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Install browsers: `npx playwright install`
- [ ] Install browser dependencies: `npx playwright install-deps`

### Configuration

Create `frontend/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Project Structure

Create directory structure:

```
e2e/
├── playwright/
│   ├── fixtures/          # Shared fixtures (auth, test data)
│   ├── utils/             # Helper functions (console monitoring, etc.)
│   ├── EDITOR-3508/       # Tests for focus mode (regression)
│   ├── EDITOR-3510/       # Tests for markdown shortcuts (regression)
│   ├── EDITOR-3701/       # Tests for drag positioning (regression)
│   ├── BUG-001/           # Tests for orphaned portal handling (regression)
│   └── example.spec.ts    # Example test with best practices
└── expectations/          # Existing Chrome MCP test scenarios (keep)
```

### Environment Configuration

Create `e2e/playwright/.env.example`:

```bash
# Playwright Test Environments
BASE_URL=http://localhost:5173

# Test user credentials (use .env.local for actual values)
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
```

### Console Error Monitoring

Create `e2e/playwright/utils/console-monitor.ts`:

```typescript
import { Page, ConsoleMessage } from '@playwright/test';

export interface ConsoleError {
  type: string;
  text: string;
  location?: string;
  timestamp: Date;
}

export class ConsoleMonitor {
  private errors: ConsoleError[] = [];

  constructor(private page: Page) {
    this.setupListener();
  }

  private setupListener() {
    this.page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        this.errors.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location().url,
          timestamp: new Date(),
        });
      }
    });
  }

  getErrors(): ConsoleError[] {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
```

### Example Test

Create `e2e/playwright/example.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from './utils/console-monitor';

test.describe('Example Test - Best Practices', () => {
  let consoleMonitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    // Set up console monitoring
    consoleMonitor = new ConsoleMonitor(page);

    // Navigate to app
    await page.goto('/');
  });

  test('should load without console errors', async ({ page }) => {
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');

    // Verify no console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should create a new bullet', async ({ page }) => {
    // Primary user flow
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Test bullet');

    // Verify bullet created
    await expect(page.locator('text=Test bullet')).toBeVisible();

    // Verify no console errors during interaction
    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

### CI/CD Integration

Update `.github/workflows/ci.yml`:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npx playwright test
  working-directory: frontend

- name: Upload Playwright Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: frontend/playwright-report/
    retention-days: 30
```

### Documentation

Update `docs/design/testing-workflow.md`:
- Add Playwright to testing strategy section
- Document when to use Playwright vs Chrome MCP
- Add troubleshooting guide for common issues

---

## Acceptance Criteria

- [ ] Playwright installed and configured
- [ ] Project structure created: `e2e/playwright/` with subdirectories
- [ ] Console monitoring utility implemented and tested
- [ ] Example test passes: `npx playwright test example.spec.ts`
- [ ] CI/CD pipeline updated to run Playwright tests
- [ ] Documentation updated with Playwright usage
- [ ] `package.json` includes test scripts:
  - `npm run test:e2e` - Run all Playwright tests
  - `npm run test:e2e:ui` - Run with UI mode
  - `npm run test:e2e:debug` - Run in headed mode

---

## Testing Strategy

### Step 4: Run Tests
```bash
# Playwright should pass
npx playwright test e2e/playwright/example.spec.ts

# Unit tests should still pass
npm run test
```

### Step 7: Chrome E2E
- Manually test example test scenarios in browser
- Verify console monitoring works correctly
- Test with both clean and error states

### Step 7.5: Browser Verification
- Open http://localhost:5173
- Run example test and observe browser behavior
- Verify console shows zero errors
- Screenshot: Passing test run + Playwright HTML report

---

## Known Risks

1. **Flaky tests**: Playwright tests can be flaky with async operations
   - **Mitigation**: Use proper waitFor* methods, avoid hard waits

2. **CI environment differences**: Tests pass locally but fail in CI
   - **Mitigation**: Test with `CI=true` locally before pushing

3. **Test maintenance overhead**: Need to update tests when UI changes
   - **Mitigation**: Use data-testid attributes, avoid brittle selectors

---

## Related Tickets

- **Blocks**: TEST-602, TEST-603, TEST-604 (all depend on this setup)
- **Implements**: Retrospective action item "Priority 1: Add Browser Verification Gate"

---

## Success Metrics

- [ ] Example test runs successfully in <5 seconds
- [ ] Console monitoring detects errors correctly
- [ ] CI pipeline runs Playwright tests on every PR
- [ ] HTML report generated and accessible
- [ ] Zero false positives in example test

---

## Notes

**From Retrospective**:
> "You have a great TDD workflow. You're just not executing step 7 (E2E) before step 8 (mark complete)."
>
> "Time saved: ~30-40% reduction in total development time."

This ticket establishes the foundation for preventing the "tests pass but feature is broken" problem.

**Playwright vs Chrome MCP**:
- **Playwright**: Automated, repeatable, fast feedback during development
- **Chrome MCP**: Exploratory, edge case discovery, visual verification
- **Both are required** for comprehensive E2E testing

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Example test passes in CI
- [ ] Documentation updated
- [ ] Team can run `npm run test:e2e` successfully
- [ ] Console monitoring utility validated with real errors
- [ ] Screenshot evidence: passing test + HTML report
