import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('App Smoke Test', () => {
  test('should load without console errors', async ({ page }) => {
    const monitor = new ConsoleMonitor(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // App should render - use editor-container which exists in the codebase
    await expect(page.locator('[data-testid="editor-container"]')).toBeVisible();

    // No console errors
    expect(monitor.hasErrors()).toBe(false);
  });
});
