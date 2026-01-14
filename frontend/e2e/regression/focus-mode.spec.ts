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
