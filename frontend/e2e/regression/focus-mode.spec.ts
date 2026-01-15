import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { waitForEditor } from '../utils/helpers';

test.describe('Focus Mode (EDITOR-3508)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForEditor(page);
  });

  test('REGRESSION: focus mode activates without crash', async ({ page }) => {
    // Create a bullet with text
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('TestBullet');

    // Wait for the bullet to be created
    await page.waitForTimeout(300);

    // Enter focus mode by clicking on the bullet grip (3 dots icon)
    const bulletWithText = page.locator('hydra-bullet-block', { hasText: 'TestBullet' }).first();
    await bulletWithText.hover();
    await bulletWithText.locator('.bullet-grip').click();

    // Wait for focus mode to activate
    await page.waitForSelector('[data-focus-mode="true"]', { timeout: 5000 });

    // CRITICAL: Focus mode should activate without console errors
    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: content visible after entering focus mode', async ({ page }) => {
    // Create a bullet
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.type('FocusContent');

    // Wait for content to be saved
    await page.waitForTimeout(300);

    // Enter focus mode
    const bullet = page.locator('hydra-bullet-block', { hasText: 'FocusContent' }).first();
    await bullet.hover();
    await bullet.locator('.bullet-grip').click();

    // Wait for focus mode
    await page.waitForSelector('[data-focus-mode="true"]', { timeout: 5000 });

    // CRITICAL: Content should still be visible after entering focus mode
    // In focus mode, content appears in the focus header
    await expect(page.getByTestId('focus-header-title')).toContainText('FocusContent');
    expect(monitor.hasErrors()).toBe(false);
  });
});
