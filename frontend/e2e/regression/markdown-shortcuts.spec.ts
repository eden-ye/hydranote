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
