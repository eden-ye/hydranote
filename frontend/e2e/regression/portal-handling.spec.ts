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

  test('REGRESSION: portal search modal should open without crash', async ({ page }) => {
    await waitForEditor(page);

    // Focus a bullet block
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.waitForTimeout(200);

    // Open portal search modal with Cmd+S (or Ctrl+S on Windows)
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+s' : 'Control+s');

    // CRITICAL: Portal search modal must open without console errors
    await expect(page.locator('[data-testid="portal-search-modal"]')).toBeVisible({ timeout: 5000 });

    // Modal should have the search input ready
    await expect(page.locator('[data-testid="portal-search-input"]')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: portal search modal can be closed', async ({ page }) => {
    await waitForEditor(page);

    // Focus and open portal search
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Meta+s');

    // Wait for modal to open
    await expect(page.locator('[data-testid="portal-search-modal"]')).toBeVisible({ timeout: 5000 });

    // Close modal by pressing Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.locator('[data-testid="portal-search-modal"]')).not.toBeVisible();

    // CRITICAL: No errors during open/close cycle
    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: app should handle reload gracefully', async ({ page }) => {
    await waitForEditor(page);

    // Type some content first
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.type('Before reload');
    await page.waitForTimeout(300);

    // Reload can trigger orphan portal issues
    await page.reload();
    await page.waitForLoadState('networkidle');

    // CRITICAL: App must load without crash
    await expect(page.locator('[data-testid="editor-container"]')).toBeVisible();
    await expect(page.locator('hydra-bullet-block')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: multiple portal search open/close cycles', async ({ page }) => {
    await waitForEditor(page);

    // Open and close portal search multiple times
    for (let i = 0; i < 3; i++) {
      // Re-focus bullet before each cycle (focus may be lost after modal close)
      await page.locator('hydra-bullet-block rich-text').first().click();
      await page.waitForTimeout(200);

      await page.keyboard.press('Meta+s');
      await expect(page.locator('[data-testid="portal-search-modal"]')).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="portal-search-modal"]')).not.toBeVisible();

      await page.waitForTimeout(200);
    }

    // CRITICAL: No memory leaks or crashes after multiple cycles
    expect(monitor.hasErrors()).toBe(false);

    // Editor should still be functional
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.type('Still working');
    await expect(page.locator('hydra-bullet-block', { hasText: 'Still working' })).toBeVisible();
  });
});
