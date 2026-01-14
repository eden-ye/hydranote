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
