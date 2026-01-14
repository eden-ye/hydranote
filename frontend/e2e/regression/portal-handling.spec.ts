import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { waitForEditor } from '../utils/helpers';

test.describe('Portal Handling (BUG-001)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('REGRESSION: app should handle reload gracefully', async ({ page }) => {
    await waitForEditor(page);

    // Reload can trigger orphan portal issues
    await page.reload();
    await page.waitForLoadState('networkidle');

    // CRITICAL: App must load without crash
    await expect(page.locator('[data-testid="editor-container"]')).toBeVisible();
    await expect(page.locator('hydra-bullet-block')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: typing in editor should not cause crashes', async ({ page }) => {
    await waitForEditor(page);

    // Type some content - this can trigger various editor issues
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.type('Test content for regression');

    // Wait for any async operations
    await page.waitForTimeout(500);

    // CRITICAL: Editor should still be functional
    await expect(page.locator('hydra-bullet-block')).toBeVisible();
    expect(monitor.hasErrors()).toBe(false);
  });
});
