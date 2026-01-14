# TEST-601: Playwright E2E Testing Setup

**Type**: Testing Infrastructure
**Priority**: P0 (Blocks all other test tickets)
**Estimated Effort**: 2 hours
**Component**: Frontend E2E Testing
**Dependencies**: None

---

## Goal

Set up Playwright for automated browser testing so we can catch "tests pass but feature is broken" bugs before they reach users.

---

## Tasks

### Task 1: Install Playwright

**Step 1:** Install Playwright and browsers
```bash
cd frontend
npm install -D @playwright/test
npx playwright install chromium
```

**Step 2:** Verify installation
```bash
npx playwright --version
# Expected: Version @playwright/test@X.XX.X
```

**Step 3:** Commit
```bash
git add package.json package-lock.json
git commit -m "chore: install Playwright for E2E testing"
```

---

### Task 2: Create Configuration

**Step 1:** Create `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
```

**Step 2:** Commit
```bash
git add frontend/playwright.config.ts
git commit -m "chore: add Playwright configuration"
```

---

### Task 3: Create Directory Structure

**Step 1:** Create test directories
```bash
mkdir -p frontend/e2e/utils
mkdir -p frontend/e2e/smoke
mkdir -p frontend/e2e/regression
```

**Step 2:** Commit
```bash
git add frontend/e2e/.gitkeep 2>/dev/null || true
git commit -m "chore: create Playwright test directory structure" --allow-empty
```

---

### Task 4: Create Console Monitor Utility

**Step 1:** Create `frontend/e2e/utils/console-monitor.ts`

```typescript
import { Page } from '@playwright/test';

export class ConsoleMonitor {
  private errors: string[] = [];

  constructor(page: Page) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(msg.text());
      }
    });
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): string[] {
    return this.errors;
  }

  clear(): void {
    this.errors = [];
  }
}
```

**Step 2:** Commit
```bash
git add frontend/e2e/utils/console-monitor.ts
git commit -m "feat: add console error monitoring utility"
```

---

### Task 5: Create Example Smoke Test

**Step 1:** Create `frontend/e2e/smoke/app-loads.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('App Smoke Test', () => {
  test('should load without console errors', async ({ page }) => {
    const monitor = new ConsoleMonitor(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should render
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    // No console errors
    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run test to verify it works
```bash
cd frontend
npx playwright test e2e/smoke/app-loads.spec.ts
# Expected: 1 passed
```

**Step 3:** Commit
```bash
git add frontend/e2e/smoke/app-loads.spec.ts
git commit -m "test: add app load smoke test"
```

---

### Task 6: Add npm Scripts

**Step 1:** Update `frontend/package.json` scripts section

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

**Step 2:** Verify scripts work
```bash
npm run test:e2e
# Expected: All tests pass
```

**Step 3:** Commit
```bash
git add frontend/package.json
git commit -m "chore: add Playwright npm scripts"
```

---

### Task 7: Update CI/CD

**Step 1:** Update `.github/workflows/ci.yml` - add after existing test step:

```yaml
- name: Install Playwright
  run: npx playwright install chromium --with-deps
  working-directory: frontend

- name: Run E2E Tests
  run: npm run test:e2e
  working-directory: frontend

- name: Upload Playwright Report
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

**Step 2:** Commit
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Playwright E2E tests to CI pipeline"
```

---

## Acceptance Criteria

- [ ] `npm run test:e2e` runs successfully
- [ ] Console monitor detects errors when present
- [ ] Smoke test passes in CI
- [ ] HTML report generated on failure

---

## Verification

After completing all tasks, run:
```bash
cd frontend
npm run test:e2e
# Expected: All tests pass, <5 seconds
```

---

## Definition of Done

- [ ] All tasks completed and committed
- [ ] CI passes with Playwright tests
- [ ] `npm run test:e2e` documented in CLAUDE.md
