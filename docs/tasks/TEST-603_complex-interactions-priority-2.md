# TEST-603: Complex Interaction Tests

**Type**: Testing - Edge Cases and Multi-System Interactions
**Priority**: P2 (Catches hard-to-reproduce bugs)
**Estimated Effort**: 6 hours
**Component**: Frontend E2E Testing
**Dependencies**: TEST-601, TEST-602

---

## Goal

Test complex scenarios where multiple systems interact (Yjs, BlockSuite, IndexedDB, React state). These tests catch race conditions, sync issues, and edge cases that simple tests miss.

---

## Background

Complex bugs come from:
- **Race conditions**: Async operations completing out of order
- **State sync**: Yjs CRDT, IndexedDB, React state getting out of sync
- **Concurrent edits**: Multiple tabs or users editing simultaneously
- **Persistence gaps**: Data lost between save and reload

---

## Tasks

### Task 1: Multi-Tab Sync Tests

**File:** `frontend/e2e/complex/multi-tab-sync.spec.ts`

Tests that data syncs correctly between browser tabs (Yjs + IndexedDB).

**Step 1:** Create test

```typescript
import { test, expect, BrowserContext } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Multi-Tab Sync', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('edits in tab 1 should appear in tab 2', async ({ page, context }) => {
    // Tab 1: Create bullet
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('From Tab 1');

    // Open Tab 2
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');

    // Wait for sync
    await page2.waitForTimeout(500);

    // Tab 2 should see the bullet
    await expect(page2.locator('text=From Tab 1')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('concurrent edits should merge without data loss', async ({ page, context }) => {
    // Setup: Both tabs start with same content
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Original');

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForTimeout(500);

    // Tab 1 edits
    await page.locator('text=Original').click();
    await page.keyboard.type(' Tab1');

    // Tab 2 edits (at same time)
    await page2.locator('text=Original').click();
    await page2.keyboard.type(' Tab2');

    // Wait for sync
    await page.waitForTimeout(1000);
    await page2.waitForTimeout(1000);

    // Both tabs should have both edits (Yjs merges)
    const text1 = await page.locator('[data-block-type="bullet"]').first().textContent();
    const text2 = await page2.locator('[data-block-type="bullet"]').first().textContent();

    expect(text1).toContain('Tab1');
    expect(text1).toContain('Tab2');
    expect(text1).toBe(text2); // Same content in both

    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/complex/multi-tab-sync.spec.ts
git add frontend/e2e/complex/multi-tab-sync.spec.ts
git commit -m "test: multi-tab sync tests"
```

---

### Task 2: Persistence Tests

**File:** `frontend/e2e/complex/persistence.spec.ts`

Tests that data survives page reload (IndexedDB).

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Persistence', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('bullets should persist across reload', async ({ page }) => {
    // Create content
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Persisted Content');

    // Wait for save
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still exist
    await expect(page.locator('text=Persisted Content')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });

  test('nested structure should persist hierarchy', async ({ page }) => {
    // Create parent + child
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Parent');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Child');
    await page.keyboard.press('Tab');

    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Both should exist with correct relationship
    await expect(page.locator('text=Parent')).toBeVisible();
    await expect(page.locator('text=Child')).toBeVisible();

    // Child should be indented (has parent)
    const child = page.locator('text=Child').locator('xpath=ancestor::*[@data-parent-id]');
    await expect(child).toHaveAttribute('data-parent-id', /.+/);

    expect(monitor.hasErrors()).toBe(false);
  });

  test('rapid edits should all persist', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Type quickly
    await page.keyboard.type('abcdefghijklmnopqrstuvwxyz', { delay: 10 });

    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // All characters should be there
    await expect(page.locator('text=abcdefghijklmnopqrstuvwxyz')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/complex/persistence.spec.ts
git add frontend/e2e/complex/persistence.spec.ts
git commit -m "test: persistence tests"
```

---

### Task 3: Rapid Interaction Tests

**File:** `frontend/e2e/complex/rapid-interactions.spec.ts`

Tests that the app handles fast user actions without breaking.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Rapid Interactions', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('rapid bullet creation should not lose data', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Create 20 bullets rapidly
    for (let i = 1; i <= 20; i++) {
      await page.keyboard.type(`Item ${i}`);
      await page.keyboard.press('Enter');
    }

    // All should exist
    for (let i = 1; i <= 20; i++) {
      await expect(page.locator(`text=Item ${i}`)).toBeVisible();
    }

    expect(monitor.hasErrors()).toBe(false);
  });

  test('rapid indent/outdent should maintain structure', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Test');

    // Rapidly toggle indent 10 times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(50);
    }

    // Should be back at root level
    const bullet = page.locator('text=Test').locator('xpath=ancestor::*[@data-block-type="bullet"]');
    await expect(bullet).not.toHaveAttribute('data-parent-id');

    expect(monitor.hasErrors()).toBe(false);
  });

  test('rapid undo/redo should not corrupt state', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Original');

    // Make changes
    await page.keyboard.type(' Added');

    // Rapidly undo/redo 5 times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(50);
      await page.keyboard.press('Control+Shift+z');
      await page.waitForTimeout(50);
    }

    // Content should be consistent (either original or with added)
    const content = await page.locator('[data-block-type="bullet"]').first().textContent();
    expect(content).toMatch(/Original( Added)?/);

    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/complex/rapid-interactions.spec.ts
git add frontend/e2e/complex/rapid-interactions.spec.ts
git commit -m "test: rapid interaction tests"
```

---

### Task 4: Error Recovery Tests

**File:** `frontend/e2e/complex/error-recovery.spec.ts`

Tests that the app recovers gracefully from errors.

**Step 1:** Create test

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('Error Recovery', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('app should recover from network interruption', async ({ page, context }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Before offline');

    // Go offline
    await context.setOffline(true);

    // Type while offline
    await page.keyboard.press('Enter');
    await page.keyboard.type('During offline');

    // Come back online
    await context.setOffline(false);
    await page.waitForTimeout(500);

    // Both should exist
    await expect(page.locator('text=Before offline')).toBeVisible();
    await expect(page.locator('text=During offline')).toBeVisible();

    // Reload to verify persistence
    await page.reload();
    await expect(page.locator('text=During offline')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('app should handle storage errors gracefully', async ({ page }) => {
    // This test verifies the app doesn't crash on storage errors
    // The actual error handling depends on implementation

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should be functional
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    // Can still interact
    await page.click('[data-testid="add-bullet-button"]');
    await expect(page.locator('[data-block-type="bullet"]')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });
});
```

**Step 2:** Run and commit
```bash
npx playwright test e2e/complex/error-recovery.spec.ts
git add frontend/e2e/complex/error-recovery.spec.ts
git commit -m "test: error recovery tests"
```

---

## Acceptance Criteria

- [ ] 4 complex test files created
- [ ] Tests cover multi-tab, persistence, rapid actions, errors
- [ ] All tests pass: `npx playwright test e2e/complex/`
- [ ] No flaky tests (run 3 times successfully)

---

## Verification

```bash
cd frontend

# Run all complex tests
npx playwright test e2e/complex/

# Run 3 times to check for flakiness
for i in 1 2 3; do npx playwright test e2e/complex/ || exit 1; done
```

---

## Definition of Done

- [ ] All complex test files committed
- [ ] Tests pass 3 consecutive times
- [ ] No console errors in any test
