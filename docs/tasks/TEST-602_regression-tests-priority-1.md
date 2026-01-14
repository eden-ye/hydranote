# TEST-602: Regression Tests for Known Bug Areas

**Type**: Testing - Regression Coverage
**Priority**: P1 (Prevents known bugs from returning)
**Estimated Effort**: 4 hours
**Component**: Frontend E2E Testing
**Dependencies**: TEST-601 (Playwright setup)

---

## Goal

Write Playwright tests for features that previously had bugs. These tests prevent regressions by verifying the exact scenarios that failed before.

---

## Background

These areas have had real bugs:

| Bug | What Broke | Root Cause |
|-----|-----------|------------|
| EDITOR-3508 | Focus mode didn't filter content | No conditional rendering |
| EDITOR-3510 | `[] ` didn't become checkbox | Off-by-one in text parsing |
| EDITOR-3701 | Bullets drifted during drag | Wrong drop zone calculation |
| BUG-001 | App crashed on portal open | Null model in Lit component |

---

## Tasks

### Task 1: Create Test Helpers

**File:** `frontend/e2e/utils/helpers.ts`

**Step 1:** Create helper functions

```typescript
import { Page } from '@playwright/test';

export async function createBullet(page: Page, text: string): Promise<void> {
  await page.click('[data-testid="add-bullet-button"]');
  await page.keyboard.type(text);
}

export async function createChildBullet(page: Page, text: string): Promise<void> {
  await page.keyboard.press('Enter');
  await page.keyboard.type(text);
  await page.keyboard.press('Tab');
}

export async function getBulletTexts(page: Page): Promise<string[]> {
  return page.locator('[data-block-type="bullet"]').allTextContents();
}
```

**Step 2:** Commit
```bash
git add frontend/e2e/utils/helpers.ts
git commit -m "feat: add E2E test helper functions"
```

---

### Task 2: Focus Mode Regression Test

**File:** `frontend/e2e/regression/focus-mode.spec.ts`

**Bug to prevent:** Siblings visible when they should be hidden in focus mode.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { createBullet, createChildBullet } from '../utils/helpers';

test.describe('Focus Mode (EDITOR-3508)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('REGRESSION: siblings should be hidden in focus mode', async ({ page }) => {
    // Setup
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child');
    await page.keyboard.press('Escape'); // Exit child
    await createBullet(page, 'Sibling');

    // Enter focus mode on Parent
    await page.click('[data-block-id="parent"] .grip-handle');

    // CRITICAL: Sibling must be hidden
    await expect(page.locator('text=Sibling')).not.toBeVisible();
    await expect(page.locator('text=Parent')).toBeVisible();
    await expect(page.locator('text=Child')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('should restore all content on exit', async ({ page }) => {
    await createBullet(page, 'Target');
    await page.click('[data-block-id="target"] .grip-handle');
    await page.click('[data-testid="exit-focus-mode"]');

    await expect(page.locator('text=Target')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/regression/focus-mode.spec.ts
git add frontend/e2e/regression/focus-mode.spec.ts
git commit -m "test: focus mode regression (EDITOR-3508)"
```

---

### Task 3: Markdown Shortcuts Regression Test

**File:** `frontend/e2e/regression/markdown-shortcuts.spec.ts`

**Bug to prevent:** Typing `[] ` doesn't create checkbox.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Markdown Shortcuts (EDITOR-3510)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('REGRESSION: "[] " should create checkbox', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('[] ');

    // CRITICAL: Checkbox must appear
    await expect(page.locator('[type="checkbox"]')).toBeVisible();
    await expect(page.locator('text=[]')).not.toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: "# " should create heading', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('# ');

    await expect(page.locator('[data-block-type="heading1"]')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });

  test('should NOT convert without space', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('[]');

    await expect(page.locator('text=[]')).toBeVisible();
    await expect(page.locator('[type="checkbox"]')).not.toBeVisible();
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/regression/markdown-shortcuts.spec.ts
git add frontend/e2e/regression/markdown-shortcuts.spec.ts
git commit -m "test: markdown shortcuts regression (EDITOR-3510)"
```

---

### Task 4: Drag Position Regression Test

**File:** `frontend/e2e/regression/drag-position.spec.ts`

**Bug to prevent:** Bullets drift to wrong position when dropped.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { createBullet, getBulletTexts } from '../utils/helpers';

test.describe('Drag Position (EDITOR-3701)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('REGRESSION: bullet should land at drop position', async ({ page }) => {
    await createBullet(page, 'First');
    await page.keyboard.press('Enter');
    await createBullet(page, 'Second');
    await page.keyboard.press('Enter');
    await createBullet(page, 'Third');

    // Drag First to after Third
    const source = page.locator('text=First').locator('xpath=..').locator('.grip-handle');
    const target = page.locator('text=Third');
    await source.dragTo(target);

    // CRITICAL: Order must be Second, Third, First
    const texts = await getBulletTexts(page);
    expect(texts).toContain('Second');
    expect(texts.indexOf('Second')).toBeLessThan(texts.indexOf('Third'));

    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/regression/drag-position.spec.ts
git add frontend/e2e/regression/drag-position.spec.ts
git commit -m "test: drag position regression (EDITOR-3701)"
```

---

### Task 5: Portal Handling Regression Test

**File:** `frontend/e2e/regression/portal-handling.spec.ts`

**Bug to prevent:** App crashes with null model error.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Portal Handling (BUG-001)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('REGRESSION: portal picker should open without crash', async ({ page }) => {
    await page.click('[data-testid="create-portal-button"]');

    // CRITICAL: Modal must open without console errors
    await expect(page.locator('[data-testid="portal-picker-modal"]')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: app should handle reload gracefully', async ({ page }) => {
    // Reload can trigger orphan portal issues
    await page.reload();
    await page.waitForLoadState('networkidle');

    // CRITICAL: App must load without crash
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/regression/portal-handling.spec.ts
git add frontend/e2e/regression/portal-handling.spec.ts
git commit -m "test: portal handling regression (BUG-001)"
```

---

## Acceptance Criteria

- [ ] 4 regression test files created
- [ ] Each test targets the specific bug scenario
- [ ] All tests pass: `npx playwright test e2e/regression/`
- [ ] No console errors in any test

---

## Verification

```bash
cd frontend
npx playwright test e2e/regression/
# Expected: All 4 test files pass
```

---

## Definition of Done

- [ ] All regression tests committed
- [ ] Tests would catch original bugs if reintroduced
- [ ] All tests pass in CI
