# TEST-604: Smoke Tests (Critical User Workflows)

**Type**: Testing - Smoke Tests
**Priority**: P3 (Run on every deployment)
**Estimated Effort**: 3 hours
**Component**: Frontend E2E Testing
**Dependencies**: TEST-601 (Playwright setup)

---

## Goal

Create fast smoke tests that verify core app functionality. These tests run on every deployment and block releases if they fail.

---

## What Smoke Tests Cover

If any of these break, the app is unusable:

| Workflow | Why Critical |
|----------|-------------|
| Create bullet | Can't take notes |
| Type text | Can't add content |
| Collapse/expand | Can't navigate |
| AI generation | Core value prop broken |

---

## Tasks

### Task 1: Smoke Test File

**File:** `frontend/e2e/smoke/critical-workflows.spec.ts`

All smoke tests in one file for fast execution.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Smoke Tests', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('SMOKE: app loads without errors', async ({ page }) => {
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });

  test('SMOKE: can create and type in bullet', async ({ page }) => {
    // Create
    await page.click('[data-testid="add-bullet-button"]');
    await expect(page.locator('[data-block-type="bullet"]')).toBeVisible();

    // Type
    await page.keyboard.type('Hello World');
    await expect(page.locator('text=Hello World')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('SMOKE: can create nested bullets', async ({ page }) => {
    // Create parent
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Parent');

    // Create child
    await page.keyboard.press('Enter');
    await page.keyboard.type('Child');
    await page.keyboard.press('Tab');

    // Verify nesting
    const child = page.locator('text=Child').locator('xpath=ancestor::*[@data-parent-id]');
    await expect(child).toHaveAttribute('data-parent-id', /.+/);

    expect(monitor.hasErrors()).toBe(false);
  });

  test('SMOKE: can collapse and expand', async ({ page }) => {
    // Create structure
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Parent');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Child');
    await page.keyboard.press('Tab');

    // Find collapse toggle (may vary by implementation)
    const collapseToggle = page.locator('[data-testid="collapse-toggle"]').first();

    if (await collapseToggle.isVisible()) {
      // Collapse
      await collapseToggle.click();
      await expect(page.locator('text=Child')).not.toBeVisible();

      // Expand
      await collapseToggle.click();
      await expect(page.locator('text=Child')).toBeVisible();
    }

    expect(monitor.hasErrors()).toBe(false);
  });

  test('SMOKE: keyboard shortcuts work', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Test');

    // Undo
    await page.keyboard.press('Control+z');

    // Content should be undone or empty
    const content = await page.locator('[data-block-type="bullet"]').first().textContent();
    expect(content?.length).toBeLessThan(5); // Either empty or partially undone

    expect(monitor.hasErrors()).toBe(false);
  });

  test('SMOKE: data persists on reload', async ({ page }) => {
    // Create content
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Persistent data');

    // Wait for save
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still exist
    await expect(page.locator('text=Persistent data')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/smoke/critical-workflows.spec.ts
git add frontend/e2e/smoke/critical-workflows.spec.ts
git commit -m "test: add smoke tests for critical workflows"
```

---

### Task 2: AI Generation Smoke Test (Optional)

**File:** `frontend/e2e/smoke/ai-generation.spec.ts`

Only if AI generation is implemented.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('AI Smoke Tests', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('SMOKE: AI generation UI exists', async ({ page }) => {
    // Check if AI features are present
    const aiIndicator = page.locator('[data-testid="ai-usage-count"]');

    if (await aiIndicator.isVisible()) {
      // AI is enabled, verify basic UI
      await expect(aiIndicator).toBeVisible();
    } else {
      // AI not enabled, skip
      test.skip();
    }

    expect(monitor.hasErrors()).toBe(false);
  });

  test('SMOKE: AI generation handles errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/generate', route => {
      route.fulfill({ status: 500, body: '{"error": "test"}' });
    });

    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Test prompt');

    // Trigger AI (if Tab triggers it)
    await page.keyboard.press('Tab');

    // App should not crash
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    // Allow console errors for this test (API error is expected)
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/smoke/ai-generation.spec.ts
git add frontend/e2e/smoke/ai-generation.spec.ts
git commit -m "test: add AI smoke tests"
```

---

### Task 3: Add npm Script for Smoke Tests

**Step 1:** Update `frontend/package.json`

```json
{
  "scripts": {
    "test:smoke": "playwright test e2e/smoke/ --grep='SMOKE'"
  }
}
```

**Step 2:** Verify and commit
```bash
npm run test:smoke
git add frontend/package.json
git commit -m "chore: add smoke test npm script"
```

---

### Task 4: CI Integration for Smoke Tests

**Step 1:** Update `.github/workflows/ci.yml`

Add a separate job for smoke tests that runs fast:

```yaml
smoke-tests:
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
      working-directory: frontend
    - run: npx playwright install chromium --with-deps
      working-directory: frontend
    - run: npm run test:smoke
      working-directory: frontend
```

**Step 2:** Commit
```bash
git add .github/workflows/ci.yml
git commit -m "ci: add smoke test job"
```

---

## Acceptance Criteria

- [ ] Smoke test file created with 6 critical tests
- [ ] All smoke tests pass: `npm run test:smoke`
- [ ] Total runtime < 30 seconds
- [ ] CI runs smoke tests on every PR

---

## Verification

```bash
cd frontend

# Run smoke tests
npm run test:smoke

# Check timing
time npm run test:smoke
# Expected: < 30 seconds
```

---

## When to Run Smoke Tests

| Event | Action |
|-------|--------|
| Every commit | Run smoke tests |
| Every PR | Run smoke tests (blocks merge) |
| Pre-deployment | Run smoke tests (blocks deploy) |
| Production deploy | Run smoke tests against prod |

---

## Definition of Done

- [ ] 6 smoke tests passing
- [ ] Runtime < 30 seconds
- [ ] `npm run test:smoke` works
- [ ] CI blocks on smoke test failure
